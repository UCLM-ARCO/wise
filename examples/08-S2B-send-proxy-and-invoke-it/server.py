#!/usr/bin/python -u
# -*- mode: python; coding: utf-8 -*-

import time
import wise


class Servant:
    def upper(self, message, current=None):
        retval = message.upper()
        print "\n\nMessage received: '{}', return: '{}'".format(message, retval)
        return retval


class Server:
    def __init__(self):
        broker = wise.initialize()

        adapter = broker.createObjectAdapter("ServerAdapter", "-w ws1")
        proxy = adapter.add(Servant(), "Server")
        broker.register_StaticFS('/static', wise.dirname(__file__))
        print("Open: {}".format(broker.get_url('static/index.html')))

        self.send_proxy(broker, proxy)
        broker.waitForShutdown()

    def send_proxy(self, broker, proxy):
        for i in range(100):
            time.sleep(1)
            remote = broker.stringToProxy("obj1 -w browser")

            if remote is not None:
                print("REMOTE: ", remote)
                break

            print ("Browser is not ready...{}".format(i))
            print proxy

        remote.receive_object(proxy)
        print "tras la invocacion"


if __name__ == "__main__":
    Server()
