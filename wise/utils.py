
import os
import socket

from .Communicator import TornadoCommunicator, GunicornCommunicator
from .WiseAdmin import WiseAdmin


__ic = None


def initialize(host="127.0.0.1", port=8080, properties=None, server="tornado"):
    assert __ic is None, "Only one communicator instance is supported"

    properties = properties or {}

    if server == "tornado":
        return _initialize_for_tornado(host, port, properties)
    if server == "gunicorn":
        return _initialize_for_gunicorn(properties)

    raise ValueError("Unknown backend server:", + server)


def _initialize_for_tornado(host, port, properties):
    global __ic

    host = host or socket.gethostbyname_ex(socket.gethostname())[0]
    __ic = TornadoCommunicator(host=host, port=port, properties=properties)
    __ic.is_ready.wait()

    admin_adapter = __ic.createObjectAdapter("WiseAdmin", "-w wise")
    servant = WiseAdmin(__ic)
    admin_adapter.add(servant, "WiseAdmin")

    return __ic


def _initialize_for_gunicorn(properties):
    global __ic

    __ic = GunicornCommunicator(properties=properties)

    return __ic


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
    def __init__(self, proxy):
        for name in proxy.wise_getMethodNames():
            setattr(self, name, add_placeholder(getattr(proxy, name)))
