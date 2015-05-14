# -*- mode: python; coding: utf-8 -*-

from django.db import models, connections

for conn in connections.all():
    if conn.vendor == 'sqlite':
        conn.allow_thread_sharing = True


class Person(models.Model):
    name = models.CharField(max_length=200)
    age = models.IntegerField()
