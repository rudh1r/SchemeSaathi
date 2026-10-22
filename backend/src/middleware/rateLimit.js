/**
 * Minimal in-memory sliding-window rate limiter for the AI endpoints.
 * No external dependency; resets when the process restarts, which is fine for
 * a single-instance academic deployment.
 */
const config = require('../config');

const buckets = new Map();

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function rateLimit({ windowMs = config.rateLimit.windowMs, max = config.rateLimit.max } = {}) {
  return (req, res, next) => {
    if (process.env.RATE_LIMIT_DISABLED === 'true') return next();

    const key = clientKey(req);
    const now = Date.now();
    const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);

    if (hits.length >= max) {
      const retryAfter = Math.ceil((windowMs - (now - hits[0])) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: `Too many requests. Please wait ${retryAfter} second${retryAfter === 1 ? '' : 's'} and try again.`,
      });
    }

    hits.push(now);
    buckets.set(key, hits);

    // Opportunistic cleanup so the map cannot grow without bound.
    if (buckets.size > 5000) {
      for (const [otherKey, otherHits] of buckets) {
        if (!otherHits.some((t) => now - t < windowMs)) buckets.delete(otherKey);
      }
    }

    res.set('X-RateLimit-Limit', String(max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, max - hits.length)));
    return next();
  };
}

module.exports = { rateLimit };
