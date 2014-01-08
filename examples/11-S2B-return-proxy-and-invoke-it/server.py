#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print "Message received: '{}', return: '{}'".format(message, retval)
        return retval


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Servant(broker), "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        remote = broker.stringToProxy("Message -w browser")
        print("Open: {}".format(broker.get_url('static/index.html')))

        proxy = remote.send_proxy()

        proxy.set_message("example message")

        broker.waitForShutdown()

if __name__ == "__main__":
    Server()
