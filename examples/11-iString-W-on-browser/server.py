#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
import wise
from sulfurium import Chrome
from commodity.testing import wait_that, call_with


class Server:
    def __init__(self):
        self._ic = wise.initialize()

        # register static files handler
        pwd = os.path.abspath(os.path.dirname(__file__))
        frontend = wise.StaticFSApplication(
            self._ic, '/static/', pwd, "index.html")
        self._ic.registerApplication(frontend)

        # open browser
        print "Openning browser, please wait..."

        self._browser = Chrome(left_open=True)
        self._browser.open(self.url)
        wait_that(self._browser.is_ready, call_with().returns(True))

    def update_banner_message(self, message="hello from the server"):
        banner = self._ic.stringToProxy("Banner -w browser")
        if not banner:
            print "ERROR: could not create proxy to in-browser object!"
            return

        banner.set_message(message=message)

    @property
    def url(self):
        return "http://127.0.0.1:8080/static/index.html"


if __name__ == "__main__":
    Server().update_banner_message()
