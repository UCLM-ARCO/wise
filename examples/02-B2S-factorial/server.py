#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


def factorial(n):
    if n == 0:
        return 1

    return n * factorial(n - 1)


class Math:
    def factorial(self, value, current=None):
        return factorial(value)


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Math(), "math1")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
