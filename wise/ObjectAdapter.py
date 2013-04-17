# -*- mode: python; coding: utf-8 -*-

import uuid

from .Transceiver import TransceiverApp
from .Exceptions import AlreadyRegisteredException


class WiseServant(object):
    def __init__(self, servant):
        self._servant = servant

    def __getattr__(self, name):
        return getattr(self._servant, name)

    def wise_getMethodNames(self, current=None):
        return [x for x in dir(self._servant) if not x.startswith("_") and
                callable(getattr(self._servant, x))]


class ObjectAdapter:
    def __init__(self, communicator, name, endpoint):
        self._communicator = communicator
        self._name = name
        self._endpoint = endpoint

        self._asm = {}

        # register transceiver (to handle JSON requests)
        transceiver = TransceiverApp(
            communicator=self._communicator,
            url="^/{}$".format(endpoint),
            adapter=self)
        self._communicator.registerApplication(transceiver)

    def getCommunicator(self):
        return self._communicator

    def getName(self):
        return self._name

    def getEndpoint(self):
        return self._endpoint

    def add(self, servant, identity):
        if not self._asm.get(identity) is None:
            raise AlreadyRegisteredException("Object: " + identity)
        self._asm[identity] = WiseServant(servant)

        return "{} -w {} -h {} -p {}".format(
            identity, self._endpoint,
            self._communicator.host, self._communicator.port)

    def addWithUUID(self, servant):
        identity = str(uuid.uuid1())
        return self.add(servant, identity)

    def find(self, identity):
        return self._asm.get(identity)

    def __repr__(self):
        return ("<wise.ObjectAdapter, name: {}, id: {}>"
                .format(self._name, id(self)))
