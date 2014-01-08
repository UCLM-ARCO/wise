#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print "Message received: '{}', return: '{}'".format(message, retval)
        return retval


class Server:
    def __init__(self):
        self.broker = wise.initialize()

        adapter = self.broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Servant(), "Server")

        self.broker.register_StaticFS('/static', wise.dirname(__file__))

        proxy = self.broker.stringToProxy("Server -w ws1 -h 127.0.0.1 -p 8080")
        self.send_proxy()


    def send_proxy(proxy):
        time.sleep(3)

        remote = broker.stringToProxy("obj1 -w browser")

        if remote is None:
                print "Browser is not ready..."

        remote.receive_object(proxy)

        return remote



if __name__ == "__main__":
    Server()
