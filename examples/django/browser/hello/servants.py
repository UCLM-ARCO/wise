# -*- mode: python; coding: utf-8 -*-

from models import Person


class HelloServant(object):
    def __init__(self, broker):
        self.broker = broker

    def say_hello(self, name, current):
        print "  -> {} says hello!".format(name)

        message = self._get_message(name)
        remote = self._get_remote()
        remote.say_response(message)

    def _get_message(self, name):
        p = Person.objects(name=name).first()
        if p is None:
            return "{}, I'm sorry, I don't know you.".format(name)
        return "Hello {}, you are {} years old.".format(p.name, p.age)

    def _get_remote(self):
        return self.broker.stringToProxy("hello -w HelloBrowser")


def initialize(broker):
    adapter = broker.createObjectAdapter("Adapter", "-w HelloServer")
    adapter.add(HelloServant(broker), "hello")
