# -*- coding:utf-8; tab-width:4; mode:python -*-

from unittest import TestCase
from hamcrest import is_not

from commodity.os_ import SubProcess
from commodity.path import abs_dirname
from commodity.testing import (
    assert_that, wait_that, listen_port, localhost, bind_method)

from chromehandler import Chrome


class Test(TestCase):
    def setUp(self):
        assert_that(localhost, is_not(listen_port(8000)))
        server = SubProcess('python3 -m http.server', cwd=abs_dirname(__file__))
        wait_that(localhost, listen_port(8000))
        self.addCleanup(server.terminate)
        self._browser = Chrome()

    def test_present(self):
        self._browser.open('http://localhost:8000')
        wait_that(self._browser,
                  bind_method(Chrome.find_by_id, ('present',)))

#    def test_absent(self):
#        self._browser.open('http://localhost:8000')
#        wait_that(self._browser,
#                  bind_method(Chrome.find_by_id, ('absent',)))
