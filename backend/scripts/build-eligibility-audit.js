#!/usr/bin/env node
/**
 * Build the audited eligibility benchmark.
 *
 * The original 133-case file is kept unchanged for comparability. This script
 * produces:
 *   eligibility_test_cases_v3.json  corrected cases
 *   eligibility_test_audit.json     the reason for every correction
 *
 * Rules for audit decisions:
 *   engine_fix        the rule/profile normaliser was wrong; the label stays.
 *   complete_profile  the case's own rationale supplies an unambiguous missing
 *                     fact (for example, a women-only scheme with no gender);
 *                     that fact is added to the fixture.
 *   relabel           the expected label cannot be derived from the supplied
 *                     facts, so the case is adjudicated to Insufficient
 *                     Information instead of assuming facts.
 *
 * This is intentionally not a "make the engine look good" script: every edit
 * is listed in the audit file with the evidence for it.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'eligibility_test_cases_v2.json');
const TARGET = path.join(ROOT, 'eligibility_test_cases_v3.json');
const AUDIT = path.join(ROOT, 'eligibility_test_audit.json');

const changes = {
  E10: {
    action: 'engine_fix',
    reason: 'The AICTE rule used the general student flag and ignored the stated technical programme. The profile provides "program": "AICTE-approved diploma"; after deriving technical_programme, the intended Eligible verdict is correct.',
  },
  E11: {
    action: 'engine_fix',
    reason: 'The AICTE rule treated any student as technical. The fixture explicitly says "BA (non-technical, non-AICTE)", so the rule now rejects it rather than returning Eligible.',
  },
  E12: {
    action: 'engine_fix',
    reason: 'The two-girls-per-family limit was marked optional even though the case rationale treats it as required. It is now a mandatory condition, so an unknown value correctly yields Insufficient Information.',
  },
  E22: {
    action: 'complete_profile',
    patch: { is_student: true },
    reason: 'CSSS requires current undergraduate/postgraduate study. The fixture rationale describes an otherwise eligible student but omitted the student flag.',
  },
  E41: {
    action: 'relabel',
    reason: 'A "shopkeeper" is not logically equivalent to a non-vendor, and no vending-certificate fact is supplied. The original Ineligible label assumes a fact the fixture does not contain; adjudicated to Insufficient Information.',
  },
  E47: {
    action: 'relabel',
    reason: 'The profile states a software-engineer occupation but provides no notified-trade field. The original Ineligible label relies on an inference the rules do not make; adjudicated to Insufficient Information.',
  },
  E72: {
    action: 'complete_profile',
    patch: { income_tax_payer: false },
    reason: 'Shram Yogi Maandhan requires that the applicant is not an income-tax payer. The rationale describes an eligible unorganised worker but omits this fact.',
  },
  E84: {
    action: 'complete_profile',
    patch: { gender: 'Female' },
    reason: 'Gruha Lakshmi is a women-only scheme; the fixture rationale describes a woman but the gender field was missing.',
  },
  E86: {
    action: 'complete_profile',
    patch: { gender: 'Female' },
    reason: 'Ladli Behna is a women-only scheme; the fixture rationale describes a woman but the gender field was missing.',
  },
  E88: {
    action: 'complete_profile',
    patch: { gender: 'Female', is_student: true },
    reason: 'Kanyashree requires a girl currently in education. The rationale supplies both facts, but the fixture omitted the corresponding fields.',
  },
  E90: {
    action: 'engine_fix',
    reason: 'The Sukanya rule checked the number of girls in the family instead of the number of existing accounts. The fixture supplies existing_accounts: 0, so the rule now matches the actual scheme condition.',
  },
  E92: {
    action: 'complete_profile',
    patch: { existing_accounts: 0 },
    reason: 'The rationale says the family is within the two-account limit but the fixture omitted existing_accounts. The fact is added rather than inferred.',
  },
  E98: {
    action: 'complete_profile',
    patch: { pregnant: true },
    reason: 'JSY requires pregnancy or recent delivery. The rationale describes a delivery, but the field was missing. The facility-delivery condition was also incorrectly optional and is now mandatory.',
  },
  E107: {
    action: 'complete_profile',
    patch: { minority: false, is_student: true },
    reason: 'The scheme requires a notified-minority student. The fixture states a Hindu community and 80% marks but omitted both the minority status and student flag. The intended Ineligible verdict follows from minority: false.',
  },
  E109: {
    action: 'complete_profile',
    patch: { age: 30 },
    reason: 'PM-KUSUM has an age-18 gate. The rationale describes an eligible landowning farmer but omitted age.',
  },
  E118: {
    action: 'complete_profile',
    patch: { age: 30 },
    reason: 'Startup India Seed Fund has an age-18 gate. The rationale describes an eligible founder but omitted age.',
  },
  E123: {
    action: 'engine_fix',
    reason: 'PMEGP accepts Class 8 or above. The fixture says "Class 10", but the rule only listed "10th"; the education alias is now normalised so the intended Eligible verdict is correct.',
  },
  E125: {
    action: 'complete_profile',
    patch: { gender: 'Female' },
    reason: 'Lakshmir Bhandar is a women-only scheme; the fixture rationale describes a woman but the gender field was missing.',
  },
  E127: {
    action: 'complete_profile',
    patch: { gender: 'Female' },
    reason: 'Kalaignar Magalir Urimai Thogai is a women-only scheme; the fixture rationale describes a woman but the gender field was missing.',
  },
};

function main() {
  const cases = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const audit = [];
  const byId = new Map(cases.map((testCase) => [testCase.id, testCase]));

  for (const id of Object.keys(changes)) {
    if (!byId.has(id)) throw new Error(`Audit references unknown case ${id}`);
  }

  const corrected = cases.map((testCase) => {
    const change = changes[testCase.id];
    if (!change) return testCase;

    const entry = {
      id: testCase.id,
      scheme: testCase.scheme,
      original_expected: testCase.ground_truth,
      action: change.action,
      reason: change.reason,
      patch: change.patch || null,
    };

    if (change.action === 'complete_profile') {
      entry.adjudicated_expected = testCase.ground_truth;
      entry.corrected_profile_fields = { ...(testCase.profile_fields || {}), ...(change.patch || {}) };
      audit.push(entry);
      return {
        ...testCase,
        profile_fields: entry.corrected_profile_fields,
        audit: { action: change.action, reason: change.reason },
      };
    }

    if (change.action === 'relabel') {
      entry.adjudicated_expected = 'Insufficient Information';
      audit.push(entry);
      return {
        ...testCase,
        ground_truth: 'Insufficient Information',
        audit: { action: change.action, reason: change.reason },
      };
    }

    entry.adjudicated_expected = testCase.ground_truth;
    audit.push(entry);
    return {
      ...testCase,
      audit: { action: change.action, reason: change.reason },
    };
  });

  const report = {
    generated_at: new Date().toISOString(),
    source: path.basename(SOURCE),
    corrected_dataset: path.basename(TARGET),
    total_cases: cases.length,
    changed_cases: audit.length,
    protocol: {
      engine_fix: 'Rule or normaliser defect; expected label retained.',
      complete_profile: 'Unambiguous missing fact stated in the case rationale; fixture completed.',
      relabel: 'Expected label not derivable from supplied facts; adjudicated to Insufficient Information.',
    },
    changes: audit,
  };

  fs.writeFileSync(TARGET, `${JSON.stringify(corrected, null, 2)}\n`);
  fs.writeFileSync(AUDIT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path.basename(TARGET)} (${corrected.length} cases)`);
  console.log(`Wrote ${path.basename(AUDIT)} (${audit.length} audited changes)`);
}

main();
