#!/usr/bin/env python
# -*- mode:python; coding:utf-8; tab-width:4 -*-

import wise


class Observable(object):
    def __init__(self):
        self.observers = []

    def attach(self, observer):
        self.observers.append(observer)

    def detach(self, observer):
        self.observers.remove(observer)

    def notify(self, method, *args):
        for ob in self.observers[:]:
            try:
                getattr(ob, method)(*args)
            except Exception:
                self.detach(ob)


class AlreadySubscribed(Exception):
    pass


class RemoveCurrent:
    def __init__(self, remote):
        self._remote = remote

    def __getattr__(self, key):
        fn = getattr(self._remote, key)

        def deco(*args):
            return fn(*args[:-1])
        return deco


class Chat(Observable):
    def send(self, nick, message, current=None):
        self.notify("send", nick, message)

    def subscribe(self, nick, observer, current):
        broker = current.adapter.getCommunicator()
        member = broker.stringToProxy(observer)
        member.nick = nick

        member.send("Channel", "Welcome to the wise chat")
        for m in self.observers:
            member.new_member(m.nick)

        if nick in [m.nick for m in self.observers]:
            raise AlreadySubscribed(nick)

        self.attach(member)
        self.notify("new_member", nick)

        oid = member.wise_getIdentity()
        print "OID:", oid
        # current.adapter.add(RemoveCurrent(member), oid)


class Server:
    def __init__(self):
        self.chat = Chat()
        broker = wise.initialize(host="szpilman", properties = {"TornadoApp.debug": True})
        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(self.chat, "chat1")
        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
