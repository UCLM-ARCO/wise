# -*- mode: python; coding: utf-8 -*-


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print "Message received: '{}', return: '{}'".format(message, retval)
        return retval


def initialize(broker):
    adapter = broker.createObjectAdapter("ServerAdapter", "-w ws1")
    adapter.add(Servant(), "upper1")
