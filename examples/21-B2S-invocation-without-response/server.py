#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

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
        frontend = wise.StaticFSApplication(broker, '/static/', __file__)
        broker.registerApplication(frontend)

        print "Visit: {} (press C-F5 to force refresh)".format(
            broker.get_url('static/index.html'))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
