#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
import wise


class Servant:
    def __init__(self, message=""):
        self.set_message(message)

    def set_message(self, message, current=None):
        self._message = message

    def get_message(self, current=None):
        return self._message


class Server:
    def __init__(self, servant):
        self._ic = wise.initialize()
        adapter = self._ic.createObjectAdapter("ServerAdapter", "ws")

        if servant is None:
            servant = Servant()
        adapter.add(servant, "Server")

        # register static files handler
        pwd = os.path.abspath(os.path.dirname(__file__))
        frontend = wise.StaticFSApplication(self._ic, '/', pwd, "index.html")
        self._ic.registerApplication(frontend)

    def loop(self):
        print "Server ready, waiting events"
        self._ic.waitForShutdown()

    def stop(self):
        self._ic.shutdown()
        self._ic.waitForShutdown()
        del self._ic

    @property
    def url(self):
        return "http://127.0.0.1:8080/index.html"


if __name__ == "__main__":
    Server().loop()
