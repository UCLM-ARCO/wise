# -*- mode: python; coding: utf-8 -*-

import traceback
import jsonpickle
from threading import Event, Lock
from tornado import websocket
from commodity.thread_ import SimpleThreadPool

from .WebApplication import WebApplication
from .Exceptions import ProtocolException, UnknownLocalException
from .Current import Current
from . import Logging as logging


class TransceiverApp(WebApplication):
    def __init__(self, communicator, url, adapter):
        WebApplication.__init__(self, communicator, url)
        self._adapter = adapter

    def get_handler_class(self):
        return MessageHandler

    def get_handler_params(self):
        return {'adapter': self._adapter}


class Transceiver:
    def __init__(self, handler):
        self._handler = handler
        self._handler.set_response_callback(self.on_response)
        self._request_id = 0
        self._request_id_lock = Lock()
        self._pending_responses = {}

    def send_request(self, request):
        with self._request_id_lock:
            request_id = self._request_id
            self._request_id += 1

        request['request_id'] = request_id
        request = jsonpickle.encode(request)

        barrier = Event()
        self._pending_responses[request_id] = [barrier, None]
        self.send(request)
        ok = barrier.wait(5)
        response = self._pending_responses.pop(request_id)[1]

        if not ok:
            raise RuntimeError("Remote object did not response in time!")

        if response.exception:
            raise UnknownLocalException(**response.exception)

        return response.result

    def on_response(self, response):
        self._pending_responses[response.request_id][1] = response
        barrier = self._pending_responses[response.request_id][0]
        barrier.set()

    def send(self, request):
        if self._handler is None:
            raise RuntimeError("Can not reach remote object!")

        try:
            self._handler.write_message(request)
        except Exception as e:
            self._handler = None
            raise RuntimeError("Error sending message to remote object: {}".format(e))


class TransceiverFactory:
    _handlers = {}
    _transceivers = {}

    @classmethod
    def register_handler(cls, wslocator, handler):
        logging.info("TransceiverFactory: register handler for '{}'".format(wslocator))
        cls._handlers[wslocator] = handler

    @classmethod
    def unregister_handler(cls, wslocator):
        logging.info("TransceiverFactory: un-register handler for '{}'".format(wslocator))
        cls._handlers.pop(wslocator, None)
        cls._transceivers.pop(wslocator, None)

    @classmethod
    def get(cls, wslocator):
        logging.info("TransceiverFactory: get for websocket '{}'".format(wslocator))

        transceiver = cls._transceivers.get(wslocator, None)
        if transceiver:
            return transceiver

        handler = cls._handlers.get(wslocator, None)
        if not handler:
            logging.error("TransceiverFactory: ERROR: no handler for websocket '{}'"
                          .format(wslocator))

            return None

        logging.info("TransceiverFactory: creating new for websocket '{}'"
                     .format(wslocator))
        transceiver = Transceiver(handler)
        cls._transceivers[wslocator] = transceiver
        return transceiver


class RequestMessage:
    def __init__(self, message):
        data = jsonpickle.decode(message)

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
        if not 'params' in data:
            return {}

        params = data['params']
        if not isinstance(params, dict):
            raise ValueError("Invalid params: '{}'".format(params))

        return params

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
        self._thread_pool = SimpleThreadPool(1)

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
        self._thread_pool.add(self.async_on_message, (message,))

    def async_on_message(self, message):
        try:
            request = RequestMessage(message)
            method = self._get_object_method(request)
            if not method:
                return

            current = Current(self, self._adapter)
            try:
                retval = method(current=current, **request.params)
            except TypeError as e:
                logging.error("Invalid Params: '{}'".format(request.params))
                raise

            if not isinstance(retval, dict):
                retval = {'result': retval}

            self._response(request.request_id, retval)

        except ProtocolException as e:
            logging.warning(str(e))
            self._notify_error(-1, e)

        except Exception as e:
            traceback.print_exc()
            print "-" * 50

            message = ("Error while calling method '{}.{}': '{}'".
                       format(request.identity, request.method, e))
            logging.warning(message)
            self._notify_error(request.request_id, e)

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

    def _notify_error(self, request_id, error):
        response = {
            'request_id': request_id,
            'error': error
        }
        self.write_message(jsonpickle.encode(response))

    def _response(self, request_id, result):
        response = {
            'request_id': request_id,
            'result': result
        }
        self.write_message(jsonpickle.encode(response))
