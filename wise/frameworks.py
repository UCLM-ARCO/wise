# -*- mode: python; coding: utf-8 -*-

from . import Logging as logging


class EmptyClass(object):
    pass


class tornado(object):
    pass


try:
    from tornado.websocket import WebSocketHandler
    tornado.WebSocketHandler = WebSocketHandler

    from tornado.web import StaticFileHandler, Application
    tornado.StaticFileHandler = StaticFileHandler
    tornado.WebApplication = Application

except ImportError:
    logging.info("Tornado: framework not available")
    tornado.WebSocketHandler = EmptyClass
    tornado.StaticFileHandler = EmptyClass
    tornado.WebApplication = EmptyClass
