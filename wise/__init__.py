# -*- mode: python; coding: utf-8 -*-

from .Communicator import Communicator
from .WiseAdmin import WiseAdmin

# Imports not used here, made available for the rest of users
from .WebApplication import WebApplication
from .StaticFSApplication import StaticFSApplication

__ic = None


def initialize(host="127.0.0.1", port=8080):
    global __ic

    if not __ic is None:
        return __ic

    __ic = Communicator(host=host, port=port)
    __ic.is_ready.wait()

    admin_adapter = __ic.createObjectAdapter("WiseAdmin", "wise")
    servant = WiseAdmin(__ic)
    admin_adapter.add(servant, "WiseAdmin")

    return __ic
