# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from commodity.testing import assert_that, call_with
from hamcrest import has_item

from sulfurium import Chrome
from server import Server

import wise


class IntrospectionTests(TestCase):
    url = "http://127.0.0.1:8080/static/introspection_tests.html"

    @classmethod
    def setUpClass(cls):
        cls.server = Server()
        cls.browser = Chrome(left_open=True)
        cls.ws = wise.initialize(port=8081)

    @classmethod
    def tearDownClass(cls):
        del cls.server
        cls.browser.exit()
        del cls.browser

    def test_server_wise_getMethodNames(self):
        self.browser.open(self.url)

        result = self.browser.find_element("#result")
        button = self.browser.find_element('#invoke')
        button.click()

        expected_message = "get_error, get_message, set_message"

        assert_that(result.get_value,
                    call_with().returns(expected_message))

    def test_browser_wise_getMethodNames(self):
        self.browser.open(self.url)

        web_obj = self.ws.stringToProxy("obj1 -w browser")
        assert web_obj
        assert_that(web_obj.wise_getMethodNames(), has_item("echo"))
