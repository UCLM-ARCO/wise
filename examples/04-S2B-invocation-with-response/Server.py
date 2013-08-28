#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import os
pwd = os.path.abspath(os.path.dirname(__file__))

import wise


class Server:
    def __init__(self):
        ic = wise.initialize()

        # register static files handler to serve 'index.html'
        frontend = wise.StaticFSApplication(ic, '/static/', pwd, "index.html")
        ic.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(ic.host, ic.port)
        self.send_messages(ic)

    def send_messages(self, ic):
        for i in range(10):
            time.sleep(1)

            remote = ic.stringToProxy("Message -w browser")
            if remote is None:
                print "Browser is not ready..."
                continue

            response = remote.set_message(message="Hello, World! ({})".format(i))
            print "browser said:", response


if __name__ == "__main__":
    Server()
