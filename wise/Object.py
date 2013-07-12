# -*- mode: python; coding: utf-8 -*-

from . import Logging as logging


class Observable:
    def __init__(self):
        self.observers = []

    def attach(self, observer, current):
        wc = current.adapter.getCommunicator()
        observer = wc.stringToProxy(observer)

        if observer is None or observer in self.observers:
            return

        logging.info("{}: attach view, '{}'".format(self.__class__.__name__, observer))
        self.observers.append(observer)

    def notify(self, method_name, **kwargs):
        for observer in self.observers[:]:
            try:
                method = getattr(observer, method_name)
                method(**kwargs)
            except Exception as e:
                self.observers.remove(observer)
                logging.warning(
                    "Exception raised when reaching observer: {}\n"
                    "Removing observer '{}'".format(e, observer))
