# -*- mode:python; coding:utf-8; tab-width:4 -*-

import sys
import os

from unittest import TestCase
from doublex import Spy, ANY_ARG, called
from hamcrest import anything
from commodity.testing import wait_that, assert_that, call_with
from commodity.net import localhost, listen_port

from brimstone import PhantomJS

sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestCheckProxyInvocations(TestCase):
    base_url = "http://127.0.0.1:8080/static/"

    @classmethod
    def setUpClass(cls):
        cls.expected_message = "EXAMPLE MESSAGE"

        with Spy() as servant:
            servant.upper(ANY_ARG).returns(cls.expected_message)

        cls.servant = servant
        cls.server = Server(servant)
        cls.serverPrx = cls.server.adapter.add(cls.servant, "example")

        cls.browser = PhantomJS(left_open=False)
        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.base_url + "proxy_marshalling.html")
        self.browserPrx = self.server.ws.stringToProxy("obj1 -w browser")

    def test_upper_method_is_called(self):
        self.browserPrx.set_proxy(self.serverPrx)
        assert_that(self.servant.upper,
                    called().with_args("example message", anything()))

    def test_DOM_is_updated(self):
        self.browserPrx.set_proxy(self.serverPrx)

        div = self.browser.find_element("#response")
        wait_that(div.get_attribute,
                  call_with("value").returns(self.expected_message))

    def test_get_proxy_and_invoke_it(self):
        remote = self.browserPrx.get_proxy()

        remote.set_message(self.expected_message)

        div = self.browser.find_element("#response")
        wait_that(div.get_attribute,
                  call_with("value").returns(self.expected_message))
