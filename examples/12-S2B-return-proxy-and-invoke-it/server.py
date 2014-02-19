#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise


class Server:
    def __init__(self):
        broker = wise.initialize()

        broker.register_StaticFS('/static', wise.dirname(__file__))

        print("Open: {}".format(broker.get_url('static/index.html')))

        for i in range(10):
            time.sleep(1)
            remote = broker.stringToProxy("obj1 -w browser -h 127.0.0.1 -p 8080")

            if remote is not None:
                break
            print ("Browser is not ready...{}".format(i))

        proxy = remote.get_proxy()
        print("PROXY: {}".format(proxy))

        proxy.set_message("example message")

        broker.waitForShutdown()

if __name__ == "__main__":
    Server()
