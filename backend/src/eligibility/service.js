/**
 * Eligibility service: joins scheme documents with rules and evaluates them.
 */
const { collections } = require('../db');
const { loadRules } = require('./rules');
const { evaluateScheme, rankAssessments } = require('./evaluate');
const { normaliseProfile } = require('./profile');
const { deriveRules } = require('./auto-rules');

const FALLBACK_LABELS = {
  age: 'age',
  income: 'income',
  state: 'state of residence',
  area: 'rural/urban residence',
  category: 'social category',
  gender: 'gender',
  occupation: 'occupation',
};

/** Build a retrieval query out of a structured profile + free-text need. */
function buildSearchText(attributes = {}, need = '') {
  const parts = [];
  if (need) parts.push(need);
  if (attributes.age) parts.push(`${attributes.age} year old`);
  if (attributes.gender) parts.push(attributes.gender);
  if (attributes.occupation) parts.push(attributes.occupation);
  if (attributes.category) parts.push(`${attributes.category.toUpperCase()} category`);
  if (attributes.state) parts.push(`in ${attributes.state}`);
  if (attributes.area) parts.push(`${attributes.area} area`);
  if (attributes.income != null) parts.push(`annual family income ${Math.round(attributes.income)} rupees`);
  if (attributes.land_acres != null) parts.push(`owns ${attributes.land_acres} acres of land`);
  if (attributes.disability_percent) parts.push(`${attributes.disability_percent}% disability`);
  if (attributes.is_student) parts.push('student');
  if (attributes.bpl) parts.push('below poverty line household');
  if (parts.length === 0) parts.push('government welfare schemes');
  return parts.join(', ');
}

function attachRules(schemes) {
  const rules = loadRules();
  return schemes.map((scheme) => {
    if (rules[scheme.scheme_name]) return { ...scheme, eligibility_rules: rules[scheme.scheme_name] };
    return { ...scheme, eligibility_rules: deriveRules(scheme) };
  });
}

/** Evaluate a list of already-hydrated schemes. */
function assessCandidates(schemes, attributes) {
  return rankAssessments(schemes.map((scheme) => evaluateScheme(scheme, attributes)));
}

/** Evaluate every scheme in the knowledge base. */
async function assessAll(rawProfile, { limit } = {}) {
  const { attributes } = normaliseProfile(rawProfile);
  const schemes = await collections.schemes().find({}).toArray();
  const withRulesList = attachRules(schemes);
  const assessments = rankAssessments(withRulesList.map((scheme) => evaluateScheme(scheme, attributes)));

  const byId = new Map(withRulesList.map((s) => [String(s._id), s]));
  const enriched = assessments.map((a) => {
    const scheme = byId.get(String(a.schemeId));
    return {
      ...a,
      scheme: scheme
        ? {
            _id: scheme._id,
            scheme_name: scheme.scheme_name,
            description: scheme.description,
            benefits: scheme.benefits,
            state: scheme.state,
            level: scheme.level,
            category: scheme.category,
            source_url: scheme.source_url,
            application_process: scheme.application_process,
          }
        : null,
    };
  });

  const groups = {
    eligible: enriched.filter((a) => a.status === 'Eligible'),
    insufficient: enriched.filter((a) => a.status === 'Insufficient Information'),
    ineligible: enriched.filter((a) => a.status === 'Ineligible'),
  };

  const trimmed = limit
    ? {
        eligible: groups.eligible.slice(0, limit),
        insufficient: groups.insufficient.slice(0, limit),
        ineligible: groups.ineligible.slice(0, limit),
      }
    : groups;

  return {
    attributes,
    totals: {
      eligible: groups.eligible.length,
      insufficient: groups.insufficient.length,
      ineligible: groups.ineligible.length,
      schemes: enriched.length,
    },
    ...trimmed,
  };
}

/** Missing profile attributes that would most improve the assessment. */
function missingAttributes(assessments) {
  const counts = new Map();
  for (const a of assessments) {
    for (const item of a.unresolved) {
      const key = item.attr;
      const entry = counts.get(key) || { attr: key, question: item.question, count: 0 };
      entry.count += 1;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 5);
}

module.exports = {
  buildSearchText,
  attachRules,
  assessCandidates,
  assessAll,
  missingAttributes,
  normaliseProfile,
  FALLBACK_LABELS,
};
