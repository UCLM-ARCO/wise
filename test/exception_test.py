# -*- mode: python; coding: utf-8 -*-

import sys
import os
from unittest import TestCase
from commodity.testing import wait_that, call_with
from commodity.net import localhost, listen_port

from brimstone import PhantomJS, Chrome

from wise.Exceptions import ObjectNotExistException, OperationNotExistException
sys.path.insert(0, os.path.dirname(__file__))
from server import Server


class TestServerToBrowser(TestCase):
    url = "http://127.0.0.1:8080/static/server_to_browser_test.html"

    @classmethod
    def setUpClass(cls):
        cls.server = Server()
        cls.browser = Chrome(left_open=True)
        wait_that(localhost, listen_port(8080))

    @classmethod
    def tearDownClass(cls):
        # cls.browser.quit()
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.url)

    def test_object_not_exist_exception(self):
        def object_throws_exception():
            try:
                browserPrx = self.server.ws.stringToProxy("notExistingID -w browser")
                browserPrx.get_message()
                return False
            except ObjectNotExistException:
               return True

        wait_that(object_throws_exception, call_with().returns(True))

    def test_operation_not_exist_exception(self):
        def object_throws_exception():
            try:
                browserPrx = self.server.ws.stringToProxy("Message -w browser")
                browserPrx.not_existing_method()
                return False
            except OperationNotExistException:
                return True

        wait_that(object_throws_exception, call_with().returns(True))
