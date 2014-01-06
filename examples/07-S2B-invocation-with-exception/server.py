#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise
from wise.Exceptions import UnknownLocalException


class Server:
    def __init__(self):
        broker = wise.initialize()
        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(broker.get_url('static/index.html')))
        time.sleep(5)
        self.send_messages(broker)

    def send_messages(self, broker):
        remote = None
        for i in range(10):
            time.sleep(1)

            if remote is None:
                remote = broker.stringToProxy("Excepter -w ws1")
                continue

            try:
                remote.throw_exception()
            except UnknownLocalException as e:
                print("Exception raised: {}".format(e))


if __name__ == "__main__":
    Server()
