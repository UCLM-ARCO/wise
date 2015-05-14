# -*- mode: python; coding: utf-8 -*-

from models import Person


class HelloServant(object):
    def say_hello(self, name, current):
        try:
            p = Person.objects.get(name=name)
        except Person.DoesNotExist:
            return "{}, I'm sorry, I don't know you.".format(name)

        return "Hello {}, you are {} years old.".format(p.name, p.age)


def initialize(broker):
    adapter = broker.createObjectAdapter("Adapter", "-w HelloWS")
    adapter.add(HelloServant(), "helloSrv")
