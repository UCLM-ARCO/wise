#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
pwd = os.path.abspath(os.path.dirname(__file__))

import wise


class Printer:
    def write(self, message, current=None):
        print "Message received: '{}'".format(message)


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(Printer(), "printer1")

        # register static files handler to serve static files
        frontend = wise.StaticFSApplication(broker, '/static/', pwd)
        broker.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(broker.host, broker.port)
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
