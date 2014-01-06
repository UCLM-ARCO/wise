#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise


class Server:
    def __init__(self):
        broker = wise.initialize()
        self._observable = wise.Observable()

        adapter = broker.createObjectAdapter("Adapter", "ws1")
        adapter.add(self._observable, "Observable")

        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: " + broker.get_url('static/index.html'))
        time.sleep(5)
        self.send_messages()

    def send_messages(self):
        for i in range(10):
            time.sleep(1)

            msg = "Hello, World! ({})".format(i)
            self._observable.notify("set_message", msg)
            print("Message sent: " + msg)


if __name__ == "__main__":
    Server()
