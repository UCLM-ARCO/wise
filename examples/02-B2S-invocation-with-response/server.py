#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import string
import os
pwd = os.path.abspath(os.path.dirname(__file__))

import wise


class Servant:
    def get_chars(self, message, current=None):
        chars = self._used_chars(message)
        print "Message received: '{}', return: '{}'".format(message, chars)
        return chars

    def _used_chars(self, msg):
        """ Return the sorted list of used characters in given string """
        chars = [x for x in msg if x in string.letters or x in string.digits]
        chars = "".join(sorted(list(set(chars))))
        return chars


class Server:
    def __init__(self):
        ic = wise.initialize()

        adapter = ic.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(Servant(), "Server")

        # register static files handler to serve 'index.html'
        frontend = wise.StaticFSApplication(ic, '/static/', pwd, "index.html")
        ic.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(ic.host, ic.port)
        ic.waitForShutdown()


if __name__ == "__main__":
    Server()
