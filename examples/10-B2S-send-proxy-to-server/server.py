#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Servant:
    def send_proxy(self, proxy, current=None):
        print("Received proxy: {}".format(proxy))
        proxy.set_message("example message")


class Server:
    def __init__(self, servant=None):
        self.broker = wise.initialize()
        servant = servant or Servant()

        adapter = self.broker.createObjectAdapter("ServerAdapter", "-w ws1 -h 127.0.0.1 -p 8080")
        adapter.add(servant, "Server")

        self.broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(self.broker.get_url('static/index.html')))

        self.broker.waitForShutdown()


if __name__ == "__main__":
    Server()
