# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from hamcrest import is_not
from prego.net import localhost, listen_port
from doublex import Spy, called

from commodity.testing import assert_that, call_with

import wise

from sulfurium import Chrome
from server import Server


class IntrospectionTests(TestCase):
    def test_server_wise_getMethodNames(self):
        server = Server()
        self.browser = Chrome(left_open=False)

        base_url = "http://127.0.0.1:8080/static/"
        url = base_url + "introspection_tests.html"

        self.browser.open(url)
        button = self.browser.find_element('#invoke')
        button.click()

        result = self.browser.find_element("#result")

        expected_message = "get_error, get_message, set_message"

        assert_that(result.get_value,
                    call_with().returns(expected_message))

    def test_browser_wise_getMethodNames(self):
        self.skipTest("ToDo")
