/**
 * ChromaDB retrieval layer.
 *
 * Important fix over the original implementation: the ranked order returned by
 * Chroma used to be discarded when schemes were re-read from MongoDB with
 * `$in`, so the UI showed relevance-ordered *cards* that were not actually the
 * top-ranked candidates. `searchSchemes()` now hydrates documents while
 * preserving rank and attaches the similarity score.
 */
const { ChromaClient } = require('chromadb');
const config = require('./config');
const { collections } = require('./db');

const client = new ChromaClient(config.chroma);
let collectionPromise = null;

function getCollection() {
  if (!collectionPromise) {
    collectionPromise = client.getOrCreateCollection({ name: config.chromaCollection });
    // A failed lookup should not poison every later request.
    collectionPromise.catch(() => {
      collectionPromise = null;
    });
  }
  return collectionPromise;
}

async function heartbeat() {
  try {
    await client.heartbeat();
    return true;
  } catch {
    return false;
  }
}

async function count() {
  try {
    const collection = await getCollection();
    return await collection.count();
  } catch {
    return 0;
  }
}

/**
 * Translate simple API filters into a Chroma `where` clause.
 * Supported: { state, category, level }.
 */
function buildWhere(filters = {}) {
  const clauses = [];
  if (filters.state) clauses.push({ state: String(filters.state) });
  if (filters.category) clauses.push({ category: String(filters.category) });
  if (filters.level) clauses.push({ level: String(filters.level) });
  if (clauses.length === 0) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { $and: clauses };
}

/**
 * Raw retrieval: returns ranked ids, distances and metadata.
 */
async function search(queryText, { topK = config.defaultTopK, filters } = {}) {
  const k = Math.min(Math.max(Number(topK) || config.defaultTopK, 1), config.maxTopK);
  const collection = await getCollection();
  const result = await collection.query({
    queryTexts: [queryText],
    nResults: k,
    where: buildWhere(filters),
    // Ask for distances explicitly; Chroma does not always include them by default.
    include: ['metadatas', 'documents', 'distances'],
  });

  const ids = result.ids?.[0] || [];
  const distances = result.distances?.[0] || [];
  const metadatas = result.metadatas?.[0] || [];

  return ids.map((id, i) => ({
    id,
    mongoId: metadatas[i]?.mongo_id || id,
    // Chroma returns a distance for cosine space: similarity = 1 - distance.
    similarity: distances[i] == null ? null : Number((1 - distances[i]).toFixed(4)),
    metadata: metadatas[i] || {},
  }));
}

/**
 * Ranked retrieval hydrated with the full MongoDB scheme documents.
 * Returns [] (instead of throwing) when Chroma is unavailable, so /api/query
 * can fall back to lexical search and keep answering.
 */
async function searchSchemes(queryText, { topK, filters } = {}) {
  const hits = await search(queryText, { topK, filters });
  if (hits.length === 0) return [];

  const { ObjectId } = require('mongodb');
  const validIds = hits.map((h) => h.mongoId).filter((id) => ObjectId.isValid(id));
  const docs = await collections.schemes().find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } }).toArray();
  const byId = new Map(docs.map((d) => [String(d._id), d]));

  return hits
    .map((hit) => {
      const doc = byId.get(String(hit.mongoId));
      if (!doc) return null;
      return { ...doc, _relevance: hit.similarity, _rank: hits.indexOf(hit) + 1 };
    })
    .filter(Boolean);
}

/**
 * Lexical fallback used when the vector store is down. Deliberately simple and
 * dependency-free; it is a degradation path, not the primary retriever.
 */
async function lexicalSearchSchemes(queryText, { topK = config.defaultTopK } = {}) {
  const tokens = String(queryText || '')
    .toLowerCase()
    .match(/[a-z0-9]{3,}/g) || [];
  if (tokens.length === 0) return [];

  const docs = await collections.schemes().find({}).toArray();
  const scored = docs.map((doc) => {
    const haystack = [
      doc.scheme_name,
      doc.description,
      doc.benefits,
      JSON.stringify(doc.eligibility || {}),
      doc.category,
      doc.state,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    let score = 0;
    for (const token of new Set(tokens)) {
      if (haystack.includes(token)) score += 1;
      if (String(doc.scheme_name || '').toLowerCase().includes(token)) score += 2;
    }
    return { ...doc, _relevance: null, _lexicalScore: score };
  });

  return scored
    .filter((doc) => doc._lexicalScore > 0)
    .sort((a, b) => b._lexicalScore - a._lexicalScore)
    .slice(0, topK)
    .map((doc, i) => ({ ...doc, _rank: i + 1 }));
}

module.exports = {
  client,
  getCollection,
  heartbeat,
  count,
  search,
  searchSchemes,
  lexicalSearchSchemes,
};
