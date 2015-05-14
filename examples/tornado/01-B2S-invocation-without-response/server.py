#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Printer:
    def write(self, message, current=None):
        print("Message received: '{}'".format(message))


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "-w ws1")
        adapter.add(Printer(), "printer1")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
