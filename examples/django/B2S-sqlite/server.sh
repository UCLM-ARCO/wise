#!/bin/bash
# -*- mode: sh; coding: utf-8 -*-

PROJECT=django_hello

# ------------------------------------------------------------

PROJECT_DIR=$(/usr/share/arco/get-project-dir.sh)
WORKER_CLASS=wise.guworkers.GeventWebSocketWorker

export PYTHONPATH=$PROJECT_DIR:$(pwd)
export DJANGO_SETTINGS_MODULE=$PROJECT.settings

gunicorn \
    --debug \
    --reload \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --worker-class $WORKER_CLASS \
    $PROJECT.wsgi:application
