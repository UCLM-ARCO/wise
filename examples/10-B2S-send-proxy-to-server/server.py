#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def send_proxy(self, proxy, current=None):
        print("Received proxy: {}".format(proxy))
        proxy.set_message("example message")


class Server:
    def __init__(self):
        broker = wise.initialize()
        servant = Servant()

        adapter = broker.createObjectAdapter("ServerAdapter", "-w ws1")
        adapter.add(servant, "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
