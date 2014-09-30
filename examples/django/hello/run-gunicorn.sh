#!/bin/bash
# -*- mode: sh; coding: utf-8 -*-

PROJECT_DIR=$(/usr/share/arco/get-project-dir.sh)

export PROJECT_NAME="django_hello"
export PYTHONPATH=$PROJECT_DIR:$(pwd)

WORKER_CLASS=wise.guworkers.GeventWebSocketWorker

clear

# launch server
gunicorn \
    --debug \
    --reload \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --worker-class $WORKER_CLASS \
    django_hello.wsgi:application
