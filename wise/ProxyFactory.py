# -*- mode: python; coding: utf-8 -*-

from .ObjectPrx import ObjectPrx
from .Transceiver import TransceiverFactory

import logging


class ProxyFactory:
    @classmethod
    def create(cls, ic, string):
        fields = cls._get_proxy_fields(ic, string)

        # FIXME: make this lazy, get transceiver only when needed.
        #        This allows creation of proxies that does not exist (yet).

        transceiver = TransceiverFactory.get(fields['endpoint'])
        if not transceiver:
            logging.warning("Transceiver for endpoint '{}' not available"
                            .format(fields['endpoint']))
            return None

        return ObjectPrx(fields['identity'], transceiver)

    @classmethod
    def _get_proxy_fields(cls, ic, string):
        # proxy should be like: "Object -e ws"
        assert '-e' in string, "Invalid proxy format: '{}'".format(string)

        fields = string.split("-e")
        identity = fields[0].strip()
        endpoint = fields[1].strip()
        adapter = ic.resolveAdapter(endpoint = endpoint)

        return {
            'identity': identity,
            'endpoint': endpoint,
            'adapter': adapter,
        }
