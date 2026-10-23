/**
 * Precompute the search-document embeddings used by Chroma.
 *
 * The deployed free-tier container has no persistent disk, so rebuilding the
 * vector index during every cold start is wasteful. The embeddings are stable
 * for a given seed file and model; generating them once keeps container startup
 * fast and avoids re-running the ONNX model on a 0.1-CPU instance.
 *
 * Usage:
 *   node scripts/build-embeddings.js
 *
 * The output is keyed by scheme name because the Mongo _id is generated when
 * the seed file is imported, while scheme names are unique and stable.
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const config = require('../src/config');
const { documentFor } = require('../src/vector-index');

const seedFile = process.env.SEED_FILE || path.resolve(__dirname, '../../data/schemes.json');
const outputFile =
  process.env.SCHEME_EMBEDDINGS_FILE ||
  path.resolve(__dirname, '../../data/scheme_embeddings.json');
const BATCH_SIZE = 32;

async function main() {
  const schemes = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
  if (!Array.isArray(schemes) || schemes.length === 0) {
    throw new Error(`Seed file is empty or not an array: ${seedFile}`);
  }

  const embedder = new DefaultEmbeddingFunction({ modelName: config.embeddingModel });
  const embeddings = {};

  for (let i = 0; i < schemes.length; i += BATCH_SIZE) {
    const chunk = schemes.slice(i, i + BATCH_SIZE);
    const vectors = await embedder.generate(chunk.map(documentFor));
    chunk.forEach((scheme, index) => {
      embeddings[scheme.scheme_name] = vectors[index];
    });
    process.stdout.write(`\r  embedded ${Math.min(i + chunk.length, schemes.length)}/${schemes.length}`);
  }

  const dimensions = Object.values(embeddings)[0]?.length;
  if (!dimensions) throw new Error('The embedding model returned no vectors');

  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(
    outputFile,
    JSON.stringify({
      model: config.embeddingModel,
      dimensions,
      embeddings,
    }),
  );

  console.log(`\nWrote ${Object.keys(embeddings).length} embeddings (${dimensions} dimensions) to ${outputFile}`);
}

main().catch((err) => {
  console.error('\nEmbedding build failed:', err.message);
  process.exitCode = 1;
});
