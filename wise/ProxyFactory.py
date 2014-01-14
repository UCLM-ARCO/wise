# -*- mode: python; coding: utf-8 -*-

import logging
from commodity.pattern import Bunch

from .ObjectPrx import ObjectPrx
from .Transceiver import TransceiverFactory


class ProxyFactory:
    @classmethod
    def create(cls, ic, string):
        assert isinstance(string, (str, unicode))
        fields = cls._get_proxy_fields(ic, string)

        # FIXME: make this lazy, get transceiver only when needed.
        #   That would allow the creation of proxies that does not exist (yet).

        transceiver = TransceiverFactory.get(fields['ws_name'])
        if not transceiver:
            logging.warning("Transceiver for endpoint '{}' not available"
                            .format(fields['ws_name']))
            return None

        return ObjectPrx(fields.identity, fields.endpoint,
                         fields.host, fields.port, transceiver)

    @classmethod
    def _get_proxy_fields(cls, ic, string):
        # proxy should be like: "Object -w <ws> -h <host> -p <port>"
        # FIXME: use re to parse proxies (or pyparsing)
        fields = string.split()

        identity = fields[0]

        if not '-w' in fields:
            raise ValueError("Invalid proxy format: '{}'".format(string))
        websocket = fields[fields.index('-w') + 1]

        host = ""
        if '-h' in fields:
            host = fields[fields.index('-h') + 1]

        port = ""
        if '-p' in fields:
            port = fields[fields.index('-p') + 1]

        endpoint = "-w {}".format(websocket)
        if host:
            endpoint += " -h {}".format(host)
        if port:
            endpoint += " -p {}".format(port)

        adapter = ic.resolveAdapter(endpoint = endpoint)

        return Bunch(
            identity = identity,
            ws_name = websocket,
            host = host,
            port = port,
            adapter = adapter,
            endpoint = endpoint
        )
