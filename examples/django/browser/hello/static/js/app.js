// -*- mode: js; coding: utf-8 -*-

Greeter = Class.extend({
    say_response: function(message) {
	console.info(message);
    },
});


function wise_application(broker) {
    broker.createObjectAdapter("adapter", "-w HelloBrowser")
	.then(on_adapter_ready);

    function on_adapter_ready(adapter) {
	adapter.add(new Greeter(), "hello");
    };

    broker.stringToProxy("hello -w HelloServer")
	.then(on_proxy_ready);

    function on_proxy_ready(proxy) {
	proxy.say_hello("Bart");
    };
}

