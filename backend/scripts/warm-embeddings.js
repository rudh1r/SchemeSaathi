/**
 * Download and cache the local embedding model during the Docker build.
 *
 * Query-time embedding still needs the model even when the document vectors
 * were precomputed. Baking the model into the image prevents a slow Hugging
 * Face download on the first request after a free-tier cold start.
 */
require('dotenv').config({ quiet: true });
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const config = require('../src/config');

new DefaultEmbeddingFunction({ modelName: config.embeddingModel })
  .generate(['warmup'])
  .then(() => {
    console.log(`Cached embedding model ${config.embeddingModel}`);
  })
  .catch((err) => {
    console.error('Failed to warm the embedding model:', err.message);
    process.exitCode = 1;
  });
