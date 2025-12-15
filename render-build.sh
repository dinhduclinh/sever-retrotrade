#!/bin/bash
set -e

# Install Chrome nếu chưa có (vào cache mới)
npx puppeteer browsers install chrome@latest

npm install

# Nếu có build khác
# npm run build