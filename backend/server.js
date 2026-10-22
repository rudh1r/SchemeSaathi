/**
 * SchemeSaathi API + production web server.
 *
 * Layering:
 *   config -> db / retrieval / llm -> eligibility engine -> routes
 *
 * In development only the API is served here; Vite serves the frontend on
 * :5173. In production (`frontend/dist` present) this process also serves the
 * built SPA, so a single container/origin is enough for a deployment.
 *
 * The server starts even when MongoDB or Chroma is temporarily unavailable so
 * that /api/health can report the failure instead of the process exiting.
 */
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./src/config');
const { connectDB, closeDB } = require('./src/db');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy ? 1 : false);

const allowedOrigins = new Set(config.corsOrigins);

/** Allow configured origins plus genuine same-origin browser requests. */
function originAllowed(req, origin) {
  if (!origin) return true; // curl / server-to-server / native apps
  if (allowedOrigins.has(origin)) return true;
  try {
    const originHost = new URL(origin).host;
    const forwarded = req.headers['x-forwarded-host'];
    const host = config.trustProxy && forwarded ? forwarded.split(',')[0].trim() : req.headers.host;
    return Boolean(host && originHost === host);
  } catch {
    return false;
  }
}

app.use((req, res, next) => {
  cors({
    origin(origin, callback) {
      if (originAllowed(req, origin)) return callback(null, true);
      return callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(req, res, next);
});

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        // TLS redirects belong at the reverse proxy; forcing this here would
        // break plain-HTTP self-hosting and local production checks.
        upgradeInsecureRequests: null,
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

app.use(
  compression({
    // SSE must never be buffered by compression middleware.
    filter: (req, res) =>
      req.path !== '/api/query/stream' && req.path !== '/api/health'
        ? compression.filter(req, res)
        : false,
  }),
);

app.use(express.json({ limit: '256kb' }));

// Decode the JWT (if present) once for every API route, so both public routes
// and `requireAuth` routes see the same req.user.
const { optionalAuth } = require('./src/middleware/auth');
app.use('/api', optionalAuth);

// Lightweight request log (skip /api/health noise).
app.use((req, res, next) => {
  if (req.path === '/api/health') return next();
  const started = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`);
  });
  return next();
});

// API responses are user-specific and change on every write. Disable HTTP
// caching so the browser never reuses a 304 body for history, bookmarks or
// eligibility results.
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api', require('./src/routes/health'));
app.use('/api', require('./src/routes/auth'));
app.use('/api/schemes', require('./src/routes/schemes'));
app.use('/api/eligibility', require('./src/routes/eligibility'));
app.use('/api', require('./src/routes/query'));
app.use('/api', require('./src/routes/account'));

const apiInfo = {
  name: 'SchemeSaathi API',
  health: '/api/health',
  endpoints: [
    'POST /api/query',
    'POST /api/query/stream',
    'POST /api/eligibility/check',
    'POST /api/eligibility/match',
    'GET  /api/schemes',
    'GET  /api/health',
    'POST /api/register',
    'POST /api/login',
  ],
};
app.get('/api', (_req, res) => res.json(apiInfo));

// --- production frontend -----------------------------------------------------
const indexFile = path.join(config.frontendDist, 'index.html');
const hasFrontend = fs.existsSync(indexFile);

if (hasFrontend) {
  app.use(
    '/assets',
    express.static(path.join(config.frontendDist, 'assets'), {
      immutable: true,
      maxAge: '1y',
      fallthrough: true,
    }),
  );
  app.use(express.static(config.frontendDist, { index: false, maxAge: '1h' }));

  // React Router owns every non-API HTML route. Unknown API paths still get a
  // JSON 404 below instead of accidentally receiving index.html.
  app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
    if (!req.accepts('html')) return next();
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(indexFile);
  });
} else {
  app.get('/', (_req, res) => res.json(apiInfo));
}

app.use((req, res) => {
  res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });
});

// Central error handler: never leak stack traces to clients.
app.use((err, _req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.status || (err.message?.includes('not allowed by CORS') ? 403 : 500);
  if (status >= 500) console.error('Unhandled error:', err);
  res.status(status).json({
    error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message,
    ...(err.details ? { details: err.details } : {}),
  });
});

async function start() {
  const problems = config.configErrors();
  if (problems.length) {
    console.error('Invalid configuration:');
    for (const problem of problems) console.error(`  - ${problem}`);
    console.error('Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    // Stay alive: /api/health will report "mongodb: down".
    console.error(err.message);
    console.error('Starting anyway; data endpoints will fail until MongoDB is reachable.');
  }

  if (config.isProduction && !hasFrontend) {
    console.warn(`Production build not found at ${indexFile}; serving the API only.`);
  }

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`SchemeSaathi listening on http://localhost:${config.port}`);
    console.log(`Health: http://localhost:${config.port}/api/health`);
    console.log(
      `Environment: ${config.env} | frontend: ${hasFrontend ? 'served by this process' : 'separate dev server'}`,
    );
  });

  server.on('error', (err) => {
    console.error(`Server failed to start: ${err.message}`);
    process.exit(1);
  });

  let shuttingDown = false;
  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n${signal} received, shutting down...`);

    const forceExit = setTimeout(() => {
      console.error('Graceful shutdown timed out; exiting.');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      await closeDB().catch(() => {});
      clearTimeout(forceExit);
      process.exit(0);
    });
    server.closeIdleConnections?.();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (require.main === module) start();

module.exports = { app, start };
