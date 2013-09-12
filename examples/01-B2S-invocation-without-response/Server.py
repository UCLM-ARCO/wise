#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
pwd = os.path.abspath(os.path.dirname(__file__))

import wise


class Servant:
    def set_message(self, message, current=None):
        print "Message received: '{}'".format(message)


class Server:
    def __init__(self):
        ic = wise.initialize()

        adapter = ic.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(Servant(), "Server")

        # register static files handler to serve static files
        frontend = wise.StaticFSApplication(ic, '/static/', pwd)
        ic.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(ic.host, ic.port)
        ic.waitForShutdown()


if __name__ == "__main__":
    Server()
