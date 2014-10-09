#!/bin/bash
# -*- mode: sh; coding: utf-8 -*-

INSTANCES=4
URL="http://127.0.0.1:8000/"
CMD=$(which google-chrome || which chromium-browser || which chromium)

WW=640
WH=480

if [ -z "$CMD" ]; then
    echo "This test needs google chrome or chromium. Please, install it."
    exit -1
fi

launch_browsers() {
    for i in $(seq 0 $(($INSTANCES-1))); do
	COL=$(($i%2))
	ROW=$((($i/2)%2))
	X=$((($COL*$WW)+($COL*10)))
	Y=$((($ROW*$WH)+($ROW*50)))

	DATA_DIR=/tmp/multiuse-test-$i
	OPTIONS="--user-data-dir=$DATA_DIR
             --disable-translate
             --disable-session-crashed-bubble
             --no-first-run
             --window-size=$WW,$WH
             --window-position=$X,$Y
             --app=$URL"

	rm -fr $DATA_DIR
	mkdir -p $DATA_DIR

	$CMD $OPTIONS &
	BROWSER_PIDS="$BROWSER_PIDS $!"
    done
}

launch_server() {
    ./run-gunicorn.sh &
    sleep 1
}

launch_server
launch_browsers
wait $PIDS
