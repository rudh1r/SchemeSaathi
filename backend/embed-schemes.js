/**
 * Rebuilds the Chroma "schemes" collection from MongoDB.
 *
 * Prerequisites:
 *   1. MongoDB reachable (MONGODB_URI in backend/.env)
 *   2. Chroma running:  npm run chroma   (from backend/)
 *
 * Usage: npm run embed
 */
require('dotenv').config({ quiet: true });
const { MongoClient } = require('mongodb');
const config = require('./src/config');
const { syncIndex } = require('./src/vector-index');

const mongoClient = new MongoClient(config.mongoUri);

async function main() {
  if (!config.mongoUri) throw new Error('MONGODB_URI is missing from backend/.env');

  await mongoClient.connect();
  console.log('Connected to MongoDB');
  const db = mongoClient.db(config.mongoDbName);

  const result = await syncIndex({
    db,
    force: true,
    onProgress: (done, total) => process.stdout.write(`\r  embedded ${done}/${total}`),
  });

  console.log(`\nIndexed ${result.count} schemes in Chroma collection "${result.collection}"`);
}

main()
  .catch((err) => {
    console.error('\nEmbedding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoClient.close().catch(() => {});
  });
