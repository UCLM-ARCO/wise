# -*- mode: python; coding: utf-8 -*-

from django.conf.urls import patterns, include, url
from django.views.generic.base import RedirectView
from django.contrib.staticfiles.urls import staticfiles_urlpatterns


urlpatterns = patterns(
    '',

    url(r'^$', RedirectView.as_view(url="/auth")),
    url(r'^auth/', include('django_auth.urls')),
)

# just for serving static files
urlpatterns += staticfiles_urlpatterns()
