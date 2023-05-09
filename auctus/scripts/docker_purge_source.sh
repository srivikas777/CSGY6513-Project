#!/bin/sh
set -eu
cd "$(dirname "$(dirname "$0")")"
PROJ="$(basename "$(pwd)")"
docker run -ti --rm --network ${PROJ}_default -v $PWD/scripts:/scripts -v $PWD/volumes/cache:/cache -e ELASTICSEARCH_HOSTS=elasticsearch:9200 -e ELASTICSEARCH_PREFIX=${ELASTICSEARCH_PREFIX} -e LAZO_SERVER_HOST=lazo -e LAZO_SERVER_PORT=50051 auctus python /scripts/purge_source.py "$1"
