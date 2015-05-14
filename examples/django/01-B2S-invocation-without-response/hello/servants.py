# -*- mode: python; coding: utf-8 -*-


class Printer:
    def write(self, message, current=None):
        print("Message received: '{}'".format(message))


def initialize(broker):
    adapter = broker.createObjectAdapter("ServerAdapter", "-w ws1")
    adapter.add(Printer(), "printer1")
