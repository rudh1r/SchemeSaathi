/**
 * Chroma index management shared by the CLI (`npm run embed`) and the
 * container bootstrap. Keeping the document/metadata shape here means a fresh
 * deployment and a local re-index cannot drift apart.
 */
const { ChromaClient } = require('chromadb');
const config = require('./config');

const BATCH = 100;

function createChromaClient() {
  return new ChromaClient(config.chroma);
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
