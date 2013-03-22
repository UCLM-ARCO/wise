# -*- mode: python; coding: utf-8 -*-

from .Communicator import Communicator
from .RiceAdmin import RiceAdmin

# Imports not used here, made available for the rest of users
from .WebApplication import WebApplication
from .StaticFSApplication import StaticFSApplication


def initialize(host="127.0.0.1", port=8080):
    ic = Communicator(host=host, port=port)
    ic.is_ready.wait()

    admin_adapter = ic.createObjectAdapter("RiceAdmin", "rice")
    servant = RiceAdmin(ic)
    admin_adapter.add(servant, "RiceAdmin")

    return ic
