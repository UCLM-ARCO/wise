#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import os
pwd = os.path.abspath(os.path.dirname(__file__))

import wise


class Server:
    def __init__(self):
        self.ice = wise.initialize()

        # register static files handler to serve 'index.html'
        frontend = wise.StaticFSApplication(self.ice, '/static/', pwd, "index.html")
        self.ice.registerApplication(frontend)

        print "Visit: http://{}:{}/static/index.html".format(self.ice.host, self.ice.port)
        self.send_messages()

    def send_messages(self):
        print 'The server is going to begin to invoke object in browser in 5s'
        time.sleep(5)

        for i in range(10):
            time.sleep(1)
            remote = self.ice.stringToProxy("Message -w browser")

            if remote is None:
                print "Browser is not ready..."
                continue

            remote.set_message(message="Hello, World! ({})".format(i))


if __name__ == "__main__":
    Server()
