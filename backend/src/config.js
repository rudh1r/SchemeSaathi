/**
 * Central configuration. Reads backend/.env once and exposes typed, defaulted
 * values so the rest of the code never touches process.env directly.
 */
require('dotenv').config({ quiet: true });
const path = require('path');

const num = (value, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const list = (value, fallback) =>
  (value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .concat(fallback || []);

const REQUIRED = ['MONGODB_URI', 'GROQ_API_KEY', 'JWT_SECRET'];

function missingKeys() {
  return REQUIRED.filter((key) => !process.env[key]);
}

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';

/**
 * Problems that should stop a production boot but are tolerable in local
 * development. Returning messages instead of exiting keeps this testable.
 */
function configErrors() {
  const errors = missingKeys().map((key) => `${key} is required`);
  const secret = process.env.JWT_SECRET || '';
  if (isProduction && secret && (secret.length < 32 || /^(replace|change|your)[-_]/i.test(secret))) {
    errors.push('JWT_SECRET must be a random value of at least 32 characters in production');
  }
  const groqKey = process.env.GROQ_API_KEY || '';
  if (isProduction && /^gsk_replace/i.test(groqKey)) {
    errors.push('GROQ_API_KEY is still the example placeholder');
  }
  return errors;
}

// CHROMA_URL accepts http(s)://host:port. Chroma's JS client wants either a
// URL or host/port/ssl, so both shapes are derived here.
const chromaUrl = new URL(process.env.CHROMA_URL || 'http://localhost:8000');

const config = {
  env,
  isProduction,
  port: num(process.env.PORT, 5000),
  trustProxy: bool(process.env.TRUST_PROXY, false),

  frontendDist: process.env.FRONTEND_DIST || path.join(__dirname, '../../frontend/dist'),

  mongoUri: process.env.MONGODB_URI,
  mongoDbName: process.env.MONGODB_DB || 'schemesaathi',

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  groqTimeoutMs: num(process.env.GROQ_TIMEOUT_MS, 30000),

  chroma: {
    host: chromaUrl.hostname,
    port: num(chromaUrl.port, chromaUrl.protocol === 'https:' ? 443 : 8000),
    ssl: chromaUrl.protocol === 'https:',
  },
  chromaUrl: chromaUrl.origin,
  chromaCollection: process.env.CHROMA_COLLECTION || 'schemes',

  defaultTopK: num(process.env.TOP_K, 3),
  maxTopK: num(process.env.MAX_TOP_K, 10),

  corsOrigins: list(process.env.CORS_ORIGINS, [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
  ]),

  // Requests per minute per IP for the expensive AI endpoints.
  rateLimit: {
    windowMs: num(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
    max: num(process.env.RATE_LIMIT_MAX, 30),
  },
};

module.exports = { ...config, missingKeys, configErrors, REQUIRED };
