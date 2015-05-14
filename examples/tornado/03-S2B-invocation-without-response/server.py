#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import sys

import commodity.path as path
PROJECT_DIR = path.find_in_ancestors('project.mk', __file__)
sys.path.append(PROJECT_DIR)

import wise


class Server:
    def __init__(self):
        self.broker = wise.initialize()
        self.broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(self.broker.get_url('static/index.html')))

        time.sleep(5)
        self.send_messages()

    def get_proxy(self):
        while 1:
            retval = self.broker.stringToProxy("printer1 -w browser")
            if retval:
                return retval

            print("Browser is not ready...")
            time.sleep(1)

        return self.broker.stringToProxy_wait

    def send_messages(self):
        proxy = self.get_proxy()
        for i in range(12):
            proxy.set_message("Hello, World! ({})".format(i))
            time.sleep(1)


if __name__ == "__main__":
    Server()
