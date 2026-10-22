const express = require('express');
const config = require('../config');
const { ping, collections } = require('../db');
const { heartbeat, count } = require('../retrieval');
const { loadRules } = require('../eligibility/rules');

const router = express.Router();

router.get('/health', async (_req, res) => {
  const [mongo, chroma] = await Promise.all([ping(), heartbeat()]);
  let schemes = 0;
  try {
    schemes = await collections.schemes().countDocuments();
  } catch {
    schemes = 0;
  }
  const rules = loadRules();
  const reviewed = Object.values(rules).filter((r) => r.reviewed).length;

  const status = mongo ? (chroma ? 'ok' : 'degraded') : 'error';
  res.status(mongo ? 200 : 503).json({
    status,
    services: {
      mongodb: mongo ? 'up' : 'down',
      chroma: chroma ? 'up' : 'down (lexical fallback active)',
      llm: config.groqApiKey ? 'configured' : 'missing',
    },
    knowledge_base: {
      schemes,
      embedded_documents: await count(),
      rules_total: Object.keys(rules).length,
      rules_reviewed: reviewed,
    },
    config: {
      model: config.groqModel,
      top_k: config.defaultTopK,
      collection: config.chromaCollection,
      env: config.env,
    },
  });
});

module.exports = router;
