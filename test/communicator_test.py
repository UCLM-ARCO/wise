# -*- mode: python; coding: utf-8 -*-

from tornado.web import RequestHandler
import urllib2

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

        args = {'param1': 'a param'}
        spy = self.register_handler_on_communicator(ic, path, args)

        urllib2.urlopen(url)
        assert_that(spy.initialize, called().with_args(**args))

    def test_do_not_preserve_handlers_on_deleting(self):
        host = "127.0.0.1"
        port = "9999"
        path = "/myapp"
        url = "http://{}:{}{}".format(host, port, path)

        # create a communicator
        ic1 = wise.initialize(host, port)

        # register a handler and use it
        args = {'param1': 'a param'}
        spy = self.register_handler_on_communicator(ic1, path, args)
        urllib2.urlopen(url)

        # verify that params are correct on initialize
        assert_that(spy.initialize, called().with_args(**args))

        # destroy communicator
        ic1.shutdown()

        # create another communicator
        ic2 = wise.initialize(host, port)
        self.addCleanup(ic2.shutdown)

        # register another handler to the same path, and use it
        args = {'param2': 'another param'}
        spy = self.register_handler_on_communicator(ic2, path, args)
        urllib2.urlopen(url)

        # verify that params are correct again
        assert_that(spy.initialize, called().with_args(**args))

    def register_handler_on_communicator(self, ic, url, args):
        spy = Spy()

        class MyAppClass(RequestHandler):
            def initialize(self, *args, **kwargs):
                spy.initialize(*args, **kwargs)

            def get(self):
                pass

        handlers = [("^{}$".format(url), MyAppClass, args)]
        ic.registerHandlers(handlers)
        return spy



