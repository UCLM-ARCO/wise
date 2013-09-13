# -*- mode: python; coding: utf-8 -*-

from . import Logging as logging


class Observable:
    def __init__(self):
        self.observers = []

    def attach(self, observer, current):
        ws = current.adapter.getCommunicator()
        observer = ws.stringToProxy(observer)

        if observer is None or observer in self.observers:
            return

        logging.info("{}: attach view, '{}'".format(self.__class__.__name__, observer))
        self.observers.append(observer)

    def detach(self, observer, current):
        ws = current.adapter.getCommunicator()
        observer = ws.stringToProxy(observer)

        try:
            self.observers.remove(observer)
            logging.info("{}: detach view, '{}'".format(self.__class__.__name__, observer))
        except ValueError:
            pass

    def notify(self, method_name="notify", **kwargs):
        for observer in self.observers[:]:
            try:
                method = getattr(observer, method_name)
                method(**kwargs)
            except Exception as e:
                self.observers.remove(observer)
                logging.warning(
                    "Exception raised when reaching observer: {}\n"
                    "Removing observer '{}'".format(e, observer))


class PersistentObservable(Observable):
    def __init__(self, db, namespace):
        # db es un objeto que encapsula el acceso a la persistencia
        # namespace es un dominio a usar cada vez que se accede a db
        # db.get_observers(namespace)
        # db.add_observer(namespace, observer)
        pass

