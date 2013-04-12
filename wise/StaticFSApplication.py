# -*- mode: python; coding: utf-8 -*-

import logging
from tornado import web

from .WebApplication import WebApplication


class StaticFSApplication(WebApplication):
    def __init__(self, communicator, locator, path, index=""):
        self._locator = locator
        self._path = path
        self._index = index

        WebApplication.__init__(self, communicator=communicator, url=path)
        logging.debug("Serving static content from: {}".format(self._path))

    def get_handler_url(self):
        return r"{}(.*)".format(self._locator)

    def get_formatted_url(self):
        return self._locator + self._index

    def get_handler_class(self):
        return web.StaticFileHandler

    def get_handler_params(self):
        return {'path': self._path}
