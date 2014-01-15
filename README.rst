wise
====

Invoking a remote object from the browser
-----------------------------------------

::

    function wise_application(ws) {
        ws.stringToProxy("printer1 -h 127.0.0.1 -p 8080 -w ws1")
            .on_response(on_stringToProxy_response);

        function on_stringToProxy_response(proxy) {
            proxy.write("hello world!");
        }
    }


Server objects
--------------

::


    import wise

    class Printer:
        def write(self, message, current=None):
            print("Incoming message: " + message)

    class Server:
        def __init__(self):
            broker = wise.initialize()
            adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
            adapter.add(Printer(), "printer1")
            broker.register_StaticFS('/static', wise.dirname(__file__))
            broker.waitForShutdown()



.. Local Variables:
..  coding: utf-8
..  mode: flyspell
..  ispell-local-dictionary: "american"
.. End:
