const express = require('express');
const { ObjectId } = require('mongodb');
const config = require('../config');
const { collections } = require('../db');
const { hybridSearchSchemes, searchSchemes, lexicalSearchSchemes, heartbeat } = require('../retrieval');
const { attachRules, assessCandidates, buildSearchText, normaliseProfile, missingAttributes } = require('../eligibility/service');
const { extractProfileFromText } = require('../eligibility/text-profile');
const { generateAnswer, streamAnswer } = require('../llm');
const { optionalAuth } = require('../middleware/auth');
const { rateLimit } = require('../middleware/rateLimit');
const { HttpError, str, int, object } = require('../http/validate');

const router = express.Router();

/** Retrieve candidates, preferring hybrid retrieval and degrading safely. */
async function retrieve(queryText, { topK, filters }) {
  if (config.hybridRetrieval) {
    try {
      const schemes = await hybridSearchSchemes(queryText, { topK, filters });
      if (schemes.length > 0) {
        return { schemes, engine: schemes[0]._retrieval || 'hybrid' };
      }
    } catch (err) {
      console.warn('Hybrid retrieval unavailable, trying dense retrieval:', err.message);
    }
  }

  try {
    if (!(await heartbeat())) throw new Error('vector store offline');
    const schemes = await searchSchemes(queryText, { topK, filters });
    if (schemes.length > 0) return { schemes, engine: 'dense-vector' };
  } catch (err) {
    console.warn('Vector retrieval unavailable, using lexical fallback:', err.message);
  }

  const schemes = await lexicalSearchSchemes(queryText, { topK, filters });
  return { schemes, engine: 'lexical-bm25' };
}

async function loadConversation(key) {
  if (!key) return [];
  const doc = await collections.conversations().findOne({ key });
  return doc?.messages || [];
}

async function saveTurn({ key, userId, question, answer, schemes, assessments }) {
  if (!key) return;
  const turns = [
    { role: 'user', content: question, at: new Date() },
    { role: 'assistant', content: answer, at: new Date() },
  ];
  await collections.conversations().updateOne(
    { key },
    {
      $set: { updated_at: new Date(), ...(userId ? { user_id: new ObjectId(userId) } : {}) },
      $push: { messages: { $each: turns, $slice: -20 } },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true },
  );

  if (userId) {
    await collections.queries().insertOne({
      user_id: new ObjectId(userId),
      query_text: question,
      answer,
      scheme_ids: schemes.map((s) => s._id),
      assessments: assessments.map((a) => ({ scheme: a.schemeName, status: a.status })),
      created_at: new Date(),
    });
  }
}

function conversationKey(req, sessionId) {
  if (req.user?.userId) return `user:${req.user.userId}`;
  if (sessionId) return `session:${sessionId}`;
  return null;
}

/**
 * Shared pipeline for /query and /query/stream:
 * retrieve -> evaluate eligibility -> generate grounded explanation.
 */
async function prepare(req) {
  const question = str(req.body?.query ?? req.body?.question, 'Query', { required: true, min: 2, max: 2000 });
  const topK = int(req.body?.topK, 'topK', { min: 1, max: config.maxTopK, fallback: config.defaultTopK });
  const filters = object(req.body?.filters, 'filters');
  const sessionId = str(req.body?.sessionId, 'sessionId', { max: 100 });
  const rawProfile = object(req.body?.profile, 'profile');
  // A typed sentence such as "I am 45, a farmer in Maharashtra with 1.5 acres"
  // is enough to run the rule engine. Facts stated in the current message take
  // precedence; saved profile values fill any attributes the message omits.
  const mergedProfile = { ...extractProfileFromText(question) };
  for (const [key, value] of Object.entries(rawProfile)) {
    if (value === undefined || value === null || value === '') continue;
    if (mergedProfile[key] === undefined || mergedProfile[key] === null || mergedProfile[key] === '') {
      mergedProfile[key] = value;
    }
  }
  const { attributes, original } = normaliseProfile(mergedProfile);

  const searchText = buildSearchText(attributes, question);
  const hasProfile = Object.keys(attributes).length > 0;

  // With a structured profile the rules engine can discard candidates that
  // are definitely ineligible. Retrieve a slightly wider pool, evaluate it,
  // then surface Eligible/Insufficient Information before Ineligible. This
  // keeps a state-specific but irrelevant scheme from crowding out a relevant
  // national scheme in a three-source answer.
  const candidateK = hasProfile ? Math.min(Math.max(topK, 8), config.maxTopK) : topK;
  const { schemes: found, engine } = await retrieve(searchText, { topK: candidateK, filters });
  const candidates = attachRules(found);
  const candidateAssessments = hasProfile ? assessCandidates(candidates, attributes) : [];
  const assessmentById = new Map(candidateAssessments.map((item) => [String(item.schemeId), item]));
  const statusOrder = { Eligible: 0, 'Insufficient Information': 1, Ineligible: 2 };

  const schemes = hasProfile
    ? [...candidates]
        .sort((a, b) => {
          const byStatus =
            (statusOrder[assessmentById.get(String(a._id))?.status] ?? 3) -
            (statusOrder[assessmentById.get(String(b._id))?.status] ?? 3);
          if (byStatus !== 0) return byStatus;
          return (a._rank || 0) - (b._rank || 0);
        })
        .slice(0, Math.max(topK, 3))
        .map((scheme, index) => ({ ...scheme, _rank: index + 1 }))
    : candidates;

  const assessments = hasProfile
    ? schemes.map((scheme) => assessmentById.get(String(scheme._id))).filter(Boolean)
    : [];

  const key = conversationKey(req, sessionId);
  const history = await loadConversation(key);

  return {
    question,
    attributes,
    originalProfile: original,
    schemes,
    assessments,
    history,
    retrieval: { engine, topK, candidates: schemes.length },
    key,
    userId: req.user?.userId || null,
    sessionId,
  };
}

function sourcesPayload(schemes) {
  return schemes.map((s) => ({
    _id: s._id,
    scheme_name: s.scheme_name,
    description: s.description,
    benefits: s.benefits,
    eligibility: s.eligibility,
    application_process: s.application_process,
    source_url: s.source_url,
    state: s.state,
    level: s.level,
    category: s.category,
    _relevance: s._relevance,
    _rank: s._rank,
  }));
}

router.post('/query', optionalAuth, rateLimit(), async (req, res) => {
  const ctx = await prepare(req);

  if (ctx.schemes.length === 0) {
    const answer =
      "I couldn't find any scheme in the knowledge base that matches that description. Try describing your age, occupation, income and state, or ask about a specific type of support (education, farming, housing, health, pension).";
    await saveTurn({ key: ctx.key, userId: ctx.userId, question: ctx.question, answer, schemes: [], assessments: [] });
    return res.json({
      query: ctx.question,
      answer,
      sources: [],
      assessments: [],
      attributes: ctx.attributes,
      missing: [],
      retrieval: ctx.retrieval,
      meta: { model: config.groqModel, grounded: true },
    });
  }

  const { text, model, usage } = await generateAnswer({
    question: ctx.question,
    schemes: ctx.schemes,
    assessments: ctx.assessments,
    profile: ctx.originalProfile,
    history: ctx.history,
  });

  await saveTurn({
    key: ctx.key,
    userId: ctx.userId,
    question: ctx.question,
    answer: text,
    schemes: ctx.schemes,
    assessments: ctx.assessments,
  });

  res.json({
    query: ctx.question,
    answer: text,
    sources: sourcesPayload(ctx.schemes),
    assessments: ctx.assessments,
    attributes: ctx.attributes,
    missing: missingAttributes(ctx.assessments),
    retrieval: ctx.retrieval,
    meta: { model, usage, grounded: true },
  });
});

router.post('/query/stream', optionalAuth, rateLimit(), async (req, res) => {
  const ctx = await prepare(req);

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();

  const send = (event, data) => {
    if (res.writableEnded) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  try {
    send('meta', {
      sources: sourcesPayload(ctx.schemes),
      assessments: ctx.assessments,
      attributes: ctx.attributes,
      missing: missingAttributes(ctx.assessments),
      retrieval: ctx.retrieval,
    });

    if (ctx.schemes.length === 0) {
      const answer =
        "I couldn't find any scheme in the knowledge base that matches that description. Try describing your age, occupation, income and state.";
      send('token', { t: answer });
      send('done', { answer, model: config.groqModel });
      return res.end();
    }

    const { text, model } = await streamAnswer(
      {
        question: ctx.question,
        schemes: ctx.schemes,
        assessments: ctx.assessments,
        profile: ctx.originalProfile,
        history: ctx.history,
      },
      (token) => {
        if (!closed) send('token', { t: token });
      },
    );

    if (!closed) send('done', { answer: text, model });
    res.end();

    await saveTurn({
      key: ctx.key,
      userId: ctx.userId,
      question: ctx.question,
      answer: text,
      schemes: ctx.schemes,
      assessments: ctx.assessments,
    });
  } catch (err) {
    console.error('Streaming query failed:', err.message);
    if (!closed) {
      send('error', { error: 'The response could not be completed. Please try again.' });
      res.end();
    }
  }
});

module.exports = router;
