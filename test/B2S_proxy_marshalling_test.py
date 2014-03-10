# -*- mode:python; coding:utf-8; tab-width:4 -*-

import sys
import os

from unittest import TestCase
from doublex import Spy, called, ANY_ARG
from commodity.testing import wait_that, assert_that, call_with
from commodity.net import localhost, listen_port

from brimstone import PhantomJS

sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestCheckInvocations(TestCase):
    url = "http://127.0.0.1:8080/static/proxy_marshalling.html"

    @classmethod
    def setUpClass(cls):
        cls.expected_message = "EXAMPLE MESSAGE"
        cls.browser = PhantomJS()

        with Spy() as servant:
            servant.send_proxy(ANY_ARG)
            servant.get_proxy(ANY_ARG)

        cls.servant = servant
        cls.server = Server(cls.servant)

        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.url)

    def test_send_proxy_method_is_called(self):
        button = self.browser.find_element("#send-proxy-button")
        button.click()
        assert_that(self.servant.send_proxy, called())

    def test_upper_method_is_called(self):
        button = self.browser.find_element("#get-proxy-button")
        button.click()
        assert_that(self.servant.get_proxy, called())


class Servant:
    def send_proxy(self, proxy, current=None):
        proxy.set_message("EXAMPLE MESSAGE")

    def upper(self, message, current=None):
        retval = message.upper()
        return retval

    def get_proxy(self, current=None):
        return self.proxy


class TestCheckProxy(TestCase):
    url = "http://127.0.0.1:8080/static/proxy_marshalling.html"

    @classmethod
    def setUpClass(cls):
        cls.expected_message = "EXAMPLE MESSAGE"
        cls.browser = PhantomJS()

        cls.servant = Servant()
        cls.server = Server(cls.servant)

        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        # cls.browser.quit()
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.url)

    def test_send_and_invoke_proxy(self):
        button = self.browser.find_element("#send-proxy-button")
        button.click()

        element = self.browser.find_element("#message")
        wait_that(element.get_attribute,
                  call_with("value").returns(self.expected_message))

    def test_browser_receive_proxy_from_server(self):
        proxy = self.server.adapter.add(self.servant, "Server2")
        self.servant.proxy = proxy

        button = self.browser.find_element("#get-proxy-button")
        button.click()

        element = self.browser.find_element("#message")

        wait_that(element.get_attribute,
                  call_with("value").returns(self.expected_message))

