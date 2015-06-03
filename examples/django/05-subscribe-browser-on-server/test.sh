#!/bin/bash --
# -*- coding: utf-8; mode: shell-script; tab-width: 4 -*-

./server.sh &
sensible-browser "http://127.0.0.1:8000"
