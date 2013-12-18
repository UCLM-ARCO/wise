#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise


class Server:
    def __init__(self):
        broker = wise.initialize()
        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(broker.get_url('static/index.html')))
        time.sleep(5)
        self.send_messages(broker)

    def send_messages(self, broker):
        for i in range(12):
            time.sleep(1)

            remote = broker.stringToProxy("obj1 -w browser")
            if remote is None:
                print "Browser is not ready..."
                continue

            response = remote.message_len("Hello, World! ({})".format(i))
            print("browser said: {}".format(response))


if __name__ == "__main__":
    Server()
