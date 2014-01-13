// -*- mode: js; coding: utf-8 -*-

// FIXME: remove this, used only for DEBUG
_ = bind(console, console.info);

(function() {
    /*
     * Simple JavaScript Inheritance
     * By John Resig http://ejohn.org/
     * MIT Licensed.
     */

    // Inspired by base2 and Prototype

    var initializing = false;
    var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

    // The base Class implementation (does nothing)
    this.Class = function(){};

    // Create a new Class that inherits from this class
    Class.extend = function(prop) {
        var _super = this.prototype;

        // Instantiate a base class (but only create the instance,
        // don't run the init constructor)
        initializing = true;
        var prototype = new this();
        initializing = false;

        // Copy the properties over onto the new prototype
        for (var name in prop) {

	    // Check if we're overwriting an existing function
	    prototype[name] = typeof prop[name] == "function" &&
		typeof _super[name] == "function" && fnTest.test(prop[name]) ?
		(function(name, fn){
		    return function() {
			var tmp = this._super;

			// Add a new ._super() method that is the same method
			// but on the super-class
			this._super = _super[name];

			// The method only need to be bound temporarily, so we
			// remove it when we're done executing
			var ret = fn.apply(this, arguments);
			this._super = tmp;

			return ret;
		    };
		})(name, prop[name]) :
	    prop[name];
        }

        // The dummy class constructor
        function Class() {
	    // All construction is actually done in the init method
	    if ( !initializing && this.init )
		this.init.apply(this, arguments);
        }

        // Populate our constructed prototype object
        Class.prototype = prototype;

        // Enforce the constructor to be what we expect
        Class.prototype.constructor = Class;

        // And make this class extendable
        Class.extend = arguments.callee;

	// FIXME: Move to wise_getMethods
	Class.prototype.getMethods = function () {
	    var res = [];
	    for(var m in this) {
		if ((typeof this[m] == "function") && (m != "constructor") && (m != "getMethods")) {
		    res.push(m)
		}
	    }
	    return res;
	}

        return Class;
    };

})();


// bind a method to an specific object
// taken from: http://fitzgeraldnick.com/weblog/26/
function bind(scope, fn) {
    if (!fn)
	throw "Invalid function to bind:", fn

    return function () {
	var args = Array.prototype.slice.call(arguments);
        return fn.apply(scope, args);
    };
};

/*
FIXME: all() for a promise array is better solution
*/
function apply_async(callable, args_vector, on_ready) {
    var barrier = new Barrier(args_vector.length, on_ready);

    for (var i in args_vector) {
	args_vector[i].push(function() { barrier.notify(); });
	callable.apply(undefined, args_vector[i]);
    }
};


/*
  from: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
*/

if (typeof String.prototype.format != 'function') {
    String.prototype.format = function() {
	var args = arguments;
	return this.replace(/{(\d+)}/g, function(match, number) {
	    return (typeof args[number] != 'undefined') ? args[number] : match;
	});
    };
}

if (typeof String.prototype.render != 'function') {
    String.prototype.render = function() {
	var text = this.format.apply(this, arguments);
	return $('<div></div>').append(text).children().unwrap();
    };
}

/*
  from: http://stackoverflow.com/questions/646628/javascript-startswith
*/
if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function(str) {
	return this.slice(0, str.length) == str;
    };
}

if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function(str) {
	return this.slice(-str.length) == str;
    };
}


Barrier = Class.extend({
    init: function(state, callback) {
	this.state = state;
	this.callback = callback;
    },

    notify: function() {
	this.state--;
        if (this.state == 0)
            this.callback();
    }
});


Observable = Class.extend({
    init: function() {
	this._observers = [];
    },

    attach: function(observer) {
	if (this._observers.indexOf(observer) != -1)
	    return;
	this._observers.push(observer);
    },

    detach: function(observer) {
	var index = this._observers.indexOf(observer);
	if (index == -1) {
	    return;
	}

	this._observers.splice(index, 1);
    },

    notify: function(args) {
	for (var i in this._observers) {
	    this._observers[i].notify(args);
	}
    },
});


wise = {

no_reconnect: false,

Transceiver: Class.extend({
    _reconnect_retries: 15,

    init: function(communicator, endpoint, promise) {
	this._communicator = communicator;
    	this._response_callbacks = {};
    	this._request_id = 0;
	this._endpoint_info = endpoint;
	this._waiting_callbacks = [bind(promise, promise.response)];
	this._is_ready = false;

	this._socket_url = "ws://" + endpoint.host +
	    ":" +  endpoint.port + "/" +
	    endpoint.ws_name;

	log.debug("new WebSocket: " + this._socket_url);
	this._create_socket(bind(this, this._notify_waiting_callbacks));

	log.debug("Transceiver created");
    },

    _create_socket: function(on_ready) {
    	var websocket = new WebSocket(this._socket_url);

	var self = this;
    	websocket.onopen = function(event) {
	    self._websocket = this;

	    log.debug("Socket opened (" + this.url + "),", event);
	    on_ready();

	    websocket.onclose = function(event) {
		log.debug("Socket closed:", event);
		if (! wise.no_reconnect)
		    self._try_reconnect();
	    };
    	};
    	websocket.onmessage = function(event) {
    	    self._on_ws_message(event);
    	};
	websocket.onerror = function(event) {
	    log.debug("Socket error:", event);
	};
    },

    // FIXME: notify of connection lost
    // FIXME: remove notification when connection is restablished
    _try_reconnect: function() {
	var self = this;
	var connect_count = 0;

	var timer = setInterval(function() {
	    log.info("WebSocket closed, trying to restablish connection (try {0})..."
		     .format(connect_count));

	    self._is_ready = false;
	    delete self._websocket;

	    self._create_socket(function() {
		clearInterval(timer);
		self._notify_waiting_callbacks();
	    });

	    connect_count++;
	    if (connect_count > self._reconnect_retries) {
		log.error("Connection lost with server");
		clearInterval(timer);
	    }

	}, 2000);
    },

    // args: request, callback
    send_request: function(args) {
	log.debug("Transceiver send_request: ", args.request);

    	args.request.request_id = this._request_id;
    	this._response_callbacks[this._request_id] = args.callback;

    	if (this._websocket.readyState != WebSocket.OPEN) {
    	    log.error("socket for " + this._websocket.url + " not ready, readyState: " +
		      this._websocket.readyState + ", should be " + WebSocket.OPEN,
		      this._websocket);
    	    return;
    	}

	this._prepare_params(args.request.params);
    	this._websocket.send(JSON.stringify(args.request));
    	this._request_id++;
    },

    link_to_adapter: function(adapter) {
	this._object_adapter = adapter;
    },

    toString: function() {
	return "-w " + this._endpoint_info.ws_name
	    + " -h " + this._endpoint_info.host
	    + " -p " + this._endpoint_info.port;
    },

    _notify_waiting_callbacks: function() {
	this._is_ready = true;
	for (var i=0; i<this._waiting_callbacks.length; i++) {
	    this._waiting_callbacks[i](this);
	}

	this._waiting_callbacks = [];
    },

    notify_when_ready: function(response) {
	if (this._is_ready) {
	    response(this);
	    return;
	}

	this._waiting_callbacks.push(response);
    },

    _prepare_params: function(params) {
	if (params == undefined)
	    return;

	for (var i in params) {
	    var p = params[i];
	    if (p instanceof wise.ObjectPrx)
		params[i] = {"wise_typecode": "Proxy", "repr": p.toString()};
	}
    },

    _on_ws_message: function(event) {
	log.debug("Transceiver Incomming message", event);

    	var message = JSON.parse(event.data);

    	// request of method invocation
    	if (message.method !== undefined)
    	    this._parse_request(message);

    	// correct response from previous request
    	else if (message.result !== undefined)
    	    this._parse_response(message);

    	// error response from previous request
    	else if (message.error !== undefined)
    	    this._parse_error(message);

    	// invalid protocol format
    	else
    	    this._report_invalid_message(message);
    },

    _parse_request: function(message) {
	log.debug("parse request (", message, ") using:", this._object_adapter);

    	if (! this._object_adapter) {
    	    return;
    	}

	try {
    	    var result = this._object_adapter.process_request(message);
	    this._send_response({
		request_id: message.request_id,
		result: result
	    });
	}
	catch (exception) {
	    this._send_response({
		request_id: message.request_id,
		exception: exception
	    });
    	}
    },

    // args: request_id, result, exception
    _send_response: function(args) {
    	if (this._websocket.readyState != WebSocket.OPEN) {
    	    log.error("socket not ready, state: " +
		      this._websocket.readyState);
    	    return;
    	}

    	this._websocket.send(JSON.stringify(args));
    },

    _parse_response: function(message) {
    	var callback = this._response_callbacks[message.request_id];
    	if (! callback) {
    	    return;
    	}

	var result = message.result;

	if (message.result["wise_typecode"] === "Proxy") {
	    this._communicator.stringToProxy(result["repr"])
	    .on_response(function(proxy) {
		result = proxy;
		callback.response(result);
    		delete this._response_callbacks[message.request_id];
	    });
	}
	else {
	    callback.response(result);
    	    delete this._response_callbacks[message.request_id];
	}
    },

    _parse_error: function(message) {
    	var callback = this._response_callbacks[message.request_id];
    	if (! callback) {
    	    return;
    	}

	if (callback.error == undefined) {
	    log.error("Error received, no callback to handle it:", message.error);
	}
	else {
    	    callback.error(message.error);
	}

    	delete this._response_callbacks[message.request_id];
    },

    _report_invalid_message: function(message) {
    	log.error("invalid message recived! ("
    		  + JSON.stringify(message) + ")");
    },
}),

TransceiverFactory: Class.extend({
    init: function(communicator) {
	this._transceivers = {};
	this._communicator = communicator;
    },

    // used by stringToProxy
    get_transceiver: function(endpoint) {
	log.debug("TransceiverFactory: get_transceiver,", endpoint.ws_name);

	var transceiver = this._transceivers[endpoint.ws_name];
	var promise = new wise.Promise();

	if (transceiver) {
	    transceiver.notify_when_ready(bind(promise, promise.response));
	    return promise;
	}

	this._new_transceiver(endpoint, promise);
	return promise;
    },

    // used by createObjectAdapter
    create_transceiver: function(endpoint) {
	log.debug("TransceiverFactory: create_transceiver,", endpoint.ws_name);

	var transceiver = this._transceivers[endpoint.ws_name];
	if (transceiver) {
	    throw "AlreadyUsedEndpoint";
	}

	// contact with server and create a new websocket
	if (! this._server_admin) {
	    throw ("Could not create transceiver: " +
		   "Communicator not fully initialized");
	}

	this._server_admin.create_socket(endpoint)
	    .on_response(bind(this, on_create_socket_response));

	var promise = new wise.Promise();
	function on_create_socket_response() {
	    this._new_transceiver(endpoint, promise);
	}

	return promise;
    },

    _new_transceiver: function(endpoint, promise) {
	log.debug("TransceiverFactory._new_transceiver,", endpoint.ws_name);
	var transceiver = new wise.Transceiver(this._communicator, endpoint, promise);
	this._transceivers[endpoint.ws_name] = transceiver;
    },
}),

EndpointInfo: Class.extend({
    init: function(endpoint, defaults) {
	if (endpoint == undefined)
	    endpoint = "";

	endpoint = endpoint.trim();

	// remove two spaces in string
	while (true) {
	    if (endpoint.indexOf("  ") == -1)
		break;
	    endpoint = endpoint.replace("  ", " ");
	}

	// split components
	var index = -1;
	var items = endpoint.split(" ");

	// web service locator
	this.ws_name = "";
	index = items.indexOf("-w");
	if (index != -1)
	    this.ws_name = items[index + 1];

	if (this.ws_name == "")
	    this.ws_name = this._get_random_ws_name();

	// hostname
	this.host = "";
	index = items.indexOf("-h");
	if (index != -1)
	    this.host = items[index + 1];

	if (this.host == "") {
	    if (! defaults || ! defaults.host)
		throw "Invalid endpoint, no host especified";
	    this.host = defaults.host
	}

	// port
	this.port = "";
	index = items.indexOf("-p");
	if (index != -1)
	    this.port = items[index + 1];

	if (this.port == "") {
	    if (! defaults || ! defaults.port)
		throw "Invalid endpoint, no port especified";
	    this.port = defaults.port;
	}
    },

    _get_random_ws_name: function() {
	return wise.Util.S4() + wise.Util.S4();
    },
}),

ObjectAdapter: Class.extend({
    init: function(transceiver) {
    	this._asm = {};

	this._transceiver = transceiver;
	this._transceiver.link_to_adapter(this);
    },

    add: function(servant, identity) {
    	this._asm[identity] = servant;

	servant.wise_getMethodNames = function() {
	    return servant.getMethods();
	};

	log.debug("Adding object: " + identity);
	return this.createProxy(identity);
    },

    addWithUUID: function(servant) {
	var identity = wise.Util.generate_UUID();
	return this.add(servant, identity);
    },

    remove: function(identity) {
	log.debug("Removing object: " + identity);
	delete this._asm[identity];
    },

    createProxy: function(identity) {
	return new wise.ObjectPrx({
	    identity: identity,
	    transceiver: this._transceiver
	});
    },

    process_request: function(request) {
    	log.debug("request received: " + request.identity + "."
    		  + request.method + "(" +
		  JSON.stringify(request.params) + ")");

	var obj = this._find_object(request.identity);

	if (! request.method in obj) {
	    // FIXME: raise an exception and serialize it to client
	    log.error("Unknown method: '" + request.method + "'");
	    return;
	}

	return obj[request.method].apply(obj, request.params);
    },

    _find_object: function(identity) {
    	var object = this._asm[identity];
    	if (! object) {
	    // FIXME: raise an exception and serialize it to client
    	    log.error("Unknown object: '" + identity + "'");
    	}
    	return object;
    },
}),

ObjectPrx: Class.extend({
    // FIXME: this is actually two different constructors
    // args: (identity, transceiver) || base
    init: function(args) {
	if (args.base) {
	    this._identity = args.base.wise_getIdentity();
	    this._transceiver = args.base.wise_getTransceiver();
	    return;
	}

    	this._identity = args.identity;
    	this._transceiver = args.transceiver;
    },

    wise_invoke: function(args) {
    	args.request.identity = this._identity;
    	this._transceiver.send_request(args);
    },

    wise_getTransceiver: function() {
    	return this._transceiver;
    },

    wise_getIdentity: function() {
    	return this._identity;
    },

    toString: function() {
	return this._identity + " " + this._transceiver.toString();
    },
}),

Util: {
    // taken from: http://guid.us/GUID/JavaScript
    S4: function() {
	return (((1+Math.random())*0x10000)|0).toString(16)
	    .substring(1);
    },

    generate_UUID: function() {
	var S4 = wise.Util.S4;
	return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3)
		+ "-" + S4() + "-" + S4() + S4() + S4()).toUpperCase();
    },
},

Logger: Class.extend({
    init: function(level) {
	this._observers = [];

	if (level == undefined)
	    level = 1;

	this._level = level;
    },

    attach: function(observer) {
	this._observers.push(observer);
    },

    set_level: function(level) {
	this._level = level;
    },

    debug: function() {
	if (this._level > 0)
	    return;

	this._notify(arguments, 'debug');
    },

    info: function() {
	if (this._level > 1)
	    return;

	this._notify(arguments, 'info');
    },

    warning: function() {
	if (this._level > 2)
	    return;

	this._notify(arguments, 'error');
    },

    error: function() {
	if (this._level > 3)
	    return;

	this._notify(arguments, 'error');
    },

    _notify: function(args, method) {
	args = Array.prototype.slice.call(args, 0);
	args.unshift(new Date().toLocaleString());

	for (var i in this._observers) {
	    var o = this._observers[i];
	    if (o[method] == undefined)
		continue;
	    o[method].apply(o, args);
	}
    },
}),

Communicator: Class.extend({
    init: function(args) {
	this._host = args.host;
	this._port = args.port;
	this._adapters = {};
	this._transceiverFactory = new wise.TransceiverFactory(this);
    },

    // args: name, endpoint, callback
    createObjectAdapter: function(name, endpoint) {
	if (name in this._adapters)
	    throw "AlreadyRegisteredException"

	var transceiver = this._transceiverFactory.create_transceiver(
	    new wise.EndpointInfo(endpoint, {host: this._host, port: this._port}))
	    .on_response(bind(this, on_create_transceiver_response));

	var promise = new wise.Promise();
	function on_create_transceiver_response(transceiver) {
	    var adapter = new wise.ObjectAdapter(transceiver);
	    this._adapters[name] = adapter;
	    promise.response(adapter);
	}

	return promise;
    },

    stringToProxy: function(str_proxy) {
	var fields = this._get_proxy_fields(str_proxy);

	this._transceiverFactory.get_transceiver(fields.endpoint)
	    .on_response(bind(this, on_get_transceiver_response));

	var promise = new wise.Promise();
	function on_get_transceiver_response(transceiver) {
	    var WisePrx = wise.newDerivedProxy({
	    	methods: ['wise_getMethodNames']
	    });

	    var base = new WisePrx({
	    	identity: fields.identity,
	    	transceiver: transceiver,
	    });

	    // build dynamic methods for remote object
	    base.wise_getMethodNames()
		.on_response(on_getMethodNames_response);

	    function on_getMethodNames_response(result) {
		result = result.concat(['wise_getMethodNames'])
		var DerivedPrx = wise.newDerivedProxy({
		    methods: result
		});
		var proxy = new DerivedPrx({
		    identity: fields.identity,
		    transceiver: transceiver
		});

		promise.response(proxy);
	    }
	}

	return promise;
    },

    _get_proxy_fields: function(proxy) {
	// example: "ObjectId -w ws -h 127.0.0.1 -p 8080"

	proxy = proxy.trim();

	// split identity and endpoint
	var items = proxy.split(" ");
	var identity = items[0];
	var endpoint = items.slice(1).join(" ");

	return {
	    identity: identity,
	    endpoint: new wise.EndpointInfo(
		endpoint,
		{host: this._host, port: this._port}),
	};
    },

    ready: function() {
	// notify to sulfurium that we are ready
	wiseReady = true;
    },
}),

// args: host, port, on_ready
initialize: function(host, port) {
    if (port == undefined)
	port = location.port;

    if (host == undefined)
	host = location.hostname;

    // create root logger for Wise
    log = new wise.Logger();
//    log.set_level(0);
    if (typeof console != "undefined") {
	log.attach(console);
    }

    // create communicator
    var ic = new wise.Communicator({ host: host, port: port });

    // create server admin proxy
    // FIXME: what is this "var proxy"??
    var proxy = ic.stringToProxy("WiseAdmin -w wise -h "+ host +" -p "+ port)
	.on_response(bind(this, on_stringToProxy_response));

    // response: proxy
    var promise = new wise.Promise();
    function on_stringToProxy_response(proxy) {
	wise.TransceiverFactory.prototype._server_admin = proxy;

	// finish intialization
	promise.response(ic);
    }

    return promise;
},

Promise: Class.extend({
    on_response: function(callback) {
	if (this._cached_result != undefined) {
	    callback(this._cached_result);
	    return this;
	}

	this._on_response_callback = callback;
	return this;
    },

    response: function(result) {
	if (this._on_response_callback == undefined) {
	    this._cached_result = result;
	    return;
	}

	this._on_response_callback(result);
    },

    on_error: function(callback) {
	if (this._cached_error != undefined) {
	    callback(this._cached_error);
	    return this;
	}

	this._on_error_callback = callback;
	return this;
    },

    error: function(error) {
	if (this._on_error_callback == undefined) {
	    log.warning("Error received, no callback to handle it:", error);
	    this._cached_error = error;
	    return;
	}

	this._on_error_callback(error);
    },
}),

// args: methods
newDerivedProxy: function(args) {
    var methods = {};

    function new_method(name) {

	var promise = new wise.Promise();
	return function() {
	    this.wise_invoke({
		request: {
		    method: name,
		    params: Array.prototype.slice.call(arguments),
		},
		callback: promise
	    });
	    return promise;
	};
    }

    for (var i in args.methods) {
	var name = args.methods[i];
	methods[name] = new_method(name);
    }

    return wise.ObjectPrx.extend(methods);
},

};


// $(window).ready(function() {
window.onload = function() {
    if (typeof wise_application == "undefined") {

	// no log created yet, so try to say something
	if (typeof console != "undefined") {
	    console.error("'wise_application' is not defined, nothing to do");
	}

	return;
    }

    wise.initialize().on_response(function(ws) {
	wise_application(ws);
    });
}
// );
