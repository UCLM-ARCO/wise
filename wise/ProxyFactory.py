# -*- mode: python; coding: utf-8 -*-

from .ObjectPrx import ObjectPrx
from .Transceiver import TransceiverFactory

import logging


class ProxyFactory:
    @classmethod
    def create(cls, ic, string):
        fields = cls._get_proxy_fields(ic, string)

        # FIXME: make this lazy, get transceiver only when needed.
        #   That would allow the creation of proxies that does not exist (yet).

        transceiver = TransceiverFactory.get(fields['ws_name'])
        if not transceiver:
            logging.warning("Transceiver for endpoint '{}' not available"
                            .format(fields['ws_name']))
            return None

        return ObjectPrx(fields['identity'], fields['endpoint'], transceiver)

    @classmethod
    def _get_proxy_fields(cls, ic, string):
        # proxy should be like: "Object -w ws -h host -p port"
        fields = string.split()

        identity = fields[0]

        if not '-w' in fields:
            raise ValueError("Invalid proxy format: '{}'".format(string))
        websocket = fields[fields.index('-w') + 1]

        if '-h' in fields:
            host = fields[fields.index('-h') + 1]

        if '-p' in fields:
            port = fields[fields.index('-p') + 1]

        endpoint = "-w {}".format(websocket)
        if host:
            endpoint += " -h {}".format(host)
        if port:
            endpoint += " -p {}".format(port)

        adapter = ic.resolveAdapter(endpoint = endpoint)

        return {
            'identity': identity,
            'ws_name': websocket,
            'host': host,
            'port': port,
            'adapter': adapter,
            'endpoint': endpoint
        }
