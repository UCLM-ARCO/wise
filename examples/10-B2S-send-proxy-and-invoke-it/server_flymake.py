#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise


class Servant:
    def receive_proxy(self, proxy, current=None):
        proxy.set_message("example message")

class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Servant(), "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))


if __name__ == "__main__":
    Server()
