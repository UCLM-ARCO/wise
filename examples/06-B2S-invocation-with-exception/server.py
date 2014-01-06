#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
import wise


class SomeException(Exception):
    def __init__(self, message):
        self.message = message


class Servant:
    count = 0

    def send(self, current):
        self.count += 1
        raise SomeException("This is an error condition ({})".format(self.count))


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(Servant(), "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: " + broker.get_url('static/index.html'))

        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
