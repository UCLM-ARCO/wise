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

        return Class;
    };

})();


// bind a method to an specific object
// taken from: http://fitzgeraldnick.com/weblog/26/
function bind(scope, fn) {
    return function () {
	var args = Array.prototype.slice.call(arguments);
        return fn.apply(scope, args);
    };
};


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
	    return typeof args[number] != 'undefined'
		? args[number]
		: match
	    ;
	});
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

Transceiver: Class.extend({
    _reconnect_retries: 30,

    // args: endpoint, on_ready
    init: function(args) {
    	this._response_callbacks = {};
    	this._request_id = 0;
	this._endpoint_info = args.endpoint;
	this._waiting_callbacks = [args.on_ready];
	this._is_ready = false;

	this._socket_url = "ws://" + args.endpoint.host +
	    ":" +  args.endpoint.port + "/" +
	    args.endpoint.ws_name;

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
		self._try_reconnect();
	    };
    	};
    	websocket.onmessage = function(event) {
    	    self._on_ws_message(event);
    	};
	websocket.onerror = function(event) {
	    log.error("Socket error:", event);
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

    // args: request, on_response
    send_request: function(args) {
	log.debug("Transceiver send_request: ", args.request);

    	args.request.request_id = this._request_id;
    	this._response_callbacks[this._request_id] = args.on_response;

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
	for (var i=0; i<this._waiting_callbacks.length; i++) {
	    this._waiting_callbacks[i]({
		transceiver: this,
	    });
	}
	this._is_ready = true;
	this._waiting_callbacks = [];
    },

    // args: on_ready
    notify_when_ready: function(args) {
	if (this._is_ready) {
	    args.on_ready({ transceiver: this });
	    return;
	}

	this._waiting_callbacks.push(args.on_ready);
    },

    // FIXME: if there is a proxy in params, change it for the
    // stringfied version of the proxy
    _prepare_params: function(params) {
	if (params == undefined)
	    return;
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

    	var result = this._object_adapter.process_request(message);
	this._send_response({
	    request_id: message.request_id,
	    result: result
	});
    },

    // args: request_id, result
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

    	callback(message.result);
    	delete this._response_callbacks[message.request_id];
    },

    _parse_error: function(message) {
    	log.error('received error from server: ' + message.error);
    },

    _report_invalid_message: function(message) {
    	log.error("invalid message recived! ("
    		  + JSON.stringify(message) + ")");
    },
}),

TransceiverFactory: Class.extend({
    init: function() {
	this._transceivers = {};
    },

    // used by stringToProxy
    // args: endpoint, on_response
    get_transceiver: function(args) {
	var transceiver = this._transceivers[args.endpoint.ws_name];
	if (transceiver) {
	    transceiver.notify_when_ready({ on_ready: args.on_response });
	    return;
	}

	this._new_transceiver(args);
    },

    // used by createObjectAdapter
    // args: endpoint, on_response
    create_transceiver: function(args) {
	log.debug("TransceiverFactory: create_transceiver,", args.endpoint.ws_name);

	var transceiver = this._transceivers[args.endpoint.ws_name];
	if (transceiver) {
	    throw "AlreadyUsedEndpoint";
	}

	// contact with server and create a new websocket
	if (! this._server_admin) {
	    throw ("Could not create transceiver: " +
		   "Communicator not fully initialized");
	}

	this._server_admin.create_socket({
	    params: { endpoint: args.endpoint },
	    on_response: bind(this, on_create_socket_response),
	});

	function on_create_socket_response() {
	    this._new_transceiver(args);
	}
    },

    // args: endpoint, on_response
    _new_transceiver: function(args) {
	log.debug("TransceiverFactory._new_transceiver,", args.endpoint.ws_name);
	var transceiver = new wise.Transceiver({
	    endpoint: args.endpoint,
	    on_ready: args.on_response,
	});

	this._transceivers[args.endpoint.ws_name] = transceiver;
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
    // args: transceiver
    init: function(args) {
    	this._asm = {};

	this._transceiver = args.transceiver;
	this._transceiver.link_to_adapter(this);
    },

    // args: servant, identity
    add: function(args) {
    	this._asm[args.identity] = args.servant;

	log.debug("Adding object: " + args.identity);
	return this.createProxy({
	    identity: args.identity
	});
    },

    // args: servant
    addWithUUID: function(args) {
	args.identity = wise.Util.generate_UUID();
	return this.add(args);
    },

    // args: identity
    remove: function(args) {
	log.debug("Removing object: " + args.identity);
	delete this._asm[args.identity];
    },

    // args: identity
    createProxy: function(args) {
	return new wise.ObjectPrx({
	    identity: args.identity,
	    transceiver: this._transceiver,
	});
    },

    // args: request
    process_request: function(request) {
    	try {
    	    log.debug("request received: " + request.identity + "."
    		     + request.method + "(" +
		     JSON.stringify(request.params) + ")");

   	    method = this._get_object_method(request);
    	    if (! method) {
    		return;
    	    }

    	    return method(request.params);
    	}
    	catch(e) {
    	    log.error("in processing request: " + e.message);
    	}
    },

    // args: identity, method
    _get_object_method: function(args) {
    	var object = this._find_object(args);
    	if (! object) {
    	    return;
    	}

    	var method = object[args.method];
    	if (! method) {
    	    log.error("Unknown method: '" + args.method + "'");
	    return;
    	}

    	return bind(object, method);
    },

    // args: identity
    _find_object: function(args) {
    	var object = this._asm[args.identity];
    	if (! object) {
    	    log.error("Unknown object: '" + args.identity + "'");
    	}
    	return object;
    },
}),

ObjectPrx: Class.extend({
    // args: identity, transceiver
    init: function(args) {
	if (args.base) {
	    args.identity = args.base.wise_getIdentity();
	    args.transceiver = args.base.wise_getTransceiver();
	}

    	this._identity = args.identity;
    	this._transceiver = args.transceiver;
    },

    // args: request, on_response
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

    error: function() {
	if (this._level > 2)
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
	this._transceiverFactory = new wise.TransceiverFactory();
    },

    // args: name, endpoint, on_response
    createObjectAdapter: function(args) {
	if (args.name in this._adapters)
	    throw "AlreadyRegisteredException"

	var transceiver = this._transceiverFactory.create_transceiver({
	    endpoint: new wise.EndpointInfo(
		args.endpoint,
		{host: this._host, port: this._port}),
	    on_response: bind(this, on_create_transceiver_response),
	});

	// response: transceiver
	function on_create_transceiver_response(response) {
	    var adapter = new wise.ObjectAdapter({
		transceiver: response.transceiver
	    });

	    this._adapters[args.name] = adapter;
	    args.on_response({ adapter: adapter });
	}
    },

    // args: proxy, on_response
    stringToProxy: function(args) {
	var fields = this._get_proxy_fields(args.proxy);

	this._transceiverFactory.get_transceiver({
	    endpoint: fields.endpoint,
	    on_response: bind(this, on_get_transceiver_response),
	});

	// response: transceiver
	function on_get_transceiver_response(response) {
	    var WisePrx = wise.newDerivedProxy({
	    	methods: ['wise_getMethodNames']
	    });

	    var base = new WisePrx({
	    	identity: fields.identity,
	    	transceiver: response.transceiver,
	    });

	    // build dynamic methods for remote object
	    var transceiver = response.transceiver;
	    base.wise_getMethodNames({ on_response: function(response) {

		var DerivedPrx = wise.newDerivedProxy({
		    methods: response.result
		});
		var proxy = new DerivedPrx({
		    identity: fields.identity,
		    transceiver: transceiver
		});

		args.on_response({ proxy: proxy });
	    }});
	}
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
	jsReady = true;
    },
}),

// args: host, post, on_response
initialize: function(args) {
    if (args.port == undefined)
	args.port = location.port;

    if (args.host == undefined)
	args.host = location.hostname;

    // create root logger for Wise
    log = new wise.Logger();
    if (typeof console != "undefined") {
	log.attach(console);
    }

    // create communicator
    var ic = new wise.Communicator({ host: args.host, port: args.port });

    // create server admin proxy
    var proxy = ic.stringToProxy({
	proxy: "WiseAdmin -w wise -h "+ args.host +" -p "+ args.port,
	on_response: bind(this, on_stringToProxy_response),
    });

    // response: proxy
    function on_stringToProxy_response(response) {
        var AdminPrx = wise.newDerivedProxy({ methods: ['create_socket'] });
	wise.TransceiverFactory.prototype._server_admin =
	    new AdminPrx({ base: response.proxy });

	// finish intialization
	args.on_ready({ communicator: ic });
    }
},

// args: methods
newDerivedProxy: function(args) {
    var methods = {};

    function new_method(name) {

	// args: params, on_response
	return function(args) {
	    if (! args)
		args = {};

	    this.wise_invoke({
		request: {
		    method: name,
		    params: args.params
		},
		on_response: args.on_response
	    });
	};
    }

    for (var i in args.methods) {
	var name = args.methods[i];
	methods[name] = new_method(name);
    }

    return wise.ObjectPrx.extend(methods);
},

};


$(window).ready(function() {
    if (typeof wise_application == "undefined") {

	// no log created yet, so try to say something
	if (typeof console != "undefined") {
	    console.error("'wise_application' is not defined, nothing to do");
	}

	return;
    }

    wise.initialize({ on_ready: function(args) {
	wise_application(args);
    }});
});
