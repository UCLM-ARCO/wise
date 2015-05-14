#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import sys

import commodity.path as path
PROJECT_DIR = path.find_in_ancestors('project.mk', __file__)
sys.path.append(PROJECT_DIR)

import wise


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print "Message received: '{}', return: '{}'".format(message, retval)
        return retval


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "-w ws1")
        adapter.add(Servant(), "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
