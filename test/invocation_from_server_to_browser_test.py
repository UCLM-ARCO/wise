# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from hamcrest import assert_that, equal_to
from commodity.testing import wait_that, call_with
from selenium.webdriver.remote.webelement import WebElement

import wise
from sulfurium import Chrome
from examples.ServerToBrowser import Server

class TestServerToBrowser(TestCase):
    @classmethod
    def setUpClass(cls):
        cls._expected_message = "some message"
        cls._server = Server()
        cls._browser = Chrome()

    @classmethod
    def tearDownClass(cls):
        del cls._server
        del cls._browser

    def setUp(self):
        self._ic = wise.initialize()

    def test_server_to_browser_no_response(self):
        #-- GIVEN --------------------
        self._browser.open(self._server.url)
        wait_that(self._browser.is_ready, call_with().returns(True))

        element = self._browser.find_element('#banner')
        element.clear()

        # wait until object in browser is ready
        ready = self._browser.find_element("#ready")
        wait_that(ready.get_attribute, call_with('checked').returns("true"))

        #-- WHEN --------------------
        # set message on remote object
        banner = self._ic.stringToProxy("Banner -e browser")
        banner.set_message(message=self._expected_message)

        #-- THEN --------------------
        # assure that invocation is dispatched correctly
        element = self._browser.find_element('#banner')
        wait_that(element.get_attribute,
                  call_with("value").returns(self._expected_message))

    def test_browser_to_server_with_response(self):
        # open server url
        self._browser.open(self._server.url)
        wait_that(self._browser.is_ready, call_with().returns(True))

        # wait until object in browser is ready
        ready = self._browser.find_element("#ready")
        wait_that(ready.get_attribute, call_with('checked').returns("true"))

        # set message on element
        element = self._browser.find_element('#banner')
        element.clear()
        element.send_keys(self._expected_message)

        # get message from remote object
        banner = self._ic.stringToProxy("Banner -e browser")
        message = banner.get_message()

        # verify that message is correct
        assert_that(message, equal_to(self._expected_message))
