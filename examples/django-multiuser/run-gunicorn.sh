#!/bin/bash
# -*- mode: sh; coding: utf-8 -*-

PROJECT_DIR=$(/usr/share/arco/get-project-dir.sh)
PROJECT_NAME="multiuser"

export DJANGO_SETTINGS_MODULE=$PROJECT_NAME.settings
export PYTHONPATH=$PYTHONPATH:$PROJECT_DIR:$(pwd)

WORKER_CLASS=wise.guworkers.GeventWebSocketWorker

clear

# launch server
gunicorn \
    --debug \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --worker-class $WORKER_CLASS \
    $PROJECT_NAME.wsgi:application
