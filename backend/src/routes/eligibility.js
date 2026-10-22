const express = require('express');
const { ObjectId } = require('mongodb');
const { collections } = require('../db');
const { attachRules, assessCandidates, assessAll, buildSearchText, normaliseProfile, missingAttributes } = require('../eligibility/service');
const { evaluateScheme } = require('../eligibility/evaluate');
const { searchSchemes, lexicalSearchSchemes, heartbeat } = require('../retrieval');
const { optionalAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { HttpError, object, str, int } = require('../http/validate');

const router = express.Router();

/**
 * POST /api/eligibility/check
 * Body: { schemeId | schemeName, profile }
 * Evaluates one scheme against explicit profile attributes.
 */
router.post('/check', rateLimit(), async (req, res) => {
  const profile = object(req.body?.profile ?? req.body, 'profile');
  const schemeId = str(req.body?.schemeId, 'schemeId', { max: 64 });
  const schemeName = str(req.body?.schemeName, 'schemeName', { max: 250 });

  if (!schemeId && !schemeName) throw new HttpError(400, 'Provide schemeId or schemeName');

  const filter = schemeId
    ? ObjectId.isValid(schemeId)
      ? { _id: new ObjectId(schemeId) }
      : null
    : { scheme_name: schemeName };
  if (!filter) throw new HttpError(400, 'Invalid schemeId');

  const doc = await collections.schemes().findOne(filter);
  if (!doc) throw new HttpError(404, 'Scheme not found');

  const scheme = attachRules([doc])[0];
  const { attributes } = normaliseProfile(profile);
  const assessment = evaluateScheme(scheme, attributes);

  res.json({
    attributes,
    assessment,
    missing: missingAttributes([assessment]),
    scheme: {
      _id: scheme._id,
      scheme_name: scheme.scheme_name,
      description: scheme.description,
      benefits: scheme.benefits,
      source_url: scheme.source_url,
      application_process: scheme.application_process,
      eligibility_rules: scheme.eligibility_rules,
    },
  });
});

/**
 * POST /api/eligibility/match
 * Body: { profile, need?, limit? }
 *
 * Two modes:
 *  - with a stated need: semantically retrieve candidates, then evaluate them
 *  - without a need: evaluate the whole knowledge base (personalised discovery)
 */
router.post('/match', rateLimit(), optionalAuth, async (req, res) => {
  const profile = object(req.body?.profile ?? req.body, 'profile');
  const need = str(req.body?.need, 'need', { max: 2000 });
  const limit = int(req.body?.limit, 'limit', { min: 1, max: 112, fallback: 10 });

  const { attributes } = normaliseProfile(profile);
  if (Object.keys(attributes).length === 0) {
    throw new HttpError(400, 'Please provide at least one profile attribute (age, income, occupation, state, ...)');
  }

  let candidates = null;
  let retrieval = null;

  if (need) {
    const searchText = buildSearchText(attributes, need);
    try {
      if (await heartbeat()) {
        candidates = await searchSchemes(searchText, { topK: 25 });
        retrieval = { engine: 'dense-vector', candidates: candidates.length };
      }
    } catch (err) {
      console.warn('Eligibility retrieval fallback:', err.message);
    }
    if (!candidates || candidates.length === 0) {
      candidates = await lexicalSearchSchemes(searchText, { topK: 25 });
      retrieval = { engine: 'lexical-fallback', candidates: candidates.length };
    }
    candidates = attachRules(candidates);
    const assessments = assessCandidates(candidates, attributes);
    return res.json({
      attributes,
      mode: 'need-based',
      retrieval,
      totals: summarise(assessments),
      results: withSchemes(assessments, candidates),
      missing: missingAttributes(assessments),
    });
  }

  const result = await assessAll(profile, { limit });
  return res.json({
    attributes: result.attributes,
    mode: 'full-corpus',
    retrieval: { engine: 'deterministic-scan', candidates: result.totals.schemes },
    totals: {
      eligible: result.totals.eligible,
      insufficient: result.totals.insufficient,
      ineligible: result.totals.ineligible,
    },
    eligible: result.eligible,
    insufficient: result.insufficient,
    ineligible: result.ineligible,
    missing: missingAttributes([...result.eligible, ...result.insufficient]),
  });
});

/** GET /api/eligibility/rules/:schemeId — inspect the encoded conditions. */
router.get('/rules/:schemeId', async (req, res) => {
  if (!ObjectId.isValid(req.params.schemeId)) throw new HttpError(400, 'Invalid scheme id');
  const doc = await collections.schemes().findOne({ _id: new ObjectId(req.params.schemeId) });
  if (!doc) throw new HttpError(404, 'Scheme not found');
  const scheme = attachRules([doc])[0];
  res.json({ scheme_name: scheme.scheme_name, eligibility_rules: scheme.eligibility_rules });
});

function summarise(assessments) {
  return {
    eligible: assessments.filter((a) => a.status === 'Eligible').length,
    insufficient: assessments.filter((a) => a.status === 'Insufficient Information').length,
    ineligible: assessments.filter((a) => a.status === 'Ineligible').length,
    evaluated: assessments.length,
  };
}

function withSchemes(assessments, schemes) {
  const byId = new Map(schemes.map((s) => [String(s._id), s]));
  return assessments.map((a) => {
    const s = byId.get(String(a.schemeId));
    return {
      ...a,
      scheme: s
        ? {
            _id: s._id,
            scheme_name: s.scheme_name,
            description: s.description,
            benefits: s.benefits,
            state: s.state,
            level: s.level,
            category: s.category,
            source_url: s.source_url,
            application_process: s.application_process,
          }
        : null,
    };
  });
}

module.exports = router;
