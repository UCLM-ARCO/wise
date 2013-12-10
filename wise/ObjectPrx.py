# -*- mode: python; coding: utf-8 -*-


class MethodHandler:
    def __init__(self, identity, transceiver, method_name):
        self._identity = identity
        self._transceiver = transceiver
        self._method_name = method_name

    def __call__(self, *args):
        params = [
            self._convert_to_json_compatible(value)
            for value in args]

        return self._transceiver.send_request(
            {'identity': self._identity,
             'method': self._method_name,
             'params': params})

    def _convert_to_json_compatible(self, value):
        if isinstance(value, str):
            return unicode(value)

        if isinstance(value, (unicode, int, bool, float, long)):
            return value

        if value is None:
            return value

        if isinstance(value, (list, tuple)):
            return [self._convert_to_json_compatible(x) for x in value]

        if isinstance(value, dict):
            fields = {}
            for k, v in value.items():
                fields[k] = self._convert_to_json_compatible(v)
            return fields

        # NOTE: let this be the final step
        attrs = {}
        for name in dir(value):
            if name.startswith("__"):
                continue

            attr = getattr(value, name)
            if callable(attr):
                continue

            attrs[name] = self._convert_to_json_compatible(attr)

        return attrs


class ObjectPrx:
    def __init__(self, identity, endpoint, transceiver):
        self.identity = identity
        self.endpoint = endpoint
        self._transceiver = transceiver

    def wise_getIdentity(self):
        return self.identity

    def __getattr__(self, name):
        if name.startswith("__"):
            raise AttributeError(name)

        return MethodHandler(self.identity, self._transceiver, name)

    def __nonzero__(self):
        return self.identity is not None and self._transceiver is not None

    def __eq__(self, other):
        return (self.identity == other.identity and
                self.endpoint == other.endpoint)

    def __str__(self):
        return "{} {}".format(self.identity, self.endpoint)
