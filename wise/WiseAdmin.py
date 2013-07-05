# -*- mode: python; coding: utf-8 -*-

import json
from tornado import websocket

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
        self._already_registered = []

    def create_socket(self, endpoint, current=None):
        locator = "^/{}$".format(endpoint['ws_name'])
        if locator in self._already_registered:
            logging.info(("WiseAdmin: already registered handler for '{}', "
                          "nothing done".format(locator)))
            return

        self._already_registered.append(locator)

        logging.info("WiseAdmin: create socket for '-w {} -h {} -p {}' endpoint".format(
                     endpoint['ws_name'], endpoint['host'], endpoint['port']))

        handler = ("^/{}$".format(endpoint['ws_name']), ActiveHandler, {})
        self._ic.registerHandlers([handler])
        logging.info("WiseAdmin: handler registered, {}".format(handler))
