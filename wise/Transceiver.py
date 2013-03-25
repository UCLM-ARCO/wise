# -*- mode: python; coding: utf-8 -*-

import traceback
import json
import logging

from tornado import websocket

from .WebApplication import WebApplication
from .Exceptions import ProtocolException
from .Current import Current


class TransceiverApp(WebApplication):
    def __init__(self, communicator, url, adapter):
        WebApplication.__init__(self, communicator, url)
        self._adapter = adapter

    def get_handler_class(self):
        return MessageHandler

    def get_handler_params(self):
        return {'adapter': self._adapter}


class Transceiver:
    _handler = None
    _request_id = 0

    def __init__(self, handler):
        self._handler = handler

    def send_request(self, request):
        request['request_id'] = self._request_id
        request = json.dumps(request)
        self.send(request)

    def send(self, request):
        self._handler.write_message(request)


class TransceiverFactory:
    _handlers = {}
    _transceivers = {}

    @classmethod
    def register_handler(cls, endpoint, handler):
        cls._handlers[endpoint] = handler

    @classmethod
    def unregister_handler(cls, endpoint):
        cls._handlers.pop(endpoint, None)

    @classmethod
    def get(cls, endpoint):
        transceiver = cls._transceivers.get(endpoint, None)
        if transceiver:
            return transceiver

        handler = cls._handlers.get(endpoint, None)
        if not handler:
            return None

        transceiver = Transceiver(handler)
        cls._transceivers[endpoint] = transceiver
        return transceiver


class RequestMessage:
    def __init__(self, message):
        data = json.loads(message)

        try:
            self.request_id = data['request_id']
            self.identity = data['identity']
            self.method = data['method']
            self.params = self._convert_params(data)
        except KeyError as e:
            raise ProtocolException(
                "Invalid message format: missing {}, received: '{}'"
                .format(e, message))

    def _convert_params(self, data):
        retval = {}
        if not 'params' in data:
            return retval

        params = data['params']
        if not isinstance(params, dict):
            raise ValueError("Invalid params: '{}'".format(params))

        for name, value in params.items():
            if value is None:
                continue

            retval[name] = value
        return retval

    def __str__(self):
        retval = (
            "request_id: {}\n"
            "identity: {}\n"
            "method: {}\n"
            "params: {{\n"
            .format(self.request_id, self.identity, self.method))
        for name, value in self.params.items():
            retval += "  {}: {}\n".format(name, value)
        retval += "}\n"
        return retval


class MessageHandler(websocket.WebSocketHandler):
    def initialize(self, adapter):
        self._adapter = adapter
        self._is_closed = False

    def open(self):
        endpoint = self._adapter.getEndpoint()
        TransceiverFactory.register_handler(endpoint, self)

    def on_close(self):
        endpoint = self._adapter.getEndpoint()
        TransceiverFactory.unregister_handler(endpoint)
        self._is_closed = True

    @property
    def is_closed(self):
        return self._is_closed

    def on_message(self, message):
        try:
            request = RequestMessage(message)
            method = self._get_object_method(request)
            if not method:
                return

            current = Current(self, self._adapter)
            retval = method(current=current, **request.params)
            print "RETVAL:", retval
            self._response(request.request_id, retval)

        except ProtocolException as e:
            logging.warning(str(e))
            self._notify_error(-1, str(e))

        except Exception as e:
            traceback.print_exc()
            print "-" * 50

            message = ("Error while calling method '{}.{}': '{}'".
                       format(request.identity, request.method, e))
            logging.warning(message)
            self._notify_error(request.request_id, message)

    def _get_object_method(self, request):
        obj = self._find_object(request)
        if not obj:
            return

        method = getattr(obj, request.method, None)
        if not method:
            self._notify_error(
                request.request_id, "Unknown method, name: '{}'"
                .format(request.method))
        return method

    def _find_object(self, request):
        obj = self._adapter.find(request.identity)
        if not obj:
            self._notify_error(
                request.request_id, "Unknown Object, ID: '{}'"
                .format(request.identity))
        return obj

    def _notify_error(self, request_id, message):
        response = {
            'request_id': request_id,
            'error': message
        }
        self.write_message(json.dumps(response))

    def _response(self, request_id, result):
        response = {
            'request_id': request_id,
            'result': result
        }
        self.write_message(json.dumps(response))
