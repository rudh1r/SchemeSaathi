/**
 * ChromaDB retrieval layer.
 *
 * Important fix over the original implementation: the ranked order returned by
 * Chroma used to be discarded when schemes were re-read from MongoDB with
 * `$in`, so the UI showed relevance-ordered *cards* that were not actually the
 * top-ranked candidates. `searchSchemes()` now hydrates documents while
 * preserving rank and attaches the similarity score.
 */
const config = require('./config');
const { collections } = require('./db');
const { buildBM25, documentText, expandQuery, rrfFuse } = require('./search/hybrid');

// Keep the Chroma client lazy. Vercel/serverless deployments set
// DISABLE_CHROMA=true and never load the dependency or attempt a connection.
let client = null;
function getClient() {
  if (!client) {
    const { ChromaClient } = require('chromadb');
    client = new ChromaClient(config.chroma);
  }
  return client;
}

let collectionPromise = null;
let corpusCache = null;
let heartbeatCache = { at: 0, ok: false };
const CORPUS_TTL_MS = 60_000;
const HEARTBEAT_TTL_MS = 5_000;

function getCollection() {
  if (config.chromaDisabled) {
    return Promise.reject(new Error('Dense retrieval is disabled (DISABLE_CHROMA=true)'));
  }
  if (!collectionPromise) {
    collectionPromise = getClient().getOrCreateCollection({ name: config.chromaCollection });
    // A failed lookup should not poison every later request.
    collectionPromise.catch(() => {
      collectionPromise = null;
    });
  }
  return collectionPromise;
}

async function heartbeat({ force = false } = {}) {
  if (config.chromaDisabled) return false;
  if (!force && Date.now() - heartbeatCache.at < HEARTBEAT_TTL_MS) return heartbeatCache.ok;
  try {
    await getClient().heartbeat();
    heartbeatCache = { at: Date.now(), ok: true };
    return true;
  } catch {
    heartbeatCache = { at: Date.now(), ok: false };
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
async function search(queryText, { topK = config.defaultTopK, filters, maxTopK = config.maxTopK } = {}) {
  const k = Math.min(Math.max(Number(topK) || config.defaultTopK, 1), Math.max(Number(maxTopK) || config.maxTopK, 1));
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
 * Return the in-memory BM25 corpus for the current filter set. The corpus is
 * small (112 schemes), so a short-lived cache is enough; it avoids rebuilding
 * the index on every chat turn while still picking up a fresh import quickly.
 */
function matchesFilters(scheme, filters = {}) {
  if (filters.state) {
    if (scheme.state && scheme.state !== 'All' && scheme.state !== filters.state) return false;
  }
  if (filters.category && scheme.category !== filters.category) return false;
  if (filters.level && scheme.level !== filters.level) return false;
  return true;
}

async function getCorpus(filters = {}) {
  const key = JSON.stringify({
    state: filters.state || '',
    category: filters.category || '',
    level: filters.level || '',
  });
  if (corpusCache && corpusCache.key === key && Date.now() - corpusCache.at < CORPUS_TTL_MS) {
    return corpusCache;
  }

  const docs = (await collections.schemes().find({}).toArray()).filter((scheme) => matchesFilters(scheme, filters));
  const byId = new Map(docs.map((scheme) => [String(scheme._id), scheme]));
  const index = buildBM25(
    docs.map((scheme) => ({
      id: String(scheme._id),
      name: scheme.scheme_name,
      text: documentText(scheme),
    })),
  );
  corpusCache = { key, at: Date.now(), docs, byId, index };
  return corpusCache;
}

/** Force a rebuild after an import or a test fixture change. */
function clearCorpusCache() {
  corpusCache = null;
}

/**
 * Hybrid retrieval: Chroma dense candidates + BM25 candidates, fused with
 * reciprocal-rank fusion. If Chroma is unavailable, BM25 still returns a
 * usable ranking instead of failing the whole request.
 */
async function hybridSearchSchemes(queryText, { topK = config.defaultTopK, filters } = {}) {
  const k = Math.min(Math.max(Number(topK) || config.defaultTopK, 1), config.maxTopK);
  const candidateK = Math.min(Math.max(k * 5, config.hybridCandidates), 60);
  const searchText = expandQuery(queryText) || String(queryText || '');

  let denseHits = [];
  let denseAvailable = false;
  try {
    if (await heartbeat()) {
      denseHits = await search(searchText, { topK: candidateK, filters, maxTopK: candidateK });
      denseAvailable = denseHits.length > 0;
    }
  } catch (err) {
    console.warn('Dense retrieval unavailable during hybrid search:', err.message);
  }

  let corpus;
  try {
    corpus = await getCorpus(filters || {});
  } catch (err) {
    console.warn('BM25 corpus unavailable during hybrid search:', err.message);
    corpus = { byId: new Map(), index: { score: () => [] } };
  }

  const lexicalHits = corpus.index.score(searchText).slice(0, candidateK);
  if (denseHits.length === 0 && lexicalHits.length === 0) return [];

  const fused = rrfFuse(
    denseHits.map((hit) => hit.id),
    lexicalHits.map((hit) => hit.id),
    {
      k: config.hybridRrfK,
      denseWeight: config.hybridDenseWeight,
      lexicalWeight: config.hybridLexicalWeight,
    },
  );

  const denseById = new Map(denseHits.map((hit) => [String(hit.id), hit]));
  const lexicalById = new Map(lexicalHits.map((hit) => [String(hit.id), hit]));

  return fused
    .slice(0, k)
    .map((row, index) => {
      const scheme = corpus.byId.get(String(row.id));
      if (!scheme) return null;
      const dense = denseById.get(String(row.id));
      return {
        ...scheme,
        _relevance: dense?.similarity ?? null,
        _bm25: lexicalById.get(String(row.id))?.score ?? null,
        _hybrid: Number(row.score.toFixed(6)),
        _rank: index + 1,
        _retrieval: denseAvailable ? 'hybrid' : 'lexical-bm25',
      };
    })
    .filter(Boolean);
}

/**
 * Lexical fallback used when the vector store is down. It uses the same BM25
 * index as hybrid retrieval rather than a separate ad-hoc substring score.
 */
async function lexicalSearchSchemes(queryText, { topK = config.defaultTopK, filters } = {}) {
  const k = Math.min(Math.max(Number(topK) || config.defaultTopK, 1), config.maxTopK);
  const corpus = await getCorpus(filters || {});
  return corpus.index
    .score(queryText)
    .slice(0, k)
    .map((row, index) => {
      const scheme = corpus.byId.get(String(row.id));
      return scheme
        ? {
            ...scheme,
            _relevance: null,
            _bm25: row.score,
            _rank: index + 1,
            _retrieval: 'lexical-bm25',
          }
        : null;
    })
    .filter(Boolean);
}

module.exports = {
  client,
  getCollection,
  heartbeat,
  count,
  search,
  searchSchemes,
  hybridSearchSchemes,
  lexicalSearchSchemes,
  clearCorpusCache,
  getCorpus,
};
