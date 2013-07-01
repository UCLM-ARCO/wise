# -*- mode: python; coding: utf-8 -*-


class MethodHandler:
    def __init__(self, identity, transceiver, method_name):
        self._identity = identity
        self._transceiver = transceiver
        self._method_name = method_name

    def __call__(self, **args):
        assert isinstance(args, dict)

        return self._transceiver.send_request(
            {'identity': self._identity,
             'method': self._method_name,
             'params': args})


class ObjectPrx:
    def __init__(self, identity, transceiver):
        self._identity = identity
        self._transceiver = transceiver

    def __getattr__(self, name):
        return MethodHandler(self._identity, self._transceiver, name)

    def __nonzero__(self):
        return self._identity != None and self._transceiver != None
