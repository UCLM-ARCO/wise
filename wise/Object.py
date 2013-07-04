# -*- mode: python; coding: utf-8 -*-


class Observable:
    def __init__(self):
        self.observers = []

    def attach_view(self, observer, current):
        wc = current.adapter.getCommunicator()
        observer = wc.stringToProxy(observer)

        if observer is None:
            return

        if observer in self.observers:
            return

        print "{}: attach view, '{}'".format(self.__class__.__name__, observer)
        self.observers.append(observer)

    def notify(self, method_name, **kwargs):
        for observer in self.observers[:]:
            try:
                method = getattr(observer, method_name)
                method(**kwargs)
            except Exception:
                self.observers.remove(observer)
                raise

