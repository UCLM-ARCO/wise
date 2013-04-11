# -*- mode: python; coding: utf-8 -*-

import os
from threading import Thread, Event
from tornado import web, ioloop

from .ObjectAdapter import ObjectAdapter
from .Exceptions import AlreadyRegisteredException
from .StaticFSApplication import StaticFSApplication
from .ProxyFactory import ProxyFactory


# Tornado has not support to dynamically adding new handlers for
# existing hosts. This will do it.
class TornadoApplication(web.Application):
    def append_handlers(self, host_pattern, host_handlers):
        if not host_pattern.endswith("$"):
            host_pattern += "$"

        specs = None
        for handler in self.handlers:
            if handler[0].pattern == host_pattern:
                specs = handler[1]
                break

        if not specs:
            self.add_handlers(host_pattern, host_handlers)
            return

        for spec in host_handlers:
            if isinstance(spec, tuple):
                assert len(spec) in (2, 3)
                pattern = spec[0]
                handler = spec[1]

                if len(spec) == 3:
                    kwargs = spec[2]
                else:
                    kwargs = {}
                spec = web.URLSpec(pattern, handler, kwargs)

            # replace old spec with new one
            for old in specs[:]:
                if old._path == spec._path:
                    specs.remove(old)
                    break

            specs.append(spec)


class Communicator(Thread):
    def __init__(self, host, port):
        Thread.__init__(self)

        self.port = port
        self.host = host
        self.url = "http://{}:{}".format(self.host, self.port)

        self._adapters = {}

        self.is_ready = Event()
        self.daemon = True
        self.start()

    def run(self):

        # FIXME: use HTTPServer instead of Application.listen(). This
        # would allow you closing sockets on shutdown.
        # See: http://www.tornadoweb.org/en/stable/httpserver.html#tornado.httpserver.HTTPServer

        self._server = TornadoApplication()
        self._server.listen(self.port, self.host)
        self._ioloop = ioloop.IOLoop.instance()

        self._register_static_files_handler()

        self.is_ready.set()
        self._ioloop.start()

    def shutdown(self):
        self._ioloop.stop()
        del self._server

    def stringToProxy(self, stringfied_proxy):
        return ProxyFactory.create(self, stringfied_proxy)

    def createObjectAdapter(self, name, endpoint):
        if name in self._adapters:
            raise AlreadyRegisteredException()

        adapter = ObjectAdapter(self, name, endpoint)
        self._adapters[name] = adapter
        return adapter

    def registerApplication(self, application):
        self.registerHandlers(application.get_handler_spec())

    # handlers is a list of (url, class, params)
    def registerHandlers(self, handlers, host=".*$"):
        for spec in handlers:
            print "Handler for '{}' registered as '{}'".format(spec[0], spec[1])

        self._server.append_handlers(host, handlers)

    # return adapter name, find by its endpoint
    def resolveAdapter(self, endpoint):
        for name, adapter in self._adapters.items():
            if adapter.getEndpoint() == endpoint:
                return name

    # return adapter name, find by its endpoint
    def resolveEndpoint(self, adapter_name):
        adapter = self._adapters.get(adapter_name, None)
        if not adapter:
            return None
        return adapter.getEndpoint()

    def waitForShutdown(self):
        try:
            while True:
                self.join(1000)
                if not self.isAlive():
                    break
        except KeyboardInterrupt:
            pass

    def _register_static_files_handler(self):
        # register static files handler (to serve wise.js and others)
        pwd = os.path.dirname(__file__)
        static_files = StaticFSApplication(
            communicator=self,
            locator='/wise/',
            path=pwd)
        self.registerApplication(static_files)
