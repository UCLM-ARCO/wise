# -*- mode: python; coding: utf-8 -*-

import sys
import os
from unittest import TestCase
from doublex import Spy, called, ANY_ARG
from hamcrest import anything
from commodity.testing import wait_that, call_with, assert_that
from commodity.net import localhost, listen_port

from brimstone import PhantomJS

sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestBrowserToServer(TestCase):
    base_url = "http://127.0.0.1:8080/static/"

    @classmethod
    def setUpClass(cls):
        cls.expected_message = "other message"

        class CustomException(Exception):
            def __init__(self, message):
                self.message = message

        cls.exception = CustomException("An error message")

        with Spy() as servant:
            servant.set_message()
            servant.get_message(ANY_ARG).returns(
                {'message': cls.expected_message})
            servant.get_error(ANY_ARG).raises(cls.exception)

        cls.servant = servant

        cls.server = Server(cls.servant)
        cls.browser = PhantomJS()

        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        cls.browser.quit()
        cls.server.stop()

    def test_browser_to_server_no_response(self):
        # open server url
        url = self.base_url + "invocation_from_browser_to_server_test.html"
        self.browser.open(url)

        message = 'the message'
        self.browser.find_element("#message").set_value(message)

        # click on button 'set'
        button = self.browser.find_element('#set-button')
        button.click()

        # verify spy is called
        wait_that(self.servant.set_message,
                  called().with_args(message, anything()))

    def test_browser_to_server_with_response(self):
        # open server url
        url = self.base_url + "invocation_from_browser_to_server_test.html"
        self.browser.open(url)

        # click on button
        button = self.browser.find_element('#get-button')
        button.click()

        # verify that div has content from servant
        wait_that(self.servant.get_message, called())

        message = self.browser.find_element('#message')
        assert_that(message.get_value,
                    call_with().returns(self.expected_message))

    def test_browser_to_server_with_exception(self):
        # open server url
        url = self.base_url + "invocation_from_browser_to_server_test.html"
        self.browser.open(url)

        # click on button
        button = self.browser.find_element('#error-button')
        button.click()

        # verify that div has content from servant
        wait_that(self.servant.get_error, called())

        message = self.browser.find_element('#error')
        assert_that(message.get_value,
                    call_with().returns("CustomException,An error message"))
