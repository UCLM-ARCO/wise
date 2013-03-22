# -*- mode: python; coding: utf-8 -*-

import os
import json
from selenium import webdriver

from commodity.testing import wait_that, bind_method

import logging
logging.getLogger().setLevel(logging.INFO)


class Chrome(object):
    def __init__(self, headless=True, left_open=False):
        self._left_open = left_open
        pwd = os.path.abspath(os.path.dirname(__file__))

        if headless:
            xvfb_chrome = os.path.join(pwd, "./chromedriver-xvfb.sh")
            self.driver = webdriver.Chrome(
                executable_path=xvfb_chrome)
        else:
            self.driver = webdriver.Chrome()

    def __del__(self):
        if self._left_open:
            return

        self.driver.quit()

    def open(self, url, debug=False):
        self.driver.get(url)

        if debug:
            wait_that(self, bind_method(Chrome.is_ready, result=True))
            self.open_chrome_inspector()

    def is_ready(self):
        status = self.driver.execute_script("return document.readyState;")
        return status == "complete"

    def find_element(self, query):
        return self.driver.find_element_by_css_selector(query)

    def set_attribute(self, node, key, value):
        if isinstance(value, bool) and not value:
            cmd = 'removeAttribute("{}")'.format(key)
        else:
            value = json.dumps(value)
            cmd = 'setAttribute("{}", {})'.format(key, value)

        script = 'arguments[0].{};'.format(cmd)
        self.driver.execute_script(script, node)

    def open_chrome_inspector(self):
        pass
        # the idea here is:
        #  - open new tab with "chrome://inspect/#"
        #  - find link to explore the current tab
        #  - click on it
