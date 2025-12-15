#!/bin/bash
set -e

export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer

mkdir -p $PUPPETEER_CACHE_DIR

# Install Chrome latest vào cache persist
npx @puppeteer/browsers install chrome@latest --path $PUPPETEER_CACHE_DIR

npm install

# Nếu có build khác (NestJS build...)
# npm run build