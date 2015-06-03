# -*- mode: python; coding: utf-8 -*-

import time
import thread
import wise


def send_messages(observable):
    for i in range(10):
        time.sleep(1)

        msg = "Hello, World! ({})".format(i)
        observable.notify("set_message", msg)
        print("Message sent: " + msg)


def initialize(broker):
    observable = wise.Observable()

    adapter = broker.createObjectAdapter("Adapter", "-w ws1")
    adapter.add(observable, "Observable")

    time.sleep(5)
    thread.start_new_thread(send_messages, (observable,))
