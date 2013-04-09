# -*- coding:utf-8; tab-width:4; mode:python -*-

from unittest import TestCase
from hamcrest import is_not, is_

from commodity.os_ import SubProcess
from commodity.path import abs_dirname
from commodity.testing import (
    assert_that, wait_that, listen_port, localhost, bind_method)

from chromehandler import Chrome


class Test(TestCase):
    @classmethod
    def setUpClass(cls):
        cls._browser = Chrome()

        assert_that(localhost, is_not(listen_port(8000)))
        cls._server = SubProcess('python3 -m http.server',
                                 cwd=abs_dirname(__file__))
        wait_that(localhost, listen_port(8000))

    @classmethod
    def tearDownClass(cls):
        cls._server.terminate()
        del cls._browser

    def setUp(self):
        self._browser.open('http://localhost:8000')
        wait_that(self._browser, bind_method(Chrome.is_ready, result=True))

    def test_static_element_present(self):
        element = bool(self._browser.find_element('#present'))
        assert_that(element, is_(True))

    def test_static_element_absent(self):
        element = bool(self._browser.find_element('#not-present'))
        assert_that(element, is_(False))

    def test_dynamic_element_present(self):
        wait_that(self._browser, bind_method(Chrome.find_element,
                                             ('#newitem',)))
