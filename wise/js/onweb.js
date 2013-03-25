// -*- mode: js; coding: utf-8 -*-

ServerPrx = ObjectPrx.extend({
    // args: uri, on_response
    get_model: function(args) {
    	var transceiver = this._transceiver;

    	this.wise_invoke({
    	    request: {
    		method: 'get_model',
    		params: {
    		    uri: args.uri
    		}
    	    },
    	    on_response: function(response) {
    		var model = new ObjectPrx({
    		    identity: response.model_id,
    		    transceiver: transceiver,
    		});
    		args.on_response(model);
    	    }
    	});
    },
});

DUO_RWA = ObjectPrx.extend({
    // args: value
    set: function(args) {
    	this.wise_invoke({
    	    request: {
    		method: 'set',
    		params: args,
    	    }
    	});
    },

    // args: on_response
    get: function(args) {
    	this.wise_invoke({
    	    request: {
    		method: 'get'
    	    },
    	    on_response: args.on_response
    	});
    },

    // args: proxy
    setObserver: function(args) {
    	this.wise_invoke({
    	    request: {
    		method: 'setObserver',
    		params: {
    		    observer_prx: args.proxy
    		}
    	    }
    	});
    },
});

IBoolPrx = DUO_RWA.extend();
IStringPrx = DUO_RWA.extend();
