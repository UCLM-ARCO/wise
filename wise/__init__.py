# -*- mode: python; coding: utf-8 -*-
import os

from .Communicator import Communicator
from .WiseAdmin import WiseAdmin

# Imports not used here, made available for the rest of users
from .WebApplication import WebApplication
from .StaticFSApplication import StaticFSApplication
from .Object import Observable


def initialize(host="127.0.0.1", port=8080, properties={}):
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
