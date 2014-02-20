# -*- mode: python; coding: utf-8 -*-

import sys
import os

from unittest import TestCase
from doublex import Spy, called, ANY_ARG
from hamcrest import anything
from commodity.testing import wait_that, call_with, assert_that

from brimstone import PhantomJS
from server import Server
from commodity.net import localhost, listen_port

sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestBrowserToServer(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.expected_message = "EXAMPLE MESSAGE"
        with Spy() as servant:
            servant.upper().returns(
                {'retval': cls.expected_message})
            servant.get_proxy().returns(
                {'proxy': anything()})

        cls.server = Server(ANY_ARG)
        cls.browse = PhantomJS()

        wait_that(localhost, listen_port(8080))

    def test_server_send_proxy_to_browser(self):
        url = "http://127.0.0.1:8080/static/index.html"
        self.browser.open(url)

        button = self.browser.find_element('#button')
        button.click()
        proxy = self.server.stringToProxy("Server2 -w ws1")
        assert_that(self.servant.get_proxy,
                  call_with().returns(proxy))
        message = "example message"
        assert_that(self.server.upper,
                    call_with(message).returns(self.expected_message))
