#!/usr/bin/env python
# -*- mode:python; coding:utf-8; tab-width:4 -*-

import wise
from commodity.pattern import memoized


class ServantAdapter:
    def __init__(self, proxy):
        self.proxy = proxy

    def send(self, *args):
        self.proxy.send(*args[:-1])


class AlreadySubscribed(Exception):
    pass


class NoSuchMember(Exception):
    pass


class ChatManager(object):
    def __init__(self):
        self.members = {}
        self.redirections = {}

    def send(self, nick, message, private, current=None):
        self.for_each_member(lambda x: x.send(nick, message))

    def subscribe(self, nick, member_proxy, current=None):
        print self.members, nick, member_proxy
# if nick in self.members.keys():
#            raise AlreadySubscribed(nick)

        member = current.adapter.getCommunicator().stringToProxy(member_proxy)
        member.send("Channel", "Welcome to the wise chat")
        map(member.notify_added_member, self.members.keys())

        self.members[nick] = member
        self.for_each_member(lambda x: x.notify_added_member(nick))

    def for_each_member(self, func):
        for key, member in self.members.copy().items():
            try:
                func(member)
            except Exception as e:
                print "server:", key, e
                del self.members[key]

    @memoized(ignore=['current'])
    def get_member(self, nick, current=None):
        print self.get_member.cache
        print "### getting member", self, nick

        member = self.members.get(nick)
        if not member:
            raise NoSuchMember(nick)

        proxy = current.adapter.add(ServantAdapter(member),
                                    member.wise_getIdentity())
        return proxy


class Server(object):
    def __init__(self):
        broker = wise.initialize(  # host="161.67.27.109",
            properties = {"TornadoApp.debug": True})
        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(ChatManager(), "chat1")
        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
