# syntax=docker/dockerfile:1

# ---- frontend build ---------------------------------------------------------
# Vite emits static assets only; the runtime image below serves them from the
# same origin as the API.
FROM node:22-bookworm-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- runtime ---------------------------------------------------------------
FROM node:22-bookworm-slim AS runtime

LABEL org.opencontainers.image.title="SchemeSaathi" \
      org.opencontainers.image.description="RAG scheme discovery with deterministic eligibility"

# onnxruntime (used by Chroma's local embedding function) needs libgomp.
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates libgomp1 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PORT=5000 \
    FRONTEND_DIST=/app/frontend/dist \
    HF_HOME=/home/node/.cache/huggingface

WORKDIR /app/backend
# The app only needs the CPU execution provider. Without this flag the
# onnxruntime install script downloads multi-hundred-MB CUDA binaries on
# Linux/x64.
ENV ONNXRUNTIME_NODE_INSTALL_CUDA=skip

COPY backend/package.json backend/package-lock.json ./
# onnxruntime-node ships every platform in one package and Hugging Face caches
# the embedding model inside its package directory. Keep only Linux binaries,
# make the cache writable for the unprivileged user, and do it in the same
# layer so the removed platform binaries do not inflate the final image.
RUN npm ci --omit=dev \
    && find /app/backend/node_modules/onnxruntime-node/bin/napi-v3 \
         -mindepth 1 -maxdepth 1 -type d ! -name linux -exec rm -rf '{}' + \
    && mkdir -p /app/backend/node_modules/@huggingface/transformers/.cache \
    && chown -R node:node /app/backend/node_modules/@huggingface/transformers/.cache \
    && npm cache clean --force

COPY backend/ ./
COPY data/ /app/data/
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

USER node
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=180s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Bootstrap is idempotent: it only imports/embeds when the data stores are
# empty (or an explicit force flag is set). exec keeps SIGTERM on node.
CMD ["sh", "-c", "npm run bootstrap && exec node server.js"]
