/**
 * Rule registry.
 *
 * `rules.json` is produced by `npm run rules` (scripts/build-rules.js) and is a
 * merge of hand-verified rules and automatically derived ones. Keeping it as a
 * generated artefact means the 112-scheme coverage can be rebuilt whenever the
 * knowledge base changes, while the curated file stays reviewable in git.
 */
const fs = require('fs');
const path = require('path');

const RULES_PATH = path.join(__dirname, 'rules.json');
const CURATED_PATH = path.join(__dirname, 'curated-rules.json');

let cache = null;
let loadedAt = 0;

const normaliseName = (name) =>
  String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function loadCurated() {
  return readJSON(CURATED_PATH);
}

function loadRules({ force = false } = {}) {
  const now = Date.now();
  if (cache && !force && now - loadedAt < 30_000) return cache;

  let rules;
  if (fs.existsSync(RULES_PATH)) {
    rules = readJSON(RULES_PATH);
  } else {
    // First run before `npm run rules`: curated schemes still work.
    rules = loadCurated();
  }
  cache = rules;
  loadedAt = now;
  return rules;
}

function getRules(schemeName) {
  const rules = loadRules();
  if (rules[schemeName]) return rules[schemeName];
  const target = normaliseName(schemeName);
  const key = Object.keys(rules).find((name) => normaliseName(name) === target);
  return key ? rules[key] : null;
}

/**
 * Attach `eligibility_rules` to a scheme document (never mutates the input).
 */
function withRules(scheme) {
  if (!scheme) return scheme;
  const rules = getRules(scheme.scheme_name);
  return {
    ...scheme,
    eligibility_rules: rules || { reviewed: false, source: 'missing', conditions: [] },
  };
}

module.exports = { loadRules, getRules, withRules, normaliseName, RULES_PATH, CURATED_PATH, loadCurated };
