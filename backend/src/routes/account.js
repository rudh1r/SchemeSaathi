const express = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { HttpError, int, str, object } = require('../http/validate');
const { attachRules } = require('../eligibility/service');

const router = express.Router();

// ---------------- query history ----------------

router.get('/history', requireAuth, async (req, res) => {
  const limit = int(req.query.limit, 'limit', { min: 1, max: 200, fallback: 50 });
  const items = await collections.queries()
    .find({ user_id: new ObjectId(req.user.userId) })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray();

  res.json({
    total: items.length,
    items: items.map((item) => ({
      id: item._id,
      query: item.query_text,
      answer: item.answer || '',
      schemes: (item.assessments || []).map((a) => ({ name: a.scheme, status: a.status })),
      created_at: item.created_at,
    })),
  });
});

router.delete('/history/:id', requireAuth, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid history id');
  const result = await collections.queries().deleteOne({
    _id: new ObjectId(req.params.id),
    user_id: new ObjectId(req.user.userId),
  });
  if (!result.deletedCount) throw new HttpError(404, 'History entry not found');
  res.json({ deleted: true });
});

router.delete('/history', requireAuth, async (req, res) => {
  const result = await collections.queries().deleteMany({ user_id: new ObjectId(req.user.userId) });
  res.json({ deleted: result.deletedCount });
});

// ---------------- bookmarks ----------------

router.get('/bookmarks', requireAuth, async (req, res) => {
  const rows = await collections.bookmarks()
    .find({ user_id: new ObjectId(req.user.userId) })
    .sort({ created_at: -1 })
    .toArray();

  const ids = rows.map((r) => r.scheme_id).filter((id) => ObjectId.isValid(id));
  const schemes = await collections.schemes().find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }).toArray();
  const byId = new Map(schemes.map((s) => [String(s._id), s]));

  res.json({
    total: rows.length,
    items: rows
      .map((row) => {
        const scheme = byId.get(String(row.scheme_id));
        if (!scheme) return null;
        const withRules = attachRules([scheme])[0];
        return {
          id: row._id,
          created_at: row.created_at,
          scheme: {
            _id: withRules._id,
            scheme_name: withRules.scheme_name,
            description: withRules.description,
            benefits: withRules.benefits,
            state: withRules.state,
            level: withRules.level,
            category: withRules.category,
            source_url: withRules.source_url,
          },
        };
      })
      .filter(Boolean),
  });
});

router.post('/bookmarks', requireAuth, async (req, res) => {
  const schemeId = str(req.body?.schemeId, 'schemeId', { required: true, max: 64 });
  if (!ObjectId.isValid(schemeId)) throw new HttpError(400, 'Invalid schemeId');

  const scheme = await collections.schemes().findOne({ _id: new ObjectId(schemeId) });
  if (!scheme) throw new HttpError(404, 'Scheme not found');

  try {
    await collections.bookmarks().insertOne({
      user_id: new ObjectId(req.user.userId),
      scheme_id: schemeId,
      created_at: new Date(),
    });
  } catch (err) {
    if (err.code === 11000) return res.status(200).json({ bookmarked: true, alreadyBookmarked: true });
    throw err;
  }
  return res.status(201).json({ bookmarked: true });
});

router.delete('/bookmarks/:schemeId', requireAuth, async (req, res) => {
  const { schemeId } = req.params;
  if (!ObjectId.isValid(schemeId)) throw new HttpError(400, 'Invalid schemeId');
  await collections.bookmarks().deleteOne({
    user_id: new ObjectId(req.user.userId),
    scheme_id: schemeId,
  });
  res.json({ bookmarked: false });
});

// ---------------- feedback ----------------

router.post('/feedback', optionalAuth, async (req, res) => {
  const rating = str(req.body?.rating, 'rating', { required: true, max: 10 });
  if (!['up', 'down'].includes(rating)) throw new HttpError(400, 'rating must be "up" or "down"');
  const comment = str(req.body?.comment, 'comment', { max: 1000 });
  const answer = str(req.body?.answer, 'answer', { max: 4000 });
  const schemeIds = object(req.body?.meta, 'meta');

  await collections.feedback().insertOne({
    rating,
    comment: comment || null,
    answer_excerpt: answer ? answer.slice(0, 1000) : null,
    meta: schemeIds,
    user_id: req.user?.userId ? new ObjectId(req.user.userId) : null,
    created_at: new Date(),
  });

  res.status(201).json({ recorded: true });
});

module.exports = router;
