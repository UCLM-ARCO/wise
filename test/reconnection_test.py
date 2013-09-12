# -*- mode: python; coding: utf-8 -*-

import os
from threading import Thread
from unittest import TestCase

from doublex import Spy, called
from hamcrest import anything
from commodity.testing import wait_that  # , call_with

from sulfurium import Chrome
import wise


class Instance(Thread):
    def __init__(self, servant):
        Thread.__init__(self)
        self.ic = wise.initialize(host="127.0.0.1", port=8888)

        pwd = os.path.abspath(os.path.dirname(__file__))
        frontend = wise.StaticFSApplication(self.ic, '/static/', pwd)
        self.ic.registerApplication(frontend)

        adapter = self.ic.createObjectAdapter("ServerAdapter", "testws")
        adapter.add(servant, "Server")

    def run(self):
        self.ic.waitForShutdown()

    def stop(self):
        self.ic.shutdown()


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

        self.browser = Chrome(left_open=True)
        self.browser.open("http://127.0.0.1:8888/static/reconnection_test.html")

        self.check_data_is_received(times=1)
        self.server.restart()
        self.check_data_is_received(times=2)

    def check_data_is_received(self, times):
        self.browser.js("remote.set_message({ params: { message: 'hello' } });")
        wait_that(self.servant.set_message, called()
                  .with_args(message="hello", current=anything())
                  .times(times))





# class TestBrowserToServer(TestCase):
#     @classmethod
#     def setUpClass(cls):
#         cls._expected_message = "other message"

#         with Spy() as servant:
#             servant.set_message()
#             servant.get_message(ANY_ARG).returns(
#                 {'message': cls._expected_message})
#             cls._servant = servant

#         cls._server = Server(cls._servant)
#         cls._browser = Chrome()

#     @classmethod
#     def tearDownClass(cls):
#         del cls._server
#         del cls._browser

#     def test_browser_to_server_no_response(self):
#         # open server url
#         self._browser.open(self._server.url)

#         # click on button 'set'
#         button = self._browser.find_element('#set_button')
#         button.click()

#         # verify spy is called
#         wait_that(self._servant.set_message, called())
#         assert_that(self._servant.set_message,
#                     called().with_args(message='the message',
#                                        current=anything()))

#     def test_browser_to_server_with_response(self):
#         # open server url
#         self._browser.open(self._server.url)

#         # click on button
#         button = self._browser.find_element('#get_button')
#         button.click()

#         # verify that div has content from servant
#         # FIXME: if you do not mean args, remove with_args assertion
#         wait_that(self._servant.get_message,
#                   called().with_args(current=anything()))

#         banner = self._browser.find_element('#banner')
#         assert_that(banner.get_attribute,
#                     call_with("value").returns(self._expected_message))
