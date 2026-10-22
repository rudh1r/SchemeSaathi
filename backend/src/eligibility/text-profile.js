/**
 * Lightweight, deterministic attribute extraction from a chat message.
 *
 * The chat must be able to answer "I am a 45-year-old farmer in Maharashtra
 * with 1.5 acres" with real eligibility verdicts, not only when the structured
 * form was filled in. This extractor only recognises explicit statements; it
 * never guesses. Extracted attributes are merged *under* an explicit profile,
 * so a saved structured profile always wins.
 */
const { STATES } = require('./profile');

const STATE_ALIASES = {
  up: 'Uttar Pradesh', mp: 'Madhya Pradesh', wb: 'West Bengal', tn: 'Tamil Nadu',
  ap: 'Andhra Pradesh', ts: 'Telangana', tg: 'Telangana', mh: 'Maharashtra',
  ka: 'Karnataka', kl: 'Kerala', gj: 'Gujarat', rj: 'Rajasthan', pb: 'Punjab',
  hr: 'Haryana', hp: 'Himachal Pradesh', uk: 'Uttarakhand', od: 'Odisha',
  or: 'Odisha', br: 'Bihar', jh: 'Jharkhand', cg: 'Chhattisgarh', dl: 'Delhi',
  as: 'Assam',
};

const OCCUPATION_PATTERNS = [
  [/farmer|farming|kisan|agricultur|landhold|cultivat/i, 'Farmer'],
  [/student|studying|pursuing (?:a )?(?:degree|diploma|course)|college student|school student/i, 'Student'],
  [/artisan|craftsperson|weaver|potter|blacksmith|carpenter|handicraft|handloom/i, 'Artisan / Craftsperson'],
  [/street vendor|vendor|hawker|small business|shopkeeper|kirana/i, 'Small Business / Street Vendor'],
  [/construction worker|daily wage|labourer|laborer|gig worker|migrant worker/i, 'Gig / Construction Worker'],
  [/homemaker|housewife|home maker/i, 'Homemaker'],
  [/unemployed|job seeker|looking for work/i, 'Unemployed / Job Seeker'],
  [/government employee|govt employee|salaried|private employee|office worker/i, 'Salaried / Government Employee'],
];

function firstNumber(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value)) return value;
    }
  }
  return undefined;
}

function extractAge(text) {
  const value = firstNumber(text, [
    /\b(?:i\s*am|i'm)\s*(?:a|an)?\s*(\d{1,3})\b/i,
    /\b(\d{1,3})[-\s]*(?:years?|yrs?)[-\s]*(?:old|of age)\b/i,
    /\baged?\s*(\d{1,3})\b/i,
    /\bage\s*(?:is|:)?\s*(\d{1,3})\b/i,
  ]);
  return value !== undefined && value > 0 && value < 120 ? value : undefined;
}

function extractIncome(text) {
  const match = text.match(
    /\b(?:income|earn|earning|salary|pension|turnover)\b[^.\d]{0,30}?(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)\s*(lakh|lac|crore|cr|thousand|k)?/i,
  );
  if (!match) return undefined;
  const amount = match[1].replace(/,/g, '');
  const unit = (match[2] || '').toLowerCase();
  if (!unit && Number(amount) < 1000) return undefined; // "income 500" is ambiguous
  return unit ? `${amount} ${unit}` : amount;
}

function extractLand(text) {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(acres?|hectares?|hectare|ha)\b/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  const unit = match[2].toLowerCase();
  if (unit === 'ha' || unit.startsWith('hectare')) return { land_hectares: value };
  return { land_acres: value };
}

function extractState(text) {
  for (const state of STATES) {
    const pattern = new RegExp(`\\b${state.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (pattern.test(text)) return state;
  }
  for (const [alias, state] of Object.entries(STATE_ALIASES)) {
    // Two-letter aliases are only trusted when the user wrote them in caps,
    // otherwise "up" in "set up" would become Uttar Pradesh.
    if (alias.length <= 2) {
      if (new RegExp(`\\b${alias.toUpperCase()}\\b`).test(text)) return state;
    } else if (new RegExp(`\\b${alias}\\b`, 'i').test(text)) {
      return state;
    }
  }
  return undefined;
}

function extractCategory(text) {
  if (/\bscheduled caste\b|\bSC\b/.test(text)) return 'sc';
  if (/\bscheduled tribe\b|\bST\b/.test(text)) return 'st';
  if (/\bOBC\b|other backward class/i.test(text)) return 'obc';
  if (/\bEWS\b|economically weaker section/i.test(text)) return 'ews';
  if (/\bgeneral category\b|\bUR category\b/i.test(text)) return 'general';
  if (/\bminority\b|\bmuslim\b|\bchristian\b|\bsikh\b/i.test(text)) return 'minority';
  return undefined;
}

/**
 * @param {string} text free-text user message
 * @returns {object} raw profile keys understood by normaliseProfile()
 */
function extractProfileFromText(text) {
  if (!text || typeof text !== 'string') return {};
  const message = text.replace(/\s+/g, ' ').trim();
  const profile = {};

  const age = extractAge(message);
  if (age !== undefined) profile.age = age;

  const income = extractIncome(message);
  if (income !== undefined) profile.income = income;

  Object.assign(profile, extractLand(message) || {});

  const state = extractState(message);
  if (state) profile.state = state;

  const category = extractCategory(message);
  if (category) profile.category = category;

  if (/\bwidow(?:ed|er)?\b/i.test(message)) profile.marital_status = 'widowed';
  else if (/\bmarried\b/i.test(message) && !/\bunmarried\b|\bnot married\b/i.test(message)) profile.marital_status = 'married';

  if (/\bfemale\b|\bwoman\b|\bgirl\b|\bmother\b|\bwidow\b/i.test(message)) profile.gender = 'Female';
  else if (/\bmale\b|\bman\b|\bfather\b/i.test(message)) profile.gender = 'Male';
  if (/\btransgender\b/i.test(message)) profile.gender = 'Other';

  for (const [pattern, occupation] of OCCUPATION_PATTERNS) {
    if (pattern.test(message)) {
      profile.occupation = occupation;
      break;
    }
  }

  if (/\brural\b|\bvillage\b|\bgram panchayat\b/i.test(message)) profile.area = 'rural';
  else if (/\burban\b|\bcity\b|\btown\b/i.test(message)) profile.area = 'urban';

  if (/\bbpl\b|below poverty line|\bantyodaya\b|\baay\b/i.test(message)) profile.bpl = true;
  if (/\bpregnan(?:t|cy)\b/i.test(message)) profile.pregnant = true;
  if (/\blandless\b/i.test(message)) profile.land_owned = false;
  else if (/\bown(?:s|ed)?\b[^.]{0,25}\bland\b|\bland\b[^.]{0,15}\bin (?:my|our|the family'?s?) name\b/i.test(message)) {
    profile.land_owned = true;
  }
  if (/\b(?:don'?t|do not|not)\s+pay\s+(?:income\s+)?tax\b/i.test(message)) profile.income_tax_payer = false;
  else if (/\bpay(?:s|ing)?\s+(?:income\s+)?tax\b|\bincome[- ]tax payer\b/i.test(message)) profile.income_tax_payer = true;

  const disability = firstNumber(message, [
    /\b(\d{1,3})\s*%\s*(?:disabilit|disabled|handicap)/i,
    /\b(?:disabilit(?:y|ies)|disabled)\b[^.\d]{0,25}(\d{1,3})\s*%/i,
  ]);
  if (disability !== undefined && disability > 0 && disability <= 100) profile.disability_percent = disability;

  return profile;
}

module.exports = { extractProfileFromText };
