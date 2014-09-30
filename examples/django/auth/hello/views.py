# -*- mode: python; coding: utf-8 -*-

from django.shortcuts import render
from django.contrib.auth import authenticate, login, logout
from django.core.exceptions import PermissionDenied


def index(request):
    return render(request, "index.html")


def on_login(request):
    username = request.GET['username']
    password = request.GET['password']

    user = authenticate(username=username, password=password)
    if user is not None and user.is_active:
        login(request, user)
        return index(request)

    raise PermissionDenied()


def on_logout(request):
    logout(request)
    return index(request)
