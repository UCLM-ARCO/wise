#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def _init_(self, broker):
        self._broker = broker

    def upper(self, message, current=None):
        retval = message.upper()
        print "Message received: '{}', return: '{}'".format(message, retval)
        return retval

    def send_proxy(self, current=None):
        proxy = self._broker.stringToProxy("Server -w ws1 -h 127.0.0.1 -p 8080")

        return proxy


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Servant(broker), "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()

if __name__ == "__main__":
    Server()
