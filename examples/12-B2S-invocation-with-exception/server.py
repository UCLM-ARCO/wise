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
        ic = wise.initialize()

        adapter = ic.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(Servant(), "Server")

        # register static files handler to serve 'index.html'
        pwd = os.path.abspath(os.path.dirname(__file__))
        frontend = wise.StaticFSApplication(ic, '/static/', pwd, "index.html")
        ic.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(ic.host, ic.port)
        ic.waitForShutdown()


if __name__ == "__main__":
    Server()
