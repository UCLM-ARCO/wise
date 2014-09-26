#!/bin/bash
# -*- mode: sh; coding: utf-8 -*-

PROJECT_DIR=$(/usr/share/arco/get-project-dir.sh)
export PYTHONPATH=$PROJECT_DIR

clear

# sync db
if ! [ -f db.sqlite3 ]; then
    python manage.py syncdb --noinput
fi

# launch server
gunicorn \
    --debug \
    --reload \
    --access-logfile - \
    --error-logfile - \
    --log-level info \
    --worker-class "geventwebsocket.gunicorn.workers.GeventWebSocketWorker" \
    django_hello.wsgi:application
