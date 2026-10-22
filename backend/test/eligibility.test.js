/**
 * Unit tests for the deterministic eligibility engine.
 *
 * These tests encode the central claim of the project: a missing attribute is
 * never treated as satisfied, and a single contradicted mandatory condition is
 * enough to mark a scheme ineligible. Run with `npm test` from backend/.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { normaliseProfile } = require('../src/eligibility/profile');
const { extractProfileFromText } = require('../src/eligibility/text-profile');
const { evaluateScheme, evaluateCondition, rankAssessments } = require('../src/eligibility/evaluate');
const rules = require('../src/eligibility/rules.json');

const scheme = (conditions, extra = {}) => ({
  _id: 'x',
  scheme_name: 'Test Scheme',
  eligibility_rules: { reviewed: true, conditions },
  ...extra,
});

test('normaliseProfile converts units, aliases and keeps missing values missing', () => {
  const { attributes } = normaliseProfile({
    age: '45',
    sex: 'F',
    state: 'mh',
    residence_area: 'village',
    category: 'OBC',
    income: '1.5 lakh',
    occupation: 'Farmer',
    land_hectares: 1,
  });

  assert.equal(attributes.age, 45);
  assert.equal(attributes.gender, 'female');
  assert.equal(attributes.state, 'Maharashtra');
  assert.equal(attributes.area, 'rural');
  assert.equal(attributes.category, 'obc');
  assert.equal(attributes.income, 150000);
  assert.equal(attributes.monthly_income, 12500);
  // 1 hectare ≈ 2.471 acres
  assert.equal(attributes.land_acres, 2.471);
  assert.equal(attributes.land_hectares, 1);

  const empty = normaliseProfile({}).attributes;
  assert.equal(empty.age, undefined);
  assert.equal(empty.income, undefined);
  assert.equal(empty.state, undefined);
});

test('normaliseProfile derives occupation and disability only from documented evidence', () => {
  const farmer = normaliseProfile({ land_acres: 3 }).attributes;
  assert.equal(farmer.occupation, 'Farmer');
  assert.equal(farmer.land_owned, true);

  const udid = normaliseProfile({ has_udid_card: true }).attributes;
  assert.equal(udid.disability_percent, 40);

  const noEvidence = normaliseProfile({}).attributes;
  assert.equal(noEvidence.disability_percent, undefined);
  assert.equal(noEvidence.occupation, undefined);
});

test('Eligible only when every mandatory condition is satisfied', () => {
  const result = evaluateScheme(
    scheme([
      { attr: 'age', op: 'gte', value: 18, label: '18+' },
      { attr: 'income', op: 'lte', value: 200000, label: 'income under 2 lakh' },
    ]),
    { age: 30, income: 150000 },
  );

  assert.equal(result.status, 'Eligible');
  assert.equal(result.violated.length, 0);
  assert.equal(result.unresolved.length, 0);
  assert.equal(result.coverage, 1);
});

test('a single violated condition makes the scheme Ineligible', () => {
  const result = evaluateScheme(
    scheme([
      { attr: 'age', op: 'between', value: [18, 40], label: '18-40 years' },
      { attr: 'occupation', op: 'matches', value: 'farmer', label: 'Farmer' },
    ]),
    { age: 45, occupation: 'Farmer' },
  );

  assert.equal(result.status, 'Ineligible');
  assert.equal(result.violated.length, 1);
  assert.match(result.summary, /Does not meet/);
});

test('an unverifiable condition yields Insufficient Information, never Eligible', () => {
  const result = evaluateScheme(
    scheme([
      { attr: 'age', op: 'gte', value: 18, label: '18+' },
      { attr: 'has_bank_account', op: 'is_true', value: true, label: 'Has a bank account' },
    ]),
    { age: 30 },
  );

  assert.equal(result.status, 'Insufficient Information');
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.unresolved[0].attr, 'has_bank_account');
});

test('missing profile values are never coerced into a satisfied condition', () => {
  const result = evaluateCondition({ attr: 'income', op: 'lte', value: 100000 }, {});
  assert.equal(result.state, 'unknown');
});

test('optional conditions are reported but do not change the class', () => {
  const result = evaluateScheme(
    scheme([
      { attr: 'age', op: 'gte', value: 18, label: '18+' },
      { attr: 'has_lpg', op: 'is_true', value: true, label: 'Already has LPG', optional: true },
    ]),
    { age: 30 },
  );

  assert.equal(result.status, 'Eligible');
  assert.equal(result.unresolved.length, 1);
  assert.equal(result.unresolved[0].optional, true);
});

test('any_of accepts one matching alternative group', () => {
  const condition = {
    attr: 'category',
    op: 'any_of',
    value: [[{ attr: 'category', op: 'in', value: ['sc', 'st'] }], [{ attr: 'bpl', op: 'is_true', value: true }]],
    label: 'SC/ST or BPL household',
  };

  assert.equal(evaluateCondition(condition, { category: 'sc' }).state, 'satisfied');
  assert.equal(evaluateCondition(condition, { bpl: true }).state, 'satisfied');
  // General category alone is not enough: the BPL alternative is still unknown.
  assert.equal(evaluateCondition(condition, { category: 'general' }).state, 'unknown');
  // Every alternative is contradicted -> violated.
  assert.equal(evaluateCondition(condition, { category: 'general', bpl: false }).state, 'violated');
  // Unknown everywhere means the alternative cannot be decided yet.
  assert.equal(evaluateCondition(condition, {}).state, 'unknown');
});

test('reviewed scheme without encoded conditions stays Insufficient', () => {
  const result = evaluateScheme(scheme([]), { age: 30 });
  assert.equal(result.status, 'Insufficient Information');
  assert.equal(result.reviewed, true);
});

test('unreviewed scheme without conditions is open to all', () => {
  const result = evaluateScheme(
    {
      _id: 'y',
      scheme_name: 'Universal Scheme',
      eligibility_rules: { reviewed: false, conditions: [], source: 'auto' },
    },
    {},
  );
  assert.equal(result.status, 'Eligible');
  assert.equal(result.reviewed, false);
});

test('rankAssessments orders Eligible, then Insufficient, then Ineligible', () => {
  const ranked = rankAssessments([
    { schemeName: 'C', status: 'Ineligible', violated: [1, 2], coverage: 0.2 },
    { schemeName: 'A', status: 'Eligible', violated: [], coverage: 1 },
    { schemeName: 'B', status: 'Insufficient Information', violated: [], coverage: 0.5 },
  ]);

  assert.deepEqual(ranked.map((a) => a.schemeName), ['A', 'B', 'C']);
});

test('rules.json covers the whole knowledge base with 49 hand-verified schemes', () => {
  const names = Object.keys(rules);
  assert.equal(names.length, 112);

  const reviewed = names.filter((name) => rules[name].reviewed);
  assert.equal(reviewed.length, 49);

  for (const name of names) {
    const rule = rules[name];
    assert.ok(Array.isArray(rule.conditions), `${name} must have a conditions array`);
    assert.ok(['curated', 'auto'].includes(rule.source), `${name} has an unknown source`);
  }
});

test('free-text messages yield the attributes needed by the rule engine', () => {
  const profile = extractProfileFromText(
    'I am a 45 year old farmer in Maharashtra with 1.5 acres of land.',
  );
  assert.equal(profile.age, 45);
  assert.equal(profile.occupation, 'Farmer');
  assert.equal(profile.state, 'Maharashtra');
  assert.equal(profile.land_acres, 1.5);
  assert.equal(profile.area, undefined);
});

test('free-text extraction handles income units, category and area without guessing', () => {
  const { attributes } = normaliseProfile(
    extractProfileFromText(
      'I am a 45-year-old widow, OBC, annual income 1.5 lakh, living in rural Bihar, BPL household.',
    ),
  );

  assert.equal(attributes.age, 45);
  assert.equal(attributes.gender, 'female');
  assert.equal(attributes.marital_status, 'widowed');
  assert.equal(attributes.category, 'obc');
  assert.equal(attributes.income, 150000);
  assert.equal(attributes.state, 'Bihar');
  assert.equal(attributes.area, 'rural');
  assert.equal(attributes.bpl, true);
});

test('free-text extraction does not invent attributes from vague messages', () => {
  assert.deepEqual(extractProfileFromText('I need help with a pension scheme.'), {});
  // "up" in ordinary prose must not become Uttar Pradesh.
  assert.equal(extractProfileFromText('I want to set up a small business.').state, undefined);
  assert.equal(extractProfileFromText('I live in UP.').state, 'Uttar Pradesh');
  assert.equal(extractProfileFromText('My son is a goalkeeper.').state, undefined);
});

test('every rule maps to a real scheme in data/schemes.json', () => {
  const dataPath = path.join(__dirname, '..', '..', 'data', 'schemes.json');
  if (!fs.existsSync(dataPath)) {
    assert.ok(true, 'dataset not present in this checkout');
    return;
  }

  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  const schemes = Array.isArray(data) ? data : data.schemes || [];
  const known = new Set(schemes.map((s) => s.scheme_name));

  const missing = Object.keys(rules).filter((name) => !known.has(name));
  assert.deepEqual(missing, [], 'rules reference schemes that are not in the dataset');

  const withoutRules = [...known].filter((name) => !rules[name]);
  assert.deepEqual(withoutRules, [], 'some schemes have no rule entry');
});
