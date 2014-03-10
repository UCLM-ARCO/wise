#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import wise


class CustomException(Exception):
    pass


class Servant:
    def __init__(self):
        self.message = "initial message"

    def set_message(self, message, current=None):
        self.message = message
        print self.message

    def get_message(self, current=None):
        return self.message

    def get_error(self, current=None):
        # Do no change that message
        raise CustomException("An error message")


class Server:
    def __init__(self, servant=None):
        self.ws = wise.initialize(host="127.0.0.1",
                                  properties = {"TornadoApp.debug": True})
        self.servant = servant or Servant()

        self.adapter = self.ws.createObjectAdapter("ServerAdapter", "-w ws")
        self.proxy = self.adapter.add(self.servant, "Server")

        self.ws.register_StaticFS('/static', wise.dirname(__file__) + '/static')

    def loop(self):
        self.ws.waitForShutdown()

    def stop(self):
        self.ws.shutdown()


if __name__ == "__main__":
    Server().loop()
