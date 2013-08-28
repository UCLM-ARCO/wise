#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import os
pwd = os.path.abspath(os.path.dirname(__file__))

import wise


class Server:
    def __init__(self):
        ic = wise.initialize()

        self._observable = wise.Observable()

        adapter = ic.createObjectAdapter("Adapter", "ws")
        adapter.add(self._observable, "Observable")

        # register static files handler to serve 'index.html'
        frontend = wise.StaticFSApplication(ic, '/static/', pwd, "index.html")
        ic.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(ic.host, ic.port)
        self.send_messages(ic)

    def send_messages(self, ic):
        for i in range(100):
            time.sleep(1)

            msg = "Hello, World! ({})".format(i)
            self._observable.notify("set_message", message=msg)
            print "Message sent:", msg


if __name__ == "__main__":
    Server()
