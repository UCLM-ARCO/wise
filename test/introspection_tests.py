# -*- mode: python; coding: utf-8 -*-

from unittest import TestCase
from commodity.testing import assert_that, call_with
from hamcrest import has_item

from brimstone import PhantomJS
from server import Server


class IntrospectionTests(TestCase):
    url = "http://127.0.0.1:8080/static/introspection_tests.html"

    @classmethod
    def setUpClass(cls):
        cls.server = Server()
        cls.browser = PhantomJS(left_open=False)

    @classmethod
    def tearDownClass(cls):
        cls.browser.exit()
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.url)

    def test_server_wise_getMethodNames(self):
        result = self.browser.find_element("#result")
        button = self.browser.find_element('#invoke')
        button.click()

        expected_message = "get_error, get_message, set_message"

        assert_that(result.get_value,
                    call_with().returns(expected_message))

    def test_browser_wise_getMethodNames(self):
        web_obj = self.server.ws.stringToProxy("obj1 -w browser")
        assert web_obj
        assert_that(web_obj.wise_getMethodNames(), has_item("echo"))

