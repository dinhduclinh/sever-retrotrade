#!/bin/bash
set -e

# Đặt cache dir (dù đã có env var nhưng để chắc)
export PUPPETEER_CACHE_DIR=/opt/render/.cache/puppeteer

# Tạo thư mục cache nếu chưa có
mkdir -p $PUPPETEER_CACHE_DIR

# Install Chrome thủ công vào cache dir persist của Render
npx puppeteer browsers install chrome

# Install dependencies bình thường
npm install

# Nếu project có lệnh build riêng (ví dụ NestJS, Next.js...)
# npm run build