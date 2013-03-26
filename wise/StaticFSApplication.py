# -*- mode: python; coding: utf-8 -*-

from tornado import web

from .WebApplication import WebApplication
from .Exceptions import AlreadyRegisteredException


class StaticFSApplication(WebApplication):
    _locators = []

    def __init__(self, communicator, locator, path, index=""):
        if locator in self._locators:
            raise AlreadyRegisteredException(
                "Already registered locator: '{}'".format(locator))

        self._locator = locator
        self._locators.append(locator)

        self._path = path
        self._index = index
        WebApplication.__init__(self, communicator=communicator, url=path)

        print "Serving static content from: {}".format(self._path)

    def get_handler_url(self):
        return r"{}(.*)".format(self._locator)

    def get_formatted_url(self):
        return self._locator + self._index

    def get_handler_class(self):
        return web.StaticFileHandler

    def get_handler_params(self):
        return {'path': self._path}
