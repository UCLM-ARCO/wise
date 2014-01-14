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
        remote = broker.stringToProxy("Message -w browser")
        for i in range(10):
            time.sleep(1)

            if remote is None:
                print("Browser is not ready yet...")
                remote = broker.stringToProxy("Message -w browser")
                continue

            remote.set_message("Hello, World! ({})".format(i))


if __name__ == "__main__":
    Server()
