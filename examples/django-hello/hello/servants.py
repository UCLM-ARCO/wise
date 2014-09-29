# -*- mode: python; coding: utf-8 -*-


class HelloServant(object):
    def say_hello(self, name, current):
        return "Hello, " + name


def initialize(broker):
    adapter = broker.createObjectAdapter("Adapter", "-w HelloWS")
    adapter.add(HelloServant(), "helloSrv")
