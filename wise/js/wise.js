// -*- mode: js; coding: utf-8 -*-

// bind a method to an specific object
// taken from: http://fitzgeraldnick.com/weblog/26/
function bind(scope, fn) {
    return function () {
	var args = Array.prototype.slice.call(arguments);
        return fn.apply(scope, args);
    };
}

wise = {

Transceiver: Class.extend({
    // args: socket_url, on_ready
    init: function(args) {
    	this._response_callbacks = {};
    	this._request_id = 0;

	log.debug("new WebSocket @ " + args.socket_url);
    	this._websocket = new WebSocket(args.socket_url);

    	var transceiver = this;
    	this._websocket.onopen = function(event) {
    	    args.on_ready({
		transceiver: transceiver,
	    });
    	};
    	this._websocket.onmessage = function(event) {
    	    transceiver._on_ws_message(event);
    	};
	this._websocket.onerror = function(event) {
	    log.error("Socket error:", event);
	};
	this._websocket.onclose = function(event) {
	    log.debug("Socket closed:", event);
	};
    },

    // args: request, on_response
    send_request: function(args) {
    	args.request.request_id = this._request_id;
    	this._response_callbacks[this._request_id] = args.on_response;

    	if (this._websocket.readyState != WebSocket.OPEN) {
    	    log.error("socket not ready, state: " +
		      this._websocket.readyState);
    	    return;
    	}

    	this._websocket.send(JSON.stringify(args.request));
    	this._request_id++;
    },

    // args: adapter
    link_to_adapter: function(adapter) {
	this._object_adapter = adapter;
    },

    toString: function() {
	var fields = this._websocket.url.split("/");
	return fields.splice(-1, 1)[0];
    },

    _on_ws_message: function(event) {
	log.debug("ws message", event);

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
	    args.on_response({ transceiver: transceiver });
	    return;
	}

	this._new_transceiver(args);
    },

    // used by createObjectadapter
    // args: endpoint, on_response
    create_transceiver: function(args) {
	var transceiver = this._transceivers[args.endpoint.ws_name];
	if (transceiver) {
	    throw "AlreadyUsedEndpoints";
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
	var socket_url = ("ws://" + args.endpoint.host +
			  ":" +  args.endpoint.port + "/" +
			  args.endpoint.ws_name);

	var transceiver = new wise.Transceiver({
	    socket_url: socket_url,
	    on_ready: args.on_response,
	});

	this._transceivers[args.endpoint.ws_name] = transceiver;
    },
}),

EndpointInfo: Class.extend({
    init: function(endpoint) {
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

	// hostname
	this.host = "";
	index = items.indexOf("-h");
	if (index != -1)
	    this.host = items[index + 1];

	// port
	this.port = "";
	index = items.indexOf("-p");
	if (index != -1)
	    this.port = items[index + 1];
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

	return this.createProxy({
	    identity: args.identity
	});
    },

    // args: servant
    addWithUUID: function(args) {
	args.identity = Util.generate_UUID();
	return this.add(args);
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
    	    log.info("request received: " + request.identity + "."
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
    	}

    	return method;
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
    generate_UUID: function() {
	function S4() {
	    return (((1+Math.random())*0x10000)|0).toString(16)
		.substring(1);
	}

	return (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3)
		+ "-" + S4() + "-" + S4() + S4() + S4()).toUpperCase();
    },
},

Logger: Class.extend({

    // args: element_id
    init: function(args) {
	this._element_id = args.element_id;
    },

    info: function(message) {
	$('#' + this._element_id).append(
	    "[" + new Date().toISOString() + "] "
		+ message + '<br>');
    },

    error: function(message) {
	message = '<b style="color:red">[ERROR]' + message + "</b>";
	this.info(message);
    },
}),

Communicator: Class.extend({
    init: function() {
	this._adapters = {};
	this._transceiverFactory = new wise.TransceiverFactory();
    },

    // args: name, endpoint, on_response
    createObjectAdapter: function(args) {
	if (args.name in this._adapters)
	    throw "AlreadyRegisteredException"

	var transceiver = this._transceiverFactory.create_transceiver({
	    endpoint: new wise.EndpointInfo(args.endpoint),
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
	    endpoint: new wise.EndpointInfo(endpoint),
	};
    },
}),

// args: on_response
initialize: function(args) {

    // create root logger for Wise
    if (console) {
	log = console;
    }
    else {
	if ($('#log').length == 0) {
	    $('body').append($('<div id="log">'));
	}
	log = new wise.Logger({ element_id: "log"});
    }

    // create communicator
    var ic = new wise.Communicator();

    // create server admin proxy
    var proxy = ic.stringToProxy({
	proxy: "WiseAdmin -w wise -h 127.0.0.1 -p 8000",
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


