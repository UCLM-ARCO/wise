# -*- mode:python; coding:utf-8; tab-width:4 -*-

import sys
import os
from unittest import TestCase
from doublex import Spy, called, ANY_ARG
from hamcrest import anything
from commodity.testing import wait_that
from commodity.net import localhost, listen_port

from brimstone import PhantomJS

sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestBrowserToServer(TestCase):
    base_url = "http://127.0.0.1:8080/static/"

    @classmethod
    def setUpClass(cls):
        cls.expected_message = "example message"

        with Spy() as servant:
            servant.send_proxy(ANY_ARG)

        cls.servant = servant
        cls.server = Server(cls.servant)
        cls.browser = PhantomJS()

        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        cls.server.stop()

    def test_browser_send_proxy_to_server(self):
        url = self.base_url + "B2S_proxy_marshalling.html"
        self.browser.open(url)

        button = self.browser.find_element("#send-proxy-button")
        button.click()

        wait_that(self.servant.send_proxy, called())
