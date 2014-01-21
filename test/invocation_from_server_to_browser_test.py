# -*- mode: python; coding: utf-8 -*-

import sys
import os
from unittest import TestCase
from commodity.testing import wait_that, call_with
from commodity.net import localhost, listen_port

from brimstone import PhantomJS

from wise.Exceptions import UnknownLocalException
sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestServerToBrowser(TestCase):
    url = "http://127.0.0.1:8080/static/invocation_from_server_to_browser_test.html"

    @classmethod
    def setUpClass(cls):
        cls.expected_message = "some message"
        cls.server = Server()
        cls.browser = PhantomJS(left_open=False)
        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        cls.browser.exit()
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.url)
        self.message = self.server.ws.stringToProxy("Message -w browser")

    def test_server_to_browser_no_response(self):
        element = self.browser.find_element('#message')
        element.clear()

        # set message on remote object
        self.message.set_message(self.expected_message)

        # assure that invocation is dispatched correctly
        element = self.browser.find_element('#message')
        wait_that(element.get_attribute,
                  call_with("value").returns(self.expected_message))

    def test_server_to_browser_with_response(self):
        # set message on element
        element = self.browser.find_element('#message')
        element.clear()

        element.send_keys(self.expected_message)

        wait_that(self.message.get_message,
                  call_with().returns(self.expected_message))

    def test_server_to_browser_with_exception(self):
        def object_throws_exception():
            try:
                self.message.get_error()
                return False
            except UnknownLocalException:
                return True

        wait_that(object_throws_exception, call_with().returns(True))
