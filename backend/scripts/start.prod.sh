#!/bin/sh
set -eu

npm run migration:run:prod
exec npm run start:prod
