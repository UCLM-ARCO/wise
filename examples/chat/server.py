#!/usr/bin/env python
# -*- mode:python; coding:utf-8; tab-width:4 -*-

import wise


class ListenerDict(dict):
    def notify(self, method, *args):
        for ob in self.values()[:]:
            try:
                getattr(ob, method)(*args)
            except Exception:
                del ob


class AlreadySubscribed(Exception):
    pass


class servant_alike(object):
    def __init__(self, remote):
        self._remote = remote

    def __getattr__(self, key):
        fn = getattr(self._remote, key)

        def deco(*args):
            return fn(*args[:-1])
        return deco


class ChatManager(object):
    def __init__(self):
        self.public_listeners = ListenerDict()
        self.private_listeners = ListenerDict()

    def send(self, nick, message, current=None):
        self.public_listeners.notify("send", nick, message)

    def subscribe(self, nick, public_listener, private_listener, current=None):
        print self.public_listeners
        if nick in self.public_listeners.keys():
            raise AlreadySubscribed(nick)

        broker = current.adapter.getCommunicator()
        self.register_public(nick, broker.stringToProxy(public_listener))
        self.register_private(nick, broker.stringToProxy(private_listener), current.adapter)

    def register_public(self, nick, listener):
        listener.send("Channel", "Welcome to the wise chat")

        for n in self.public_listeners.keys():
            listener.notify_added_member(n)

        self.public_listeners[nick] = listener
        self.public_listeners.notify("notify_added_member", nick)

    def register_private(self, nick, listener, adapter):
        proxy = adapter.add(servant_alike(listener), listener.wise_getIdentity())
        self.private_listeners[nick] = proxy

    def get_member(self, nick, current=None):
        return self.private_listeners[nick]


class Server(object):
    def __init__(self):
        broker = wise.initialize(host="0.0.0.0", properties = {"TornadoApp.debug": True})
        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(ChatManager(), "chat1")
        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
