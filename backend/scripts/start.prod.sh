#!/bin/sh
set -eu

: "${APP_ENV:=production}"
: "${NODE_ENV:=production}"

export APP_ENV
export NODE_ENV

npm run migration:run:prod
exec npm run start:prod
