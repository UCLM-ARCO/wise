
class Servant(object):
    def echo(self, oid, current):
        return "you said: <b>'{}'</b>".format(oid)

    def raise_exception(self, oid, current):
        raise Exception("This is a raised exception (<b>{}</b>)".format(oid))


def initialize(broker):
    adapter = broker.createObjectAdapter("adapter", "-w ws1")
    adapter.add(Servant(), "server")
