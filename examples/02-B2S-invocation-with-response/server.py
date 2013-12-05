#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import string
import wise


class Servant:
    def get_chars(self, message, current=None):
        chars = self._used_chars(message)
        print "Message received: '{}', return: '{}'".format(message, chars)
        return chars

    def _used_chars(self, text):
        """ Return the sorted list of used characters in given string """
        chars = [x for x in text if x in string.letters + string.digits]
        chars = str.join("", sorted(list(set(chars))))
        return chars


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "ws1")
        adapter.add(Servant(), "Server")

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        broker.waitForShutdown()


if __name__ == "__main__":
    Server()
