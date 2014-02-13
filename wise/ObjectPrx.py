# -*- mode: python; coding: utf-8 -*-

from commodity.type_ import checked_type

from endpoint import Endpoint


def any_to_json(value):
    if isinstance(value, str):
        return unicode(value)

    if isinstance(value, (unicode, int, bool, float, long)):
        return value

    if value is None:
        return value

    if isinstance(value, (list, tuple)):
        return [any_to_json(x) for x in value]

    if isinstance(value, dict):
        fields = {}
        for k, v in value.items():
            fields[k] = any_to_json(v)
        return fields

    if isinstance(value, ObjectPrx):
        return value._to_json()

    # NOTE: let this be the last resort (structures)
    attrs = {}
    for name in dir(value):
        if name.startswith("_"):
            continue

        attr = getattr(value, name)
        if callable(attr):
            continue

        attrs[name] = any_to_json(attr)

    return attrs


class MethodHandler(object):
    def __init__(self, identity, transceiver, method_name):
        self._identity = identity
        self._transceiver = transceiver
        self._method_name = method_name

    def __call__(self, *args):
        params = [any_to_json(value) for value in args]
        print "MethodHandler:", params
        return self._transceiver.send_request(
            {'identity': self._identity,
             'method': self._method_name,
             'params': params})


class ObjectPrx(object):
    def __init__(self, identity, endpoint, transceiver):
        self.identity = identity
        self.endpoint = checked_type(Endpoint, endpoint)
        self._transceiver = transceiver

    def wise_getIdentity(self):
        return self.identity

    def _to_json(self):
        return dict(wise_typecode="Proxy", repr=repr(self))

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)

        return MethodHandler(self.identity, self._transceiver, name)

    def __nonzero__(self):
        return self.identity is not None and self._transceiver is not None

    def __eq__(self, other):
        return (self.identity, self.endpoint) == (other.identity, other.endpoint)

    def __repr__(self):
        return "{} {}".format(self.identity, self.endpoint)

    def __str__(self):
        return repr(self)
