# -*- mode: python; coding: utf-8 -*-

from django.conf.urls import patterns, url
from views import index, on_login, on_logout


urlpatterns = patterns(
    '',

    url(r'^$', index),
    url(r'^login', on_login),
    url(r'^logout', on_logout),
)
