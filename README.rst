wise
====

Object-oriented web communication framework.


Invoking a object at the web server
-----------------------------------

Python code running in the web server:

.. sourcecode:: python

    import wise

    class Printer:
        def write(self, message, current=None):
            print("Incoming message: " + message)

    class Server:
        def __init__(self):
            broker = wise.initialize()
            adapter = broker.createObjectAdapter("adapter1", "-w ws1")
            adapter.add(Printer(), "printer1")
            broker.register_StaticFS('/static', wise.dirname(__file__))
            broker.waitForShutdown()


JavaScript code running in the browser:

.. sourcecode:: javascript

    function wise_application(broker) {
        broker.stringToProxy("printer1 -w ws1 -h 127.0.0.1 -p 8080")
            .then(on_stringToProxy_reply);

        function on_stringToProxy_reply(proxy) {
            proxy.write("hello world from the browser!");
        }
    }



Invoking a object at the broser
-------------------------------

JavaScript code running in the browser:

.. sourcecode:: javascript

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

Python code running in the web server:

.. sourcecode:: python

    broker = wise.initialize()
    broker.register_StaticFS('/static', wise.dirname(__file__))
    [... wait browser is ready ...]
    proxy = broker.stringToProxy("printer2 -w ws2")
    proxy.write("hello world from the server!")


Servants
--------

The servant is the instance you want to be remotely accesible from "the other side". The servant is which makes the job.

Object adapters
---------------

The adapters map "proxies" to "servants".

Proxies
-------

The proxies are local references to remote objets.

Remote duck typing
------------------

**wise** assumes the remote object implements the right method... but it may not be so.

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



tests
-----

* http://jsfiddle.net/NKBJ4/6/


.. Local Variables:
..  coding: utf-8
..  mode: flyspell
..  ispell-local-dictionary: "american"
.. End:
