// -*- mode: js; coding: utf-8 -*-

// bind a method to an specific object
// taken from: http://fitzgeraldnick.com/weblog/26/
function bind(scope, fn) {
    return function () {
	var args = Array.prototype.slice.call(arguments);
        return fn.apply(scope, args);
    };
}


rice = {

Transceiver: Class.extend({
    // args: socket_url, on_ready
    init: function(args) {
    	this._response_callbacks = {};
    	this._request_id = 0;

    	this._websocket = new WebSocket(args.socket_url);

    	var transceiver = this;
    	this._websocket.onmessage = function(event) {
    	    transceiver._on_ws_message(event);
    	}
    	this._websocket.onopen = function(event) {
    	    args.on_ready({
		transceiver: transceiver,
	    });
    	}
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
    link_to_adapter: function(args) {
	this._object_adapter = args.adapter;
    },

    toString: function() {
	var fields = this._websocket.url.split("/");
	return fields.splice(-1, 1)[0];
    },

    _on_ws_message: function(event) {
    	var message = JSON.parse(event.data);

    	// request for async notification (like DUO Active)
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
    	if (! this._object_adapter) {
    	    return;
    	}

    	this._object_adapter.process_request(message);
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
    // args: endpoint, on_ready
    get_transceiver: function(args) {
	var transceiver = this._transceivers[args.endpoint];
	if (transceiver) {
	    args.on_ready({ transceiver: transceiver });
	    return;
	}

	this._new_transceiver(args);
    },

    // used by createObjectadapter
    // args: endpoint, on_ready
    create_transceiver: function(args) {
	var transceiver = this._transceivers[args.endpoint];
	if (transceiver) {
	    throw "AlreadyUsedEndpoints";
	}

	// contact with server and create a new websocket
	if (! this._server_admin) {
	    throw ("Could not create transceiver: " +
		   "Communicator not fully initialized");
	}

	this._server_admin.create_socket({
	    endpoint: args.endpoint,
	    on_ready: bind(this, on_create_socket_ready),
	});

	function on_create_socket_ready(result) {
	    this._new_transceiver(args);
	}
    },

    // args: endpoint, on_ready
    _new_transceiver: function(args) {
	// FIXME: this (ws://127.0.0.1:8080) should go in endpoint
	var socket_url = "ws://127.0.0.1:8080/" + args.endpoint;

	log.info("New transceiver for: ", socket_url);
	var transceiver = new rice.Transceiver({
	    socket_url: socket_url,
	    on_ready: args.on_ready,
	});

	this._transceivers[args.endpoint] = transceiver;
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
    	log.info("object_adapter: add of '" + JSON.stringify(args) + "'");
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
	return new rice.ObjectPrx({
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

    	    // FIXME: no response done!
    	    method(request.params);
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
	    args.identity = args.base.rice_getIdentity();
	    args.transceiver = args.base.rice_getTransceiver();
	}

    	this._identity = args.identity;
    	this._transceiver = args.transceiver;
    },

    // args: request, on_response
    rice_invoke: function(args) {
    	args.request.identity = this._identity;
    	this._transceiver.send_request(args);
    },

    rice_getTransceiver: function() {
    	return this._transceiver;
    },

    rice_getIdentity: function() {
    	return this._identity;
    },

    toString: function() {
	return this._identity + " -e " + this._transceiver.toString();
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
	this._transceiverFactory = new rice.TransceiverFactory();
    },

    // args: name, endpoint, on_ready
    createObjectAdapter: function(args) {
	if (args.name in this._adapters)
	    throw "AlreadyRegisteredException"

	var transceiver = this._transceiverFactory.create_transceiver({
	    endpoint: args.endpoint,
	    on_ready: bind(this, on_transceiver_ready),
	});

	// result: transceiver
	function on_transceiver_ready(result) {
	    var adapter = new rice.ObjectAdapter({
		transceiver: result.transceiver
	    });

	    this._adapters[args.name] = adapter;
	    args.on_ready({ adapter: adapter });
	}
    },

    // args: stringfied_proxy, on_ready
    stringToProxy: function(args) {
	var fields = this._get_proxy_fields(args.proxy);

	var identity = fields[0];
	this._transceiverFactory.get_transceiver({
	    endpoint: fields[1],
	    on_ready: bind(this, on_transceiver_ready),
	});

	// result: transceiver
	function on_transceiver_ready(result) {
	    var proxy = new rice.ObjectPrx({
		identity: identity,
		transceiver: result.transceiver,
	    });

	    args.on_ready({
		proxy: proxy
	    });
	};
    },

    _get_proxy_fields: function(proxy) {
	var retval = proxy.split("-e");
	for (var name in retval) {
	    retval[name] = retval[name].trim();
	}
	return retval;
    },
}),

// args: on_ready
initialize: function(args) {

    // create root logger for Rice
    if (console) {
	log = console;
    }
    else {
	if ($('#log').length == 0) {
	    $('body').append($('<div id="log">'));
	}
	log = new rice.Logger({ element_id: "log"});
    }

    // create communicator
    var ic = new rice.Communicator();

    // create server admin proxy
    var AdminPrx = rice.newDerivedProxy({ methods: ['create_socket'] });
    var proxy = ic.stringToProxy({
	proxy: "RiceAdmin -e rice",
	on_ready: bind(this, on_admin_proxy_ready),
    });

    // result: proxy
    function on_admin_proxy_ready(result) {
	rice.TransceiverFactory.prototype._server_admin =
	    new AdminPrx({ base: result.proxy });

	// finish intialization
	args.on_ready({ communicator: ic });
    }
},

// args: methods
newDerivedProxy: function(args) {
    var methods = {};
    for (var i in args.methods) {
	var name = args.methods[i];
	methods[name] = function(params) {
	    this.rice_invoke({
		request: {
		    method: name,
		    params: params,
		},
	    });
	};
    }

    return rice.ObjectPrx.extend(methods);
},

};
