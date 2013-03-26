# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from hamcrest import assert_that, equal_to
from commodity.testing import wait_that, bind_method
from selenium.webdriver.remote.webelement import WebElement

import wise
from chromehandler import Chrome
from examples.ServerToBrowser import Server

has_attribute = bind_method(WebElement.get_attribute)


class TestServerToBrowser(TestCase):
    @classmethod
    def setUpClass(cls):
        cls._expected_message = "some message"
        cls._server = Server()
        cls._browser = Chrome()  # headless=False, left_open=True)

    @classmethod
    def tearDownClass(cls):
        del cls._server
        del cls._browser

    def setUp(self):
        self._ic = wise.initialize()

    def test_server_to_browser_no_response(self):
        self._browser.open(self._server.url)
        wait_that(self._browser, bind_method(Chrome.is_ready, result=True))

        # wait until object in browser is ready
        ready = self._browser.find_element("#ready")
        wait_that(ready, has_attribute(('checked',), result="true"))

        # set message on remote object
        banner = self._ic.stringToProxy("Banner -e browser")
        banner.set_message(message=self._expected_message)

        # assure that invocation is dispatched correctly
        element = self._browser.find_element('#banner')
        wait_that(
            element, has_attribute(("value",), result=self._expected_message))

    def test_browser_to_server_with_response(self):
        # open server url
        self._browser.open(self._server.url)
        wait_that(self._browser, bind_method(Chrome.is_ready, result=True))

        # wait until object in browser is ready
        ready = self._browser.find_element("#ready")
        wait_that(ready, has_attribute(('checked',), result="true"))

        # set message on element
        element = self._browser.find_element('#banner')
        element.clear()
        element.send_keys(self._expected_message)

        # get message from remote object
        banner = self._ic.stringToProxy("Banner -e browser")
        message = banner.get_message()

        # verify that message is correct
        assert_that(message, equal_to(self._expected_message))
