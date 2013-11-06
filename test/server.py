#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import os
import wise


class CustomException(Exception):
    def __init__(self, message):
        self.message = message


class Servant:
    def __init__(self):
        self.message = "initial message"

    def set_message(self, message, current=None):
        self.message = message

    def get_message(self, current=None):
        return self.message

    def get_error(self, current=None):
        raise CustomException("There were some kind of error")


class Server:
    def __init__(self, servant=None):
        self.ws = wise.initialize()

        if servant is None:
            servant = Servant()

        adapter = self.ws.createObjectAdapter("ServerAdapter", "ws")
        adapter.add(servant, "Server")

        # register static files handler to serve 'index.html'
        pwd = os.path.abspath(os.path.dirname(__file__))
        pwd = os.path.join(pwd, 'static')
        frontend = wise.StaticFSApplication(self.ws, '/static/', pwd)
        self.ws.registerApplication(frontend)

    def loop(self):
        self.ws.waitForShutdown()

    def stop(self):
        self.ws.shutdown()


if __name__ == "__main__":
    Server().loop()
