#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def __init__(self, message=""):
        self.set_message(message)

    def set_message(self, message, current=None):
        print "SET MESSAGE:", message
        self._message = message

    def get_message(self, current=None):
        print "GET MESSAGE: return '{}'".format(self._message)
        return self._message


class Server:
    def __init__(self, servant=None):
        self._ic = wise.initialize()
        adapter = self._ic.createObjectAdapter("ServerAdapter", "ws")

        if servant is None:
            servant = Servant()
        adapter.add(servant, "Server")

        self._ic.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(self._ic.get_url('static/index.html')))
        self._ic.waitForShutdown()

if __name__ == "__main__":
    Server().loop()
