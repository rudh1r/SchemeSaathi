/**
 * MongoDB connection helper.
 *
 * Differences from the original server.js:
 *  - never calls process.exit() on failure (a web server should stay up and
 *    report its state through /api/health instead of dying silently)
 *  - retries with backoff so a slow Atlas cold start does not kill the app
 *  - exposes the collections the routes need
 */
const { MongoClient } = require('mongodb');
const config = require('./config');

const client = new MongoClient(config.mongoUri, {
  serverSelectionTimeoutMS: 8000,
  retryWrites: true,
});

let db = null;
let connected = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connectDB({ retries = 3, delayMs = 1500 } = {}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      db = client.db(config.mongoDbName);
      connected = true;
      console.log('MongoDB connected');
      await ensureIndexes();
      return db;
    } catch (err) {
      connected = false;
      console.error(`MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) await sleep(delayMs * attempt);
    }
  }
  throw new Error('MongoDB is unreachable. Check MONGODB_URI and your network / Atlas IP allowlist.');
}

async function ensureIndexes() {
  const specs = [
    ['users', { email: 1 }, { unique: true }],
    ['user_queries', { user_id: 1, created_at: -1 }, {}],
    ['bookmarks', { user_id: 1, scheme_id: 1 }, { unique: true }],
    ['bookmarks', { user_id: 1, created_at: -1 }, {}],
    ['conversations', { user_id: 1, updated_at: -1 }, {}],
    ['schemes', { scheme_name: 1 }, {}],
    ['schemes', { state: 1, category: 1 }, {}],
  ];
  // Index creation must never block startup (e.g. a duplicate scheme name in
  // an older dump). Log and continue instead.
  for (const [name, keys, options] of specs) {
    try {
      await db.collection(name).createIndex(keys, options);
    } catch (err) {
      console.warn(`Index on ${name} ${JSON.stringify(keys)} skipped: ${err.message}`);
    }
  }
}

function getDB() {
  if (!db) throw new Error('Database not initialised');
  return db;
}

const collections = {
  users: () => getDB().collection('users'),
  schemes: () => getDB().collection('schemes'),
  queries: () => getDB().collection('user_queries'),
  bookmarks: () => getDB().collection('bookmarks'),
  conversations: () => getDB().collection('conversations'),
  feedback: () => getDB().collection('feedback'),
};

async function ping() {
  if (!db) return false;
  try {
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

async function closeDB() {
  await client.close();
  connected = false;
  db = null;
}

module.exports = { connectDB, getDB, collections, ping, closeDB, isConnected: () => connected };
