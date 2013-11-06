#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import os

import wise
from wise.Exceptions import UnknownLocalException


class SomeException(Exception):
    def __init__(self, message):
        self.message = message


class Server:
    def __init__(self):
        ws = wise.initialize()

        # register static files handler to serve 'index.html'
        pwd = os.path.abspath(os.path.dirname(__file__))
        frontend = wise.StaticFSApplication(ws, '/static/', pwd, "index.html")
        ws.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(ws.host, ws.port)
        self.send_messages(ws)

    def send_messages(self, ws):
        remote = None

        for i in range(10):
            time.sleep(1)

            if remote is None:
                remote = ws.stringToProxy("Excepter -w browser")
                continue

            try:
                remote.throw_exception()
            except UnknownLocalException as e:
                print "Exception raised:", e


if __name__ == "__main__":
    Server()
