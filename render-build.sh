#!/bin/bash
set -e

export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer

if [[ ! -d $PUPPETEER_CACHE_DIR ]]; then
  echo "Copying Puppeteer cache from build cache..."
  mkdir -p $PUPPETEER_CACHE_DIR
  cp -R /opt/render/project/src/.cache/puppeteer/* $PUPPETEER_CACHE_DIR || true
fi

echo "Installing dependencies (Puppeteer will download Chromium if needed)..."
npm install

# Nếu bạn có lệnh build riêng (ví dụ: next build, vite build,...)
# npm run build

echo "Storing Puppeteer cache for next deploy..."
cp -R $PUPPETEER_CACHE_DIR /opt/render/project/src/.cache/puppeteer || true