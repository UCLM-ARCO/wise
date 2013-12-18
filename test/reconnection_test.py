# -*- mode: python; coding: utf-8 -*-

import os
from threading import Thread
from unittest import TestCase
from doublex import Spy, called
from hamcrest import anything
from commodity.testing import wait_that
from sulfurium import Chrome

import wise


class Instance(Thread):
    def __init__(self, servant):
        Thread.__init__(self)
        self.ws = wise.initialize(host="127.0.0.1", port=8888)

        adapter = self.ws.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(servant, "Server")

        self.ws.register_StaticFS('/static', wise.dirname(__file__) + '/static')

    def run(self):
        self.ws.waitForShutdown()

    def stop(self):
        self.ws.shutdown()


class Server:
    def __init__(self, servant):
        self.servant = servant
        self.instance = None

    def start(self):
        if self.instance is not None:
            raise TypeError("This Server is already started")

        self.instance = Instance(self.servant)
        self.instance.start()

    def stop(self):
        self.instance.stop()
        self.instance.join()
        self.instance = None

    def restart(self):
        self.stop()
        self.start()


class TestReconnection(TestCase):
    def setUp(self):
        with Spy() as self.servant:
            self.servant.set_message()

        self.server = Server(self.servant)

    def tearDown(self):
        self.server.stop()

    def test_reconnect_for_knwon_websocket_locator(self):
        self.server.start()

        self.browser = Chrome(left_open=False)
        self.browser.open("http://127.0.0.1:8888/static/reconnection_test.html")

        self.check_data_is_received(1)
        self.server.restart()
        self.check_data_is_received(2)

    def check_data_is_received(self, times):
        self.browser.js("remote.set_message('hello');")
        wait_that(self.servant.set_message, called()
                  .with_args("hello", anything())
                  .times(times))
