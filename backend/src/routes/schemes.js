const express = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { attachRules } = require('../eligibility/service');
const { STATES } = require('../eligibility/profile');
const { HttpError } = require('../http/validate');

const router = express.Router();

/** GET /api/schemes?search=&state=&category=&level= */
router.get('/', async (req, res) => {
  const { search, state, category, level } = req.query;
  const filter = {};
  const and = [];
  if (category) filter.category = category;
  if (level) filter.level = level;

  if (state) {
    // A state filter means "schemes available here": state-specific schemes
    // plus central schemes (state = "All" or unset).
    and.push({
      $or: [
        { state },
        { state: 'All' },
        { state: { $exists: false } },
        { state: '' },
      ],
    });
  }

  if (search) {
    const safe = String(search).slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    and.push({
      $or: [
        { scheme_name: { $regex: safe, $options: 'i' } },
        { description: { $regex: safe, $options: 'i' } },
        { benefits: { $regex: safe, $options: 'i' } },
      ],
    });
  }

  if (and.length > 0) filter.$and = and;

  const docs = await collections.schemes().find(filter).sort({ scheme_name: 1 }).toArray();
  res.json(attachRules(docs));
});

/** Filter values for the browse UI. */
router.get('/filters', async (_req, res) => {
  const [states, categories, levels] = await Promise.all([
    collections.schemes().distinct('state'),
    collections.schemes().distinct('category'),
    collections.schemes().distinct('level'),
  ]);
  const clean = (values) => values.filter((v) => v && v !== 'All').sort();
  // Only real states belong in the state selector; descriptors such as
  // "Tribal areas" are regions, not domicile states.
  const realStates = STATES.filter((state) => states.includes(state));
  res.json({ states: realStates, categories: clean(categories), levels: clean(levels) });
});

router.get('/:id', async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) throw new HttpError(400, 'Invalid scheme id');
  const doc = await collections.schemes().findOne({ _id: new ObjectId(req.params.id) });
  if (!doc) throw new HttpError(404, 'Scheme not found');
  res.json(attachRules([doc])[0]);
});

module.exports = router;
