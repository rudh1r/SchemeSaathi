# Small wrapper used when Chroma runs as a separate private service
# (Render/Railway/Fly). The persistent directory must be a mounted disk.
FROM chromadb/chroma:1.5.9

ENV IS_PERSISTENT=TRUE \
    ANONYMIZED_TELEMETRY=FALSE

EXPOSE 8000
