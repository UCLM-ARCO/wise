# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from doublex import Spy, called
from hamcrest import assert_that, anything
from commodity.testing import wait_that

from chromehandler import Chrome
from examples.BrowserToServer import Server


class TestBrowserToServer(TestCase):
    @classmethod
    def setUpClass(cls):
        cls._expected_message = "other message"

        # create spied servant
        with Spy() as servant:
            servant.get_message().returns(
                {'message': cls._expected_message})
            cls._servant = servant

        # create server with servant
        cls._server = Server(cls._servant)

        # create chrome
        cls._browser = Chrome(headless=False, left_open=True)

    @classmethod
    def tearDownClass(cls):
        # delete chrome
        del cls._server
        del cls._browser

    def test_browser_to_server_no_response(self):
        # open server url
        self._browser.open(self._server.url)

        # click on button 'set'
        button = self._browser.find_element('#set_button')
        button.click()

        # verify spy is called
        wait_that(self._servant.set_message, called())
        assert_that(self._servant.set_message,
                    called().with_args(message='the message',
                                       current=anything()))

    def test_browser_to_server_with_response(self):
        # open server url
        self._browser.open(self._server.url)

        # click on button
        button = self._browser.find_element('#get_button')
        button.click()

        # verify that div has content from servant
        wait_that(self._servant.get_message,
                  called().with_args(current=anything()))

        self._server.loop()
