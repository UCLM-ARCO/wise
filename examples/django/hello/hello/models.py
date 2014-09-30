# -*- mode: python; coding: utf-8 -*-

from mongoengine import Document, StringField, IntField


class Person(Document):
    name = StringField()
    age = IntField()


# NOTE: there is no easy way to add fixtures
Person.objects.delete()
Person(name="Bart", age=10).save()
