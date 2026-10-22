/**
 * Automatic rule derivation for schemes that have no hand-verified rules yet.
 *
 * Only unambiguous, explicitly stated constraints are extracted. Anything
 * uncertain is left out, which keeps the engine conservative: a scheme with an
 * unparsed condition becomes "Insufficient Information" only if a rule exists,
 * so the fallback is never a false "Eligible".
 */

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Puducherry', 'Chandigarh',
];

const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

function parseAge(text) {
  const s = clean(text);
  if (!s || /no specific|no age|not applicable|all ages/i.test(s)) return null;

  const range = s.match(/(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*(?:years|yrs)?/i);
  if (range) {
    const min = Number(range[1]);
    const max = Number(range[2]);
    if (min >= 0 && max > min && max <= 120) {
      return { attr: 'age', op: 'between', value: [min, max], label: `Age between ${min} and ${max} years` };
    }
  }

  const plus = s.match(/(\d{1,2})\s*\+/) || s.match(/(?:above|at least)\s+(\d{1,2})/i);
  if (plus) {
    const min = Number(plus[1]);
    return { attr: 'age', op: 'gte', value: min, label: `Age ${min} years or above` };
  }

  const below = s.match(/(?:below|under|up to|upto)\s+(\d{1,2})\s*(?:years|yrs)/i);
  if (below) {
    const max = Number(below[1]);
    return { attr: 'age', op: 'lte', value: max, label: `Age up to ${max} years` };
  }
  return null;
}

function parseAmount(raw) {
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return null;
  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseIncome(text) {
  const s = clean(text);
  if (!s || /no (specific )?(income )?limit|not applicable|no income limit/i.test(s)) return null;

  if (/below poverty line|bpl|secc/i.test(s)) {
    return { attr: 'bpl', op: 'is_true', value: true, label: 'Below poverty line / SECC-listed household' };
  }

  const money = s.match(/(?:rs\.?|₹)\s*([\d,]+)/i) || s.match(/up to\s+([\d,]+)/i);
  if (!money) return null;
  const amount = parseAmount(money[1]);
  if (!amount) return null;

  const monthly = /month|per month|monthly/i.test(s);
  const value = monthly ? amount * 12 : amount;
  return {
    attr: 'income',
    op: 'lte',
    value,
    label: monthly ? `Monthly income up to ₹${amount.toLocaleString('en-IN')}` : `Annual family income up to ₹${value.toLocaleString('en-IN')}`,
  };
}

function parseCategory(...texts) {
  const s = clean(texts.join(' ')).toLowerCase();
  const categories = [];
  if (/\bscheduled caste|\bsc\b/.test(s)) categories.push('sc');
  if (/\bscheduled tribe|\bst\b/.test(s)) categories.push('st');
  if (/\bobc\b|other backward/.test(s)) categories.push('obc');
  if (/\bews\b/.test(s)) categories.push('ews');
  if (/\bminorit/.test(s)) categories.push('minority');
  if (categories.length === 0) return null;
  return { attr: 'category', op: 'in', value: categories, label: `Belongs to ${categories.map((c) => c.toUpperCase()).join(' / ')} category` };
}

function parseGender(text) {
  const s = clean(text).toLowerCase();
  if (/\bwomen\b|\bwoman\b|\bgirl\b|\bfemale\b|\bwidow\b|\bmother\b/.test(s)) {
    return { attr: 'gender', op: 'eq', value: 'female', label: 'Applicant is a woman or girl' };
  }
  return null;
}

function parseDisability(text) {
  const s = clean(text);
  const match = s.match(/(\d{2})\s*%|(\d{2})\s*percent/i);
  if (!match) return null;
  const percent = Number(match[1] || match[2]);
  if (!percent) return null;
  return { attr: 'disability_percent', op: 'gte', value: percent, label: `${percent}% or more disability` };
}

function parseLocation(location, schemeName) {
  const s = clean(location);
  const conditions = [];
  if (!s) return conditions;

  if (/rural/i.test(s) && !/urban/i.test(s)) conditions.push({ attr: 'area', op: 'eq', value: 'rural', label: 'Rural area resident' });
  if (/urban/i.test(s) && !/rural/i.test(s)) conditions.push({ attr: 'area', op: 'eq', value: 'urban', label: 'Urban area resident' });

  if (/all states|all india|across india|all uts/i.test(s)) return conditions;

  const state = STATES.find((name) => s.toLowerCase().includes(name.toLowerCase())) ||
    STATES.find((name) => clean(schemeName).toLowerCase().includes(name.toLowerCase()));
  if (state) conditions.push({ attr: 'state', op: 'eq', value: state, label: `Resident of ${state}` });
  return conditions;
}

function parseOccupation(occupation, other) {
  const s = clean(occupation).toLowerCase();
  const conditions = [];
  if (/farmer|agricultur/.test(s)) conditions.push({ attr: 'occupation', op: 'matches', value: ['farmer', 'agricultur'], label: 'Farmer or agricultural household' });
  else if (/student/.test(s)) conditions.push({ attr: 'is_student', op: 'is_true', value: true, label: 'Currently a student' });
  else if (/vendor/.test(s)) conditions.push({ attr: 'occupation', op: 'matches', value: ['vendor'], label: 'Street vendor' });
  else if (/artisan|craft/.test(s)) conditions.push({ attr: 'trade', op: 'exists', value: true, label: 'Engaged in an artisan trade' });

  if (/landowner|landholding|own cultivable land/i.test(clean(other))) {
    conditions.push({ attr: 'land_owned', op: 'is_true', value: true, label: 'Owns cultivable land' });
  }
  if (/no lpg|lpg connection/i.test(clean(other)) && /without|lack|not have/i.test(clean(other))) {
    conditions.push({ attr: 'has_lpg', op: 'is_false', value: false, label: 'No existing LPG connection' });
  }
  if (/owns? a pucca|do not own|should not own/i.test(clean(other)) && /house/i.test(clean(other))) {
    conditions.push({ attr: 'owns_pucca_house', op: 'is_false', value: false, label: 'Does not own a pucca house' });
  }
  return conditions;
}

function deriveRules(scheme) {
  const e = scheme.eligibility || {};
  const conditions = [
    parseAge(e.age_requirement),
    parseIncome(e.income_requirement),
    parseGender(`${e.occupation || ''} ${e.other_conditions || ''} ${e.description || ''}`),
    parseCategory(e.other_conditions, e.occupation),
    parseDisability(e.other_conditions),
    ...parseLocation(e.location, scheme.scheme_name),
    ...parseOccupation(e.occupation, e.other_conditions),
  ].filter(Boolean);

  // De-duplicate identical attr+op+value tuples.
  const seen = new Set();
  const unique = conditions.filter((c) => {
    const key = `${c.attr}|${c.op}|${JSON.stringify(c.value)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    reviewed: false,
    source: 'auto',
    conditions: unique.map((c) => ({ ...c, optional: false })),
  };
}

module.exports = { deriveRules };
