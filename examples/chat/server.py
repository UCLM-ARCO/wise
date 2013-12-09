#!/usr/bin/env python
# -*- mode:python; coding:utf-8; tab-width:4 -*-

import time
import wise


class Observable(object):
    def __init__(self):
        self.observers = []

    def attach(self, func):
        self.observers.append(func)

    def notify(self, **args):
        for ob in self.observers:
            ob(**args)


class Chat(Observable):
    def send_to_all(self, nick, message, current=None):
        self.notify(nick=nick, message=message)

    def subscribe(self, observer, current=None):
        broker = current.adapter.getCommunicator()
        observer = broker.stringToProxy(observer)
        self.attach(observer.send)
        observer.send(nick="server", message="Welcome to the wise chat")
        self.send_to_all("server", "New chat member: FIXME")


class Server:
    def __init__(self):
        self.chat = Chat()

        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(self.chat, "chat1")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()

#         time.sleep(5)
#         self.send_messages(broker)
#
#     def send_messages(self, broker):
#         for i in range(10):
#             time.sleep(1)
#
#             msg = "Hello, World! ({})".format(i)
#             self.chat.send_to_all("server", msg)


if __name__ == "__main__":
    Server()
