# -*- mode: python; coding: utf-8 -*-

import logging
logging.basicConfig(level=logging.DEBUG)


def _colourize(msg, color="01;00"):
    head = ""
    body = ""

    if ":" in msg:
        fields = msg.split(":")
        head, body = fields[0], ":".join(fields[1:])

    return "\033[{}m{}:\033[00m{}".format(color, head, body)


def info(msg):
    msg = _colourize(msg, "01;01")
    logging.info(msg)


def warning(msg):
    msg = _colourize(msg, "01;33")
    logging.warning(msg)


def error(msg):
    msg = _colourize(msg, "01;31")
    logging.error(msg)
