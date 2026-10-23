#!/bin/sh
set -eu

CHROMA_PORT="${CHROMA_PORT:-8000}"
CHROMA_PATH="${CHROMA_PATH:-/data}"

mkdir -p "$CHROMA_PATH"

# Chroma is only bound to loopback: it is an implementation detail of this
# container, not a public service.
chroma run --path "$CHROMA_PATH" --host 127.0.0.1 --port "$CHROMA_PORT" &
CHROMA_PID=$!

cleanup() {
  kill "$CHROMA_PID" 2>/dev/null || true
  wait "$CHROMA_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Idempotent: imports the seed file when Mongo is empty and recreates the
# ephemeral Chroma collection from data/scheme_embeddings.json.
npm run bootstrap

# exec keeps Node as the foreground process so Render can stop the service.
exec node server.js
