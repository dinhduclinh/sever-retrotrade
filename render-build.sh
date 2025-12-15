#!/bin/bash
set -e

export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer

mkdir -p $PUPPETEER_CACHE_DIR

# Copy cache nếu có từ deploy trước, hoặc store cho lần sau
if [[ ! -d $PUPPETEER_CACHE_DIR/chrome ]]; then
  echo "...Copying Puppeteer Cache from actual storage"
  mkdir -p $PUPPETEER_CACHE_DIR
  cp -R /opt/render/project/src/.cache/puppeteer/chrome/* $PUPPETEER_CACHE_DIR/ || true
else
  echo "...Storing Puppeteer Cache for next deploy"
  cp -R $PUPPETEER_CACHE_DIR/chrome/* /opt/render/project/src/.cache/puppeteer/chrome/ || true
fi

npm install

# Nếu có lệnh build khác thì thêm ở đây
# npm run build