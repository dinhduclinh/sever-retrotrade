#!/bin/bash
set -e

export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer

mkdir -p $PUPPETEER_CACHE_DIR

# Install Chrome mới nhất (không phụ thuộc version puppeteer yêu cầu)
npx @puppeteer/browsers install chrome@latest

# Install dependencies
npm install

# Nếu có build khác
# npm run build