#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class Changer:
    def toggle_me(self, button, current=None):
        print button
        button.hide()


class Server:
    def __init__(self):
        broker = wise.initialize()
        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Changer(), "changer1")
        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(broker.get_url('static/index.html')))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
