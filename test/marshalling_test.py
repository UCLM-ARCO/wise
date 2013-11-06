# -*- mode: python; coding: utf-8 -*-

import sys
import os
from unittest import TestCase
from sulfurium import Chrome
from doublex import Spy, called
from hamcrest import anything
from commodity.testing import wait_that

import wise
sys.path.insert(0, os.path.dirname(__file__))
from server import Server


_browser = Chrome(left_open=False)


class TestMarshalling_FromServerToBrowser(TestCase):
    url = "http://127.0.0.1:8080/static/marshalling_test.html"

    @classmethod
    def setUpClass(cls):
        cls.server = Server()
        cls.browser = _browser
        cls.ws = wise.initialize(port=8081)

    @classmethod
    def tearDownClass(cls):
        cls.server.stop()
        cls.ws.shutdown()

    def setUp(self):
        self.browser.open(self.url)
        self.browser.js('wise.no_reconnect = true;')
        self.remote = self.ws.stringToProxy("Marshall -w browser")

    def test_send_positive_integer_32bits(self):
        self.check_number(2 ** 32)

    def test_send_negative_integer_32bits(self):
        self.check_number(-2 ** 32)

    def test_send_positive_float(self):
        self.check_number(54450.254468)

    def test_send_negative_float(self):
        self.check_number(-54450.254468)

    def test_send_string(self):
        string = r"A string with \0 some strange \n chars \t \0x00"
        self.remote.set_string(string=string.decode("string-escape"))
        self.assertTrue(self.browser.js("return _string == '{}'".format(string)))

    def test_send_boolean(self):
        state = True
        self.remote.set_boolean(state=state)
        self.assertTrue(self.browser.js("return _boolean == {}".format(str(state).lower())))

    def test_send_None(self):
        self.remote.set_none(none=None)
        self.assertTrue(self.browser.js("return _none == null"))

    def test_send_array(self):
        array = [1, 2.3, "hi", ['a'], {'key': 'value'}, True, None]
        self.remote.set_array(array=array)

        self.browser.js("other = {}".format(str(array).lower().replace("none", "null")))
        equal = self.browser.js(
            "return "
            "other[0] == _array[0] &&"
            "other[1] == _array[1] &&"
            "other[2] == _array[2] &&"
            "other[3].length == _array[3].length &&"
            "other[3][0] == _array[3][0] &&"
            "other[4].key == _array[4].key &&"
            "other[5] == _array[5] &&"
            "other[6] == _array[6]")
        self.assertTrue(equal)

    def test_send_dictionary(self):
        dictionary = {'key1': 124, 'key2': 'value', 'key3': None, 4: 4}
        self.remote.set_dictionary(dictionary=dictionary)

        self.browser.js("other = {}".format(str(dictionary).replace("None", "null")))
        equal = self.browser.js(
            "return "
            "other.key1 == _dictionary.key1 &&"
            "other.key2 == _dictionary.key2 &&"
            "other.key3 == _dictionary.key3 &&"
            "other['4'] == _dictionary['4']")
        self.assertTrue(equal)

    def test_send_object(self):
        class Object(object):
            def __init__(self):
                self.param1 = 1
                self._param2 = 2

        obj = Object()
        self.remote.set_object(obj=obj)

        equal = self.browser.js(
            "return "
            "_object.param1 == {} &&"
            "_object._param2 == {}".format(obj.param1, obj._param2))
        self.assertTrue(equal)

    def check_number(self, number):
        self.remote.set_number(number=number)
        self.assertTrue(self.browser.js("return _number == {}".format(number)))


class TestMarshalling_FromBrowserToServer(TestCase):
    url = "http://127.0.0.1:8080/static/marshalling_test.html"

    @classmethod
    def setUpClass(cls):
        with Spy() as servant:
            servant.send_number()
            servant.send_string()
            servant.send_boolean()
            servant.send_none()
            servant.send_array()
            servant.send_object()

        cls.server = Server(servant)
        cls.browser = _browser
        cls.servant = servant

    @classmethod
    def tearDownClass(cls):
        cls.server.stop()

    def setUp(self):
        self.browser.open(self.url)
        self.browser.js('wise.no_reconnect = true;')

    def test_send_positive_integer_32bits(self):
        self.check_number(2 ** 32)

    def test_send_negative_integer_32bits(self):
        self.check_number(-2 ** 32)

    def test_send_positive_float(self):
        self.check_number(54450.254468)

    def test_send_negative_float(self):
        self.check_number(-54450.254468)

    def test_send_string(self):
        string = r"A string with \0 some strange \n chars \t \0x00"
        params = "{params: { string: '" + string + "' }}"
        self.browser.js("server.send_string({});".format(params))

        string = string.decode("string-escape")
        wait_that(self.servant.send_string,
                  called().with_args(string=string, current=anything()))

    def test_send_boolean(self):
        value = True
        params = "{params: { value: " + str(value).lower() + " }}"
        self.browser.js("server.send_boolean({});".format(params))

        wait_that(self.servant.send_boolean,
                  called().with_args(value=value, current=anything()))

    def test_send_None(self):
        params = "{params: { value: null }}"
        self.browser.js("server.send_none({});".format(params))

        wait_that(self.servant.send_none,
                  called().with_args(value=None, current=anything()))

    def test_send_array(self):
        array = [1, 2.3, "hello", True, [1, 2], {'key': 'value'}, None]
        js_array = str(array).lower().replace("none", "null")
        params = "{params: { array: " + js_array + " }}"
        self.browser.js("server.send_array({});".format(params))

        wait_that(self.servant.send_array,
                  called().with_args(array=array, current=anything()))

    def test_send_object(self):
        obj = {'key1': 1, 'key2': "value2", 'key3': None,
               'key4': True, 'key5': [1, 2], 'key6': {'key': 'value'}}
        js_obj = str(obj).lower().replace("none", "null")
        params = "{params: { obj: " + js_obj + " }}"
        self.browser.js("server.send_object({});".format(params))

        wait_that(self.servant.send_object,
                  called().with_args(obj=obj, current=anything()))

    def check_number(self, number):
        params = "{params: { number: " + str(number) + " }}"
        self.browser.js("server.send_number({});".format(params))

        wait_that(self.servant.send_number,
                  called().with_args(number=number, current=anything()))
