# -*- mode: python; coding: utf-8 -*-

import json
from tornado import websocket
import cPickle as pickle
import os
import time

from .Transceiver import TransceiverFactory
from .Exceptions import ProtocolException
from . import Logging as logging


class ResponseMessage:
    def __init__(self, message):
        data = json.loads(message)

        try:
            self.request_id = data['request_id']
            self.result = data.get('result', None)
        except KeyError as e:
            raise ProtocolException(
                "Invalid message format: missing {}, received: '{}'"
                .format(e, message))


class ActiveHandler(websocket.WebSocketHandler):
    def initialize(self):
        self._endpoint = None

    def open(self):
        self._endpoint = self.request.uri.strip('/')
        TransceiverFactory.register_handler(self._endpoint, self)

        logging.info("ActiveHandler: new handler for '{}' endpoint".format(self._endpoint))

    def on_close(self):
        if not self._endpoint is None:
            TransceiverFactory.unregister_handler(self._endpoint)

    def set_response_callback(self, callback):
        self._response_callback = callback

    def on_message(self, message):
        response = ResponseMessage(message)
        self._response_callback(response)


class WiseAdmin:
    def __init__(self, ic):
        self._ic = ic
        self._endpoints = []
        self._already_registered = []

        self._db_filename = self._ic.getProperty("WiseSaver.dbfile")
        if self._db_filename is None:
            self._db_filename = "WiseSaver.db"

        self._restore_from_db()

    def create_socket(self, endpoint, current=None):
        self._do_create_socket(endpoint)
        self._save_on_db(endpoint)

    def _restore_from_db(self):
        if not os.path.exists(self._db_filename):
            return

        with file(self._db_filename) as src:
            endpoints = pickle.load(src)
            for ts, e in endpoints:
                self._do_create_socket(e)

    def _save_on_db(self, endpoint):
        now = int(time.time() / 60)  # stored in minutes
        self._endpoints.append((now, endpoint))

        # remove oldest endpoints
        endpoints = []
        for ts, endp in self._endpoints:
            if (now - ts) > 14400:   # 10 days (24*60*10)
                continue
            endpoints.append((ts, endp))

        with file(self._db_filename, "w") as dst:
            pickle.dump(endpoints, dst)

    def _do_create_socket(self, endpoint):
        locator = "^/{}$".format(endpoint['ws_name'])
        if locator in self._already_registered:
            logging.info("WiseAdmin: already registered handler for '{}', "
                         "nothing done".format(locator))
            return

        self._already_registered.append(locator)
        logging.info("WiseAdmin: create socket for '-w {} -h {} -p {}' endpoint".format(
                     endpoint['ws_name'], endpoint['host'], endpoint['port']))

        handler = ("^/{}$".format(endpoint['ws_name']), ActiveHandler, {})
        self._ic.registerHandlers([handler])
        logging.info("WiseAdmin: handler registered, {}".format(handler))
