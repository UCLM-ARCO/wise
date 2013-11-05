#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print "Message received: '{}', return: '{}'".format(message, retval)
        return retval

    def absa(self, value, current=None):
        return abs(value)


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(Servant(), "Server")

        # register static files handler to serve 'index.html'
        frontend = wise.StaticFSApplication(broker, '/static/', __file__)
        broker.registerApplication(frontend)

        print "Visit: {} (press C-F5 to force refresh)".format(
            broker.get_url('static/index.html'))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
