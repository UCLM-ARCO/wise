# -*- mode: python; coding: utf-8 -*-

import time
import thread


def get_proxy(broker):
    while 1:
        retval = broker.stringToProxy("upper1 -w browser")
        if retval:
            return retval

        print("Browser is not ready...")
        time.sleep(1)


def send_messages(broker):
    proxy = get_proxy(broker)
    for i in range(10):
        response = proxy.upper("Hello, World! ({})".format(i))
        print("browser said: {}".format(response))
        time.sleep(1)


def initialize(broker):
    time.sleep(5)
    thread.start_new_thread(send_messages, (broker,))
