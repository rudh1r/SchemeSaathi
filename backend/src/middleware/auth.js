const jwt = require('jsonwebtoken');
const config = require('../config');

/** Attach req.user when a valid bearer token is present; never block. */
function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), config.jwtSecret);
    } catch {
      req.user = null;
    }
  }
  next();
}

/** Reject unauthenticated requests. */
function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Please sign in to continue' });
  return next();
}

module.exports = { optionalAuth, requireAuth };
