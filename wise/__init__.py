# -*- mode: python; coding: utf-8 -*-

import os
import inspect
import socket

from .Communicator import Communicator
from .WiseAdmin import WiseAdmin
import Logging as logger

# Imports not used here, made available for the wise users
from .WebApplication import WebApplication
from .StaticFSApplication import StaticFSApplication
from .Object import Observable


def initialize(host="127.0.0.1", port=8080, properties=None):
    properties = properties or {}

    if properties.get("TornadoApp.debug", False):
        logger.warning("Wise: Debug Mode enabled, remove on production!!")

    host = host or socket.gethostbyname_ex(socket.gethostname())[0]
    ic = Communicator(host=host, port=port, properties=properties)
    ic.is_ready.wait()

    admin_adapter = ic.createObjectAdapter("WiseAdmin", "wise")
    servant = WiseAdmin(ic)
    admin_adapter.add(servant, "WiseAdmin")

    return ic


def dirname(path):
    return os.path.abspath(os.path.dirname(path))


class Application(object):
    def __init__(self):
        self.broker = initialize()

    def main(self, argv=None):
        self.run(argv or [])


def add_placeholder(method):
    def deco(*args):
        return method(*args[:-1])
    return deco


class proxy_as_servant(object):
    def __init__(self, instance):
        for name in instance.wise_getMethodNames():
            setattr(self, name, add_placeholder(getattr(instance, name)))
