wise
====

Object-oriented web communication framework.


Invoking a server object
------------------------

Python code in the server::

    import wise

    class Printer:
        def write(self, message, current=None):
            print("Incoming message: " + message)

    class Server:
        def __init__(self):
            broker = wise.initialize()
            adapter = broker.createObjectAdapter("adapter1", "ws1")
            adapter.add(Printer(), "printer1")
            broker.register_StaticFS('/static', wise.dirname(__file__))
            broker.waitForShutdown()


JavaScript code in the browser::

    function wise_application(broker) {
        broker.stringToProxy("printer1 -w ws1 -h 127.0.0.1 -p 8080")
            .then(on_stringToProxy_response);

        function on_stringToProxy_response(proxy) {
            proxy.write("hello world from the browser!");
        }
    }



Invoking a browser object
-------------------------

JavaScript code in the browser::

    Printer = Class.extend({
	write: function(message) {
	    console.log(message);
	},
    });

    function wise_application(broker) {
	broker.createObjectAdapter("adapter2", "-w ws2")
	    .then(on_adapter_ready);

	function on_adapter_ready(adapter) {
	    adapter.add(new Printer(), "printer2");
	}
    }

Python code in the server:

.. sourcecode:: python

    broker = wise.initialize()
    broker.register_StaticFS('/static', wise.dirname(__file__))
    [... wait browser is ready ...]
    proxy = broker.stringToProxy("printer2 -w ws2")
    proxy.write("hello world from the server!")


Servants
--------

Object adapters
---------------

Proxies
-------

Remote duck typing
------------------

API
---

Communicator.createObjectAdapter(name, endpoint)
Communicator.stringToProxy(stringfied_proxy)

Adapter.add(instance, identity)
Adapter.addWithUUID(instance)

(python only)
wise.initialize()
Communicator.register_StaticFS(url, path)
Communicator.waitForShutdown()

(js only)
wise_application(communicator)

.. Local Variables:
..  coding: utf-8
..  mode: flyspell
..  ispell-local-dictionary: "american"
.. End:
