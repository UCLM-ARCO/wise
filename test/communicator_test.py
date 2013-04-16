# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from hamcrest import assert_that, is_not
from prego.net import localhost, listen_port
from doublex import Spy, called

import wise


class TestCommunicator(TestCase):
    def test_could_create_two_communicators(self):
        host = "127.0.0.1"
        port = 9000

        ic1 = wise.initialize(host, port)
        ic2 = wise.initialize(host, port + 1)
        self.addCleanup(ic1.shutdown)
        self.addCleanup(ic2.shutdown)

        assert_that(localhost, listen_port(port))
        assert_that(localhost, listen_port(port + 1))

    def test_free_port_on_shutdown(self):
        host = "127.0.0.1"
        port = 9000

        ic = wise.initialize(host, port)
        assert_that(localhost, listen_port(port))

        ic.shutdown()
        assert_that(localhost, is_not(listen_port(port)))

    def test_register_handlers_is_correct(self):
        host = "127.0.0.1"
        port = "9999"
        path = "/myapp"
        url = "http://{}:{}{}".format(host, port, path)

        ic = wise.initialize(host, port)
        self.addCleanup(ic.shutdown)

        from tornado.web import RequestHandler
        myAppClass_spy = Spy()

        class MyAppClass(RequestHandler):
            def initialize(self, *args, **kwargs):
                myAppClass_spy.initialize(*args, **kwargs)

            def get(self):
                pass

        args = {'param1': 'a param'}
        handlers = [("^{}$".format(path), MyAppClass, args)]
        ic.registerHandlers(handlers)

        import urllib2
        urllib2.urlopen(url)
        assert_that(myAppClass_spy.initialize, called().with_args(**args))

    def test_do_not_preserve_handlers_on_deleting(self):
        # create a communicator
        ic1 = wise.initialize(host, port)

        # register a handler and use it
        # verify that params are correct on initialize
        # destroy communicator

        # create another communicator
        # register another handler and use it
        # verify that params are correct again

    def register_handler_on_communicator(self, ic, url, handler, args):
        spy = Spy()

        class MyAppClass(RequestHandler):
            def initialize(self, *args, **kwargs):
                spy.initialize(*args, **kwargs)

            def get(self):
                pass

