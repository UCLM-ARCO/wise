#!/usr/bin/env python
# -*- mode:python; coding:utf-8; tab-width:4 -*-

import wise
from commodity.pattern import memoized


class AlreadySubscribed(Exception):
    pass


class NoSuchMember(Exception):
    pass


class ChatManager(object):
    def __init__(self):
        self.members = {}
        self.redirections = {}

    def login(self, nick, current=None):
        if nick in self.members.keys():
            raise AlreadySubscribed(nick)

        self.members[nick] = None

    def subscribe(self, nick, member, current=None):
        member.send("Channel", "Welcome to the wise chat")
        map(member.notify_added_member, self.members.keys())

        self.members[nick] = member
        self.members_map(lambda x: x.notify_added_member(nick))

    def send(self, nick, message, private, current=None):
        self.members_map(lambda x: x.send(nick, message))

    def members_map(self, func):
        "exec 'func' with each member"
        for nick, member in self.members.copy().items():
            try:
                func(member)
            except Exception as e:
                print("chat-server: {0}: {1}".format(nick, e))
                del self.members[nick]
                self.members_map(lambda x: x.notify_removed_member(nick))

    @memoized(ignore=['current'])
    def get_member(self, nick, current=None):
        member = self.members.get(nick)
        if not member:
            raise NoSuchMember(nick)

        return current.adapter.add(wise.proxy_as_servant(member),
                                   member.wise_getIdentity())


class Server(object):
    def __init__(self):
        broker = wise.initialize(host="127.0.0.1",
            properties = {"TornadoApp.debug": True})
        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(ChatManager(), "chat1")
        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))
        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
