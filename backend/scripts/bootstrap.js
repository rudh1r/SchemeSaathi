/**
 * Idempotent first-run setup for containers and fresh servers.
 *
 *   empty MongoDB      -> import data/schemes.json
 *   empty/mismatched   -> embed every scheme into Chroma
 *   already provisioned -> no-op
 *
 * Force a refresh with SEED_FORCE=true and/or EMBED_FORCE=true. Destructive
 * refreshes are intentionally opt-in so a container restart never wipes users,
 * bookmarks or conversations.
 */
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');
const config = require('../src/config');
const { createChromaClient, syncIndex } = require('../src/vector-index');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const log = (message) => console.log(`[bootstrap] ${message}`);

function readSeedFile() {
  const file = process.env.SEED_FILE || path.resolve(__dirname, '../../data/schemes.json');
  if (!fs.existsSync(file)) throw new Error(`Seed file not found: ${file}`);
  const schemes = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(schemes) || schemes.length === 0) {
    throw new Error(`Seed file is empty or not an array: ${file}`);
  }
  return { file, schemes };
}

async function connectMongo(attempts = 30) {
  if (!config.mongoUri) throw new Error('MONGODB_URI is required');

  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await client.connect();
      await client.db('admin').command({ ping: 1 });
      return client;
    } catch (err) {
      await client.close().catch(() => {});
      log(`MongoDB not ready (${attempt}/${attempts}): ${err.message}`);
      if (attempt < attempts) await sleep(2000);
    }
  }
  throw new Error('MongoDB did not become ready in time');
}

async function waitForChroma(chroma, attempts = 60) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await chroma.heartbeat();
      return;
    } catch (err) {
      log(`Chroma not ready (${attempt}/${attempts}): ${err.message}`);
      if (attempt < attempts) await sleep(2000);
    }
  }
  throw new Error('Chroma did not become ready in time');
}

async function run() {
  const problems = config.configErrors();
  if (problems.length) throw new Error(`invalid configuration: ${problems.join('; ')}`);

  const client = await connectMongo();
  const db = client.db(config.mongoDbName);

  try {
    const schemes = db.collection('schemes');
    const existing = await schemes.countDocuments();
    const seedRequested = process.env.SEED_FORCE === 'true';
    let seeded = false;

    if (existing === 0 || seedRequested) {
      const { file, schemes: docs } = readSeedFile();
      // Mongo must own _id generation. A dump that contains string ids would
      // break ObjectId lookups in the API and the vector metadata.
      const clean = docs.map(({ _id, ...scheme }) => scheme);
      if (seedRequested && existing > 0) {
        log(`SEED_FORCE=true: replacing ${existing} schemes`);
        await schemes.deleteMany({});
      }
      const inserted = await schemes.insertMany(clean);
      seeded = true;
      log(`Imported ${inserted.insertedCount} schemes from ${file}`);
    } else {
      log(`MongoDB already has ${existing} schemes; leaving them untouched`);
    }

    await schemes.createIndex({ scheme_name: 1 });
    await schemes.createIndex({ state: 1, category: 1 });

    const chroma = createChromaClient();
    await waitForChroma(chroma);

    const force = seeded || process.env.EMBED_FORCE === 'true';
    const result = await syncIndex({
      db,
      chroma,
      force,
      onProgress: (done, total) => process.stdout.write(`\r[bootstrap] embedded ${done}/${total}`),
    });

    if (result.skipped) {
      log(`Chroma already has ${result.count} vectors; leaving the index untouched`);
    } else {
      log(`Indexed ${result.count} schemes in Chroma collection "${result.collection}"`);
    }
  } finally {
    await client.close().catch(() => {});
  }
}

run().catch((err) => {
  console.error(`[bootstrap] failed: ${err.message}`);
  process.exitCode = 1;
});
