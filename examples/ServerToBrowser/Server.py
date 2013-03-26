#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
import wise


class Server:
    def __init__(self):
        self._ic = wise.initialize()

        # register static files handler
        pwd = os.path.abspath(os.path.dirname(__file__))
        frontend = wise.StaticFSApplication(self._ic, '/static/', pwd, "index.html")
        self._ic.registerApplication(frontend)

    def update_banner_message(self, message="hello"):
        banner = self._ic.stringToProxy("Banner -e browser")
        banner.set_message(message=message)

    @property
    def url(self):
        return "http://127.0.0.1:8080/static/index.html"


if __name__ == "__main__":
    Server().update_banner_message()
