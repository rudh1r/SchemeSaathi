const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { normaliseProfile } = require('../src/eligibility/profile');
const { evaluateScheme } = require('../src/eligibility/evaluate');
const { attachRules } = require('../src/eligibility/service');

const dataPath = path.join(__dirname, '..', '..', 'data', 'schemes.json');
const allSchemes = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const byName = new Map(allSchemes.map((scheme) => [scheme.scheme_name, scheme]));

function assess(name, profile) {
  const raw = byName.get(name);
  assert.ok(raw, `missing fixture scheme: ${name}`);
  const scheme = attachRules([raw])[0];
  const { attributes } = normaliseProfile(profile);
  return { attributes, result: evaluateScheme(scheme, attributes) };
}

test('AICTE Pragati accepts an AICTE-approved diploma profile', () => {
  const { attributes, result } = assess('AICTE Pragati Scholarship for Girls', {
    gender: 'female',
    income: 500000,
    girl_children: 1,
    programme: 'AICTE-approved diploma',
  });

  assert.equal(attributes.technical_programme, true);
  assert.equal(attributes.is_student, true);
  assert.equal(result.status, 'Eligible');
});

test('AICTE Pragati rejects a non-technical BA even when the applicant is a student', () => {
  const { attributes, result } = assess('AICTE Pragati Scholarship for Girls', {
    gender: 'female',
    income: 300000,
    programme: 'BA (non-technical, non-AICTE)',
  });

  assert.equal(attributes.technical_programme, false);
  assert.equal(result.status, 'Ineligible');
  assert.match(result.summary, /technical diploma|technical degree/i);
});

test('PMEGP recognises Class 10 as satisfying the Class 8 education gate', () => {
  const { result } = assess('Pradhan Mantri Employment Generation Programme (PMEGP)', {
    age: 30,
    education_level: 'Class 10',
    project_cost: 1200000,
  });

  assert.equal(result.status, 'Eligible');
});

test('ambiguous programme text stays unknown rather than being guessed', () => {
  const { attributes } = assess('AICTE Pragati Scholarship for Girls', {
    gender: 'female',
    income: 200000,
    programme: 'BSc',
  });

  assert.equal(attributes.technical_programme, undefined);
});
