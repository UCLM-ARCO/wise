// -*- mode: js; coding: utf-8 -*-

function wise_application(broker) {
    broker.stringToProxy("helloSrv -w HelloWS")
        .then(on_stringToProxy_reply);

    function on_stringToProxy_reply(proxy) {
        proxy.say_hello("Margaret").then(on_say_hello_reply);
    }

    function on_say_hello_reply(reply) {
	console.info(reply);
    }
}
