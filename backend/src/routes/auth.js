const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const config = require('../config');
const { collections } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { HttpError, str, email, object } = require('../http/validate');

const router = express.Router();
const BCRYPT_ROUNDS = 10;
// Slow down credential stuffing without getting in the way of a demo: 20
// attempts per IP per 15 minutes, shared by register and login.
const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20 });

function signToken(user) {
  return jwt.sign(
    { userId: String(user._id), email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
}

function publicUser(user) {
  return { id: String(user._id), name: user.name, email: user.email };
}

router.post('/register', authLimiter, async (req, res) => {
  const name = str(req.body?.name, 'Name', { required: true, min: 2, max: 80 });
  const userEmail = email(req.body?.email);
  const password = str(req.body?.password, 'Password', { required: true, min: 8, max: 128 });

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new HttpError(400, 'Password must contain at least one letter and one number');
  }

  const existing = await collections.users().findOne({ email: userEmail });
  if (existing) throw new HttpError(409, 'An account with this email already exists');

  const doc = {
    name,
    email: userEmail,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    profile: {},
    created_at: new Date(),
  };
  const result = await collections.users().insertOne(doc);
  const user = { _id: result.insertedId, ...doc };

  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

router.post('/login', authLimiter, async (req, res) => {
  const userEmail = email(req.body?.email);
  const password = str(req.body?.password, 'Password', { required: true, max: 128 });

  const user = await collections.users().findOne({ email: userEmail });
  if (!user) throw new HttpError(401, 'Invalid email or password');

  const hash = user.passwordHash || user.password;
  const ok = hash ? await bcrypt.compare(password, hash) : false;
  if (!ok) throw new HttpError(401, 'Invalid email or password');

  res.json({ token: signToken(user), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await collections.users().findOne({ _id: new ObjectId(req.user.userId) });
  if (!user) throw new HttpError(401, 'Account no longer exists');
  res.json({ user: { ...publicUser(user), profile: user.profile || {} } });
});

router.get('/profile', requireAuth, async (req, res) => {
  const user = await collections.users().findOne({ _id: new ObjectId(req.user.userId) });
  res.json({ profile: user?.profile || {} });
});

router.put('/profile', requireAuth, async (req, res) => {
  const profile = object(req.body?.profile ?? req.body, 'profile');
  if (typeof profile !== 'object') throw new HttpError(400, 'profile must be an object');

  await collections.users().updateOne(
    { _id: new ObjectId(req.user.userId) },
    { $set: { profile, profile_updated_at: new Date() } },
  );
  res.json({ profile });
});

module.exports = router;
