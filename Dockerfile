# syntax=docker/dockerfile:1
ARG NODE_VERSION=22
FROM node:${NODE_VERSION}-slim AS base

# Install build dependencies for TensorFlow.js and Canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies separately to leverage layer caching
COPY --link package.json package-lock.json ./

# Optional proxy support (pass via --build-arg if needed)
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=${HTTP_PROXY}
ENV HTTPS_PROXY=${HTTPS_PROXY}

ENV NODE_ENV=production

# Harden npm against flaky networks and optionally switch to a mirror
RUN npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set network-timeout 600000 \
    && npm config set progress false \
    && if [ -n "$HTTP_PROXY" ]; then npm config set proxy "$HTTP_PROXY"; fi \
    && if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy "$HTTPS_PROXY"; fi \
    && npm config set registry "https://registry.npmmirror.com"

RUN --mount=type=cache,target=/root/.npm \
    npm install --omit=dev --no-audit --no-fund --prefer-offline

# Copy application source code (excluding .env, .git*, lock files, etc.)
COPY --link src/ ./src/
COPY --link server.js ./server.js

# Create a non-root user and switch to it
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser && \
    chown -R appuser:appgroup /app
USER appuser


ENV NODE_OPTIONS="--max-old-space-size=4096"

EXPOSE 9999

CMD ["node", "server.js"]
