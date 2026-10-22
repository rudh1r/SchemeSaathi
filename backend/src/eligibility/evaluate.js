/**
 * Deterministic eligibility evaluator.
 *
 * Three outcome classes, as defined in the paper (§4.4 / §6.5):
 *   Eligible                – every mandatory condition is satisfied
 *   Ineligible              – at least one mandatory condition is contradicted
 *   Insufficient Information – nothing is contradicted, but at least one
 *                              mandatory condition cannot be checked
 *
 * A missing attribute is never coerced into "satisfied". Conditions marked
 * `optional: true` are reported for context only and do not change the class.
 */

const { ATTR_QUESTIONS } = require('./profile');

const OPS = {
  eq: (value, target) => String(value).toLowerCase() === String(target).toLowerCase(),
  neq: (value, target) => String(value).toLowerCase() !== String(target).toLowerCase(),
  in: (value, targets) => toArray(targets).some((t) => String(t).toLowerCase() === String(value).toLowerCase()),
  not_in: (value, targets) => !toArray(targets).some((t) => String(t).toLowerCase() === String(value).toLowerCase()),
  gte: (value, target) => Number(value) >= Number(target),
  lte: (value, target) => Number(value) <= Number(target),
  between: (value, [min, max]) => Number(value) >= Number(min) && Number(value) <= Number(max),
  is_true: (value) => value === true,
  is_false: (value) => value === false,
  exists: (value) => value !== undefined && value !== null && value !== '',
  matches: (value, targets) => {
    const haystack = String(value).toLowerCase();
    return toArray(targets).some((t) => haystack.includes(String(t).toLowerCase()));
  },
  not_matches: (value, targets) => {
    const haystack = String(value).toLowerCase();
    return !toArray(targets).some((t) => haystack.includes(String(t).toLowerCase()));
  },
};

function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

function formatValue(value) {
  if (value === undefined || value === null || value === '') return 'not provided';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (typeof value === 'number') {
    if (value >= 100000) return `₹${(value / 100000).toFixed(value % 100000 === 0 ? 0 : 2)} lakh`;
    if (value >= 1000) return value.toLocaleString('en-IN');
  }
  return String(value);
}

function evaluateCondition(condition, attributes) {
  const { attr, op, value, label, optional } = condition;
  const actual = attributes[attr];

  const base = {
    attr,
    op,
    label: label || `${attr} ${op} ${JSON.stringify(value)}`,
    expected: value,
    profileValue: actual,
    optional: Boolean(optional),
  };

  if (op === 'any_of') {
    // value: array of alternative condition-groups (each group is ANDed)
    const groups = toArray(value);
    let sawUnknown = false;
    for (const group of groups) {
      const results = toArray(group).map((c) => evaluateCondition({ ...c, optional: true }, attributes));
      if (results.every((r) => r.state === 'satisfied')) {
        return { ...base, state: 'satisfied', detail: `matched: ${results.map((r) => r.label).join(' AND ')}` };
      }
      if (results.some((r) => r.state === 'unknown')) sawUnknown = true;
    }
    if (sawUnknown) return { ...base, state: 'unknown', detail: 'needs one of the alternative conditions to be confirmed' };
    return { ...base, state: 'violated', detail: 'none of the alternatives are met' };
  }

  if (actual === undefined || actual === null || actual === '') {
    return { ...base, state: 'unknown', detail: 'not enough information in the profile' };
  }

  const fn = OPS[op];
  let ok = false;
  try {
    ok = Boolean(fn(actual, value));
  } catch {
    ok = false;
  }

  return {
    ...base,
    state: ok ? 'satisfied' : 'violated',
    detail: ok
      ? `${label || attr}: ${formatValue(actual)}`
      : `${label || attr}: profile has ${formatValue(actual)}`,
  };
}

/**
 * Evaluate one scheme's rules against normalised profile attributes.
 * @param {object} scheme Mongo scheme document
 * @param {object} attributes output of normaliseProfile().attributes
 */
function evaluateScheme(scheme, attributes) {
  const rules = scheme.eligibility_rules;
  const conditions = rules?.conditions || [];

  const satisfied = [];
  const violated = [];
  const unresolved = [];

  if (conditions.length === 0) {
    return {
      schemeId: scheme._id,
      schemeName: scheme.scheme_name,
      status: rules?.reviewed ? 'Insufficient Information' : 'Eligible',
      satisfied,
      violated,
      unresolved: rules?.reviewed
        ? []
        : [{ attr: 'rules', label: 'This scheme has no machine-checkable conditions yet', question: 'Please confirm the details with the official source.' }],
      coverage: 0,
      confidence: rules?.reviewed ? 0.3 : 0.5,
      reviewed: Boolean(rules?.reviewed),
      summary: rules?.reviewed
        ? 'Conditions for this scheme have not been encoded yet, so eligibility cannot be checked automatically.'
        : 'No restrictive conditions are recorded for this scheme, so it is open to all applicants.',
    };
  }

  for (const condition of conditions) {
    const result = evaluateCondition(condition, attributes);
    if (result.state === 'satisfied') satisfied.push(describe(result));
    else if (result.state === 'violated') violated.push(describe(result));
    else unresolved.push({ ...describe(result), question: condition.question || ATTR_QUESTIONS[condition.attr] || `Please provide: ${result.label}` });
  }

  const mandatory = (list) => list.filter((item) => !item.optional);
  const hardViolated = mandatory(violated);
  const hardUnresolved = mandatory(unresolved);
  const hardSatisfied = mandatory(satisfied);
  const totalMandatory = hardViolated.length + hardUnresolved.length + hardSatisfied.length;

  let status;
  if (hardViolated.length > 0) status = 'Ineligible';
  else if (hardUnresolved.length > 0) status = 'Insufficient Information';
  else status = 'Eligible';

  const coverage = totalMandatory === 0 ? 1 : hardSatisfied.length / totalMandatory;
  const confidence = status === 'Ineligible' ? 1 : Number((status === 'Eligible' ? coverage : coverage).toFixed(2));

  return {
    schemeId: scheme._id,
    schemeName: scheme.scheme_name,
    status,
    satisfied,
    violated,
    unresolved,
    coverage: Number(coverage.toFixed(2)),
    confidence,
    reviewed: Boolean(rules?.reviewed),
    summary: summarise(status, hardSatisfied, hardViolated, hardUnresolved),
  };
}

function describe(result) {
  return {
    attr: result.attr,
    label: result.label,
    expected: result.expected,
    profileValue: result.profileValue,
    optional: result.optional,
    detail: result.detail,
  };
}

function summarise(status, satisfied, violated, unresolved) {
  if (status === 'Ineligible') {
    return `Does not meet ${violated.length} mandatory condition${violated.length === 1 ? '' : 's'}: ${violated.map((v) => v.label).join('; ')}.`;
  }
  if (status === 'Insufficient Information') {
    return `All checked conditions are met, but ${unresolved.length} condition${unresolved.length === 1 ? '' : 's'} could not be verified: ${unresolved.map((u) => u.label).join('; ')}.`;
  }
  return `Meets all ${satisfied.length} checked condition${satisfied.length === 1 ? '' : 's'}.`;
}

/** Order results so the most useful ones surface first. */
const STATUS_ORDER = { Eligible: 0, 'Insufficient Information': 1, Ineligible: 2 };

function rankAssessments(assessments) {
  return [...assessments].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    if (a.status === 'Ineligible' && b.status === 'Ineligible') return a.violated.length - b.violated.length;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return String(a.schemeName).localeCompare(String(b.schemeName));
  });
}

module.exports = { evaluateScheme, evaluateCondition, rankAssessments, formatValue, OPS };
