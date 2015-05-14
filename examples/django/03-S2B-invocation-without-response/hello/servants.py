# -*- mode: python; coding: utf-8 -*-

import time
import thread


def get_proxy(broker):
    while 1:
        retval = broker.stringToProxy("printer1 -w browser")
        if retval:
            return retval

        print("Browser is not ready...")
        time.sleep(1)


def send_messages(broker):
    proxy = get_proxy(broker)
    for i in range(10):
        proxy.set_message("Hello, World! ({})".format(i))
        time.sleep(1)


def initialize(broker):
    thread.start_new_thread(send_messages, (broker,))
