# -*- mode: python; coding: utf-8 -*-

import sys
import os
from unittest import TestCase
from doublex import Spy, called, ANY_ARG
from hamcrest import assert_that, anything
from commodity.testing import wait_that, call_with

from brimstone import PhantomJS

sys.path.insert(0, os.path.dirname(__file__))


class ChatTests(TestCase):
    base_url = "http://127.0.0.1:8080/static/index.html"

    def test_subscription(self):
        browser = PhantomJS()
        browser.open(self.url)

        browser.find_element('#nickname').set_value('peter')
        browser.find_element('#login-button').click()
