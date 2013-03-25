# -*- mode: python; coding: utf-8 -*-

from tornado import websocket

from .Transceiver import TransceiverFactory


class ActiveHandler(websocket.WebSocketHandler):
    def initialize(self, adapter_name):
        self._endpoint = None

    def open(self):
        self._endpoint = self.request.uri.strip('/')
        TransceiverFactory.register_handler(self._endpoint, self)

    def on_close(self):
        if not self._endpoint is None:
            TransceiverFactory.unregister_handler(self._endpoint)


class WiseAdmin:
    def __init__(self, ic):
        self._ic = ic

    def create_socket(self, endpoint, current=None):
        handler = (endpoint, ActiveHandler, {})
        self._ic.registerHandlers([handler])
