/**
 * Chroma index management shared by the CLI (`npm run embed`) and the
 * container bootstrap. Keeping the document/metadata shape here means a fresh
 * deployment and a local re-index cannot drift apart.
 */
const fs = require('fs');
const { ChromaClient } = require('chromadb');
const { DefaultEmbeddingFunction } = require('@chroma-core/default-embed');
const config = require('./config');

const BATCH = 100;

function createChromaClient() {
  return new ChromaClient(config.chroma);
}

let precomputedEmbeddings;
let embedder;

/**
 * Load the committed document vectors once. The file is optional so a custom
 * seed file still works (the embedding function is used as a fallback).
 */
function loadPrecomputedEmbeddings() {
  if (precomputedEmbeddings !== undefined) return precomputedEmbeddings;

  try {
    const raw = JSON.parse(fs.readFileSync(config.precomputedEmbeddingsFile, 'utf8'));
    const entries = raw.embeddings && typeof raw.embeddings === 'object' ? raw.embeddings : raw;
    precomputedEmbeddings = new Map(
      Object.entries(entries).filter(([, vector]) => Array.isArray(vector) && vector.length > 0),
    );
    if (raw.model && raw.model !== config.embeddingModel) {
      console.warn(
        `Precomputed embeddings use ${raw.model}, but EMBEDDING_MODEL is ${config.embeddingModel}; ignoring them`,
      );
      precomputedEmbeddings = new Map();
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`Could not read precomputed embeddings (${err.message}); falling back to runtime embedding`);
    }
    precomputedEmbeddings = new Map();
  }

  return precomputedEmbeddings;
}

function getEmbedder() {
  if (!embedder) {
    embedder = new DefaultEmbeddingFunction({ modelName: config.embeddingModel });
  }
  return embedder;
}

async function embedChunk(chunk) {
  const cached = loadPrecomputedEmbeddings();
  const vectors = [];

  for (const scheme of chunk) {
    const vector = cached.get(scheme.scheme_name);
    if (vector) {
      vectors.push(vector);
    } else {
      const [generated] = await getEmbedder().generate([documentFor(scheme)]);
      vectors.push(generated);
    }
  }

  return vectors;
}

/** One searchable passage per scheme: name + geography + classification + prose. */
function documentFor(scheme) {
  const eligibility = scheme.eligibility || {};
  const eligibilityText = Object.entries(eligibility)
    .map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`)
    .join('; ');

  return [
    scheme.scheme_name,
    scheme.state && scheme.state !== 'All' ? `State: ${scheme.state}.` : 'Available across India.',
    scheme.level ? `Level: ${scheme.level}.` : '',
    scheme.category ? `Category: ${scheme.category}.` : '',
    scheme.description,
    scheme.benefits ? `Benefits: ${scheme.benefits}` : '',
    eligibilityText ? `Eligibility: ${eligibilityText}` : '',
    scheme.application_process ? `How to apply: ${scheme.application_process}` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .slice(0, 3000);
}

function metadataFor(scheme) {
  return {
    scheme_name: scheme.scheme_name,
    mongo_id: scheme._id.toString(),
    state: scheme.state || 'All',
    category: scheme.category || 'General',
    level: scheme.level || 'Central',
  };
}

/**
 * Rebuild the collection from MongoDB.
 *
 * `force: false` is the fast bootstrap path: when the document counts already
 * match, the index is left untouched. Pass `force: true` after replacing the
 * seed data so stale vector ids cannot survive behind an equal count.
 */
async function syncIndex({
  db,
  chroma = createChromaClient(),
  collectionName = config.chromaCollection,
  force = false,
  onProgress,
} = {}) {
  if (!db) throw new Error('syncIndex requires a connected MongoDB db handle');

  const schemes = await db.collection('schemes').find({}).toArray();
  if (schemes.length === 0) {
    throw new Error('Cannot build the vector index: the schemes collection is empty');
  }

  const collection = await chroma.getOrCreateCollection({ name: collectionName });
  const current = await collection.count().catch(() => 0);

  if (!force && current === schemes.length) {
    return { skipped: true, count: current, collection: collectionName };
  }

  try {
    await chroma.deleteCollection({ name: collectionName });
  } catch {
    // Collection did not exist.
  }
  const fresh = await chroma.getOrCreateCollection({ name: collectionName });

  let done = 0;
  for (let i = 0; i < schemes.length; i += BATCH) {
    const chunk = schemes.slice(i, i + BATCH);
    await fresh.upsert({
      ids: chunk.map((scheme) => scheme._id.toString()),
      documents: chunk.map(documentFor),
      metadatas: chunk.map(metadataFor),
      embeddings: await embedChunk(chunk),
    });
    done += chunk.length;
    onProgress?.(done, schemes.length);
  }

  return { skipped: false, count: done, collection: collectionName };
}

module.exports = {
  BATCH,
  createChromaClient,
  documentFor,
  metadataFor,
  syncIndex,
};
