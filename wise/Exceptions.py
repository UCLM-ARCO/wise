# -*- mode: python; coding: utf-8 -*-


class BaseException:
    def __init__(self, message=""):
        self.message = message

    def __str__(self):
        return str(self.message)


class ProtocolException(BaseException):
    pass


class AlreadyRegisteredException(BaseException):
    pass
