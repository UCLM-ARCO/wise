from django.conf.urls import patterns, url

urlpatterns = patterns(
    '',

    url(r'^$', 'main.views.index'),
)
