#!/usr/bin/env python
# -*- mode:python; coding:utf-8; tab-width:4 -*-

import wise


class Observable(object):
    def __init__(self):
        self.observers = []

    def attach(self, func):
        self.observers.append(func)

    def notify(self, **args):
        for ob in self.observers:
            try:
                ob(**args)
            except Exception:
                self.observers.remove(ob)


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


if __name__ == "__main__":
    Server()
