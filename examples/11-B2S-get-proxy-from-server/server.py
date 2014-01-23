#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print("Message received: '{}', return: '{}'".format(message, retval))
        return retval

    def get_proxy(self, current=None):
        return self.proxy


class Server:
    def __init__(self):
        broker = wise.initialize()
        servant = Servant()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        proxy = adapter.add(servant, "Server")
        servant.proxy = proxy

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()

if __name__ == "__main__":
    Server()
