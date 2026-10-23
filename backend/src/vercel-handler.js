/**
 * Vercel serverless entry point.
 *
 * The Express app is reused as-is; the only difference is that the database
 * connection is opened lazily on the first request and cached for warm
 * invocations. Set DISABLE_CHROMA=true in Vercel so retrieval uses the local
 * BM25 index instead of trying to reach a Chroma process.
 */
const { app } = require('../server');
const { connectDB } = require('./db');

let databasePromise = null;

function ensureDatabase() {
  if (!databasePromise) {
    databasePromise = connectDB({ retries: 1, delayMs: 500 }).catch((err) => {
      // Allow the next invocation to retry after a cold-start/network failure.
      databasePromise = null;
      throw err;
    });
  }
  return databasePromise;
}

module.exports = async function handler(req, res) {
  // Vercel rewrites deeper API paths to /api/index with the original path in a
  // query parameter. Restore the URL Express expects while preserving any
  // caller-supplied query string.
  try {
    const incoming = new URL(req.url, 'http://localhost');
    const originalPath = incoming.searchParams.get('__schemesaathi_path');
    if (originalPath !== null) {
      incoming.searchParams.delete('__schemesaathi_path');
      const query = incoming.searchParams.toString();
      req.url = `/api${originalPath ? `/${originalPath}` : ''}${query ? `?${query}` : ''}`;
    }
  } catch (err) {
    console.error('Could not normalise rewritten API path:', err.message);
  }

  try {
    await ensureDatabase();
  } catch (err) {
    // /api/health still reports the failure; other routes will return their
    // normal error instead of the function crashing at boot.
    console.error('Serverless database connection failed:', err.message);
  }
  return app(req, res);
};
