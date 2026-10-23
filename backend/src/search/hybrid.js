/**
 * Hybrid lexical + semantic retrieval helpers.
 *
 * The dense index is good at paraphrases; BM25 is much stronger on the short,
 * acronym-heavy queries people actually type ("PM-KISAN", "KCC", "PMAY").
 * This module adds:
 *   - a dependency-free BM25 index over the scheme corpus
 *   - reciprocal-rank fusion (RRF) for dense + lexical results
 *   - acronym / alias expansion
 *   - a small Hinglish/Devanagari query bridge
 *
 * It deliberately has no database or network access so it can be unit-tested
 * and reused by the evaluation runner.
 */

const STOPWORDS = new Set(
  (
    'a an the and or of to in for on with is are am i my me can do does how what which who ' +
    'get any from at by it this that be as have has not no if so was were will would should ' +
    'could scheme schemes government help please tell give want need about under over into ' +
    'your you we our us they them he she his her their there here also more most some such'
  ).split(/\s+/),
);

/**
 * Common Hinglish and Devanagari words mapped to the English terms used in the
 * scheme corpus. This is intentionally a bridge, not a full translator: it
 * improves recall for common queries without making a second LLM call.
 */
const HINGLISH_TERMS = {
  kisan: 'farmer',
  kisaan: 'farmer',
  kheti: 'farming agriculture',
  khet: 'farm land',
  khethi: 'farming agriculture',
  chhatravriti: 'scholarship',
  chatravriti: 'scholarship',
  scholarship: 'scholarship',
  padhai: 'education study',
  shiksha: 'education',
  aawas: 'housing home',
  awas: 'housing home',
  ghar: 'housing home',
  makan: 'housing home',
  ilaaj: 'health treatment',
  ilaj: 'health treatment',
  dawai: 'health medicine',
  swasthya: 'health',
  pension: 'pension',
  penshan: 'pension',
  budhapa: 'old age pension',
  budhiya: 'old age woman',
  budhi: 'old age woman',
  vridha: 'old age',
  vidhwa: 'widow',
  widow: 'widow',
  beti: 'girl daughter',
  kanya: 'girl daughter',
  behen: 'woman sister',
  didi: 'woman sister',
  mahila: 'woman',
  aurat: 'woman',
  viklang: 'disability disabled',
  divyang: 'disability disabled',
  rojgar: 'employment job',
  rozgar: 'employment job',
  naukri: 'employment job',
  karigar: 'artisan craftsperson',
  shilpkar: 'artisan craftsperson',
  gaon: 'rural village',
  gram: 'rural village',
  sheher: 'urban city',
  shahar: 'urban city',
  garib: 'poor below poverty line',
  gareeb: 'poor below poverty line',
  rin: 'loan',
  rinn: 'loan',
  karz: 'loan',
  sahayata: 'support assistance',
  sahayta: 'support assistance',
  subsidy: 'subsidy',
  bima: 'insurance',
  bime: 'insurance',
  anusuchit: 'scheduled',
  janjati: 'tribe tribal',
  'अनुसूचित': 'scheduled',
  'जनजाति': 'tribe tribal',
  'किसान': 'farmer',
  'खेती': 'farming agriculture',
  'खेत': 'farm land',
  'छात्रवृत्ति': 'scholarship',
  'पढ़ाई': 'education study',
  'शिक्षा': 'education',
  'आवास': 'housing home',
  'घर': 'housing home',
  'इलाज': 'health treatment',
  'दवाई': 'health medicine',
  'स्वास्थ्य': 'health',
  'पेंशन': 'pension',
  'बेटी': 'girl daughter',
  'महिला': 'woman',
  'विकलांग': 'disability disabled',
  'दिव्यांग': 'disability disabled',
  'रोजगार': 'employment job',
  'नौकरी': 'employment job',
  'कारीगर': 'artisan craftsperson',
  'गांव': 'rural village',
  'शहर': 'urban city',
  'गरीब': 'poor below poverty line',
  'पैसा': 'money income',
  'पैसे': 'money income',
  'राशन': 'ration food',
  'विधवा': 'widow',
  'ऋण': 'loan',
  'सहायता': 'support assistance',
  'सब्सिडी': 'subsidy',
  'बीमा': 'insurance',
};

/** Phrase-level expansions that disambiguate common paraphrases. */
const PHRASE_EXPANSIONS = [
  [/\broadside (?:vendor|seller|hawker)s?\b/gi, 'street vendor PM SVANidhi'],
  [/\bstreet vendor(?:s)?\b/gi, 'street vendor PM SVANidhi'],
  [/\b(?:household )?latrine(?:s)?\b/gi, 'toilet Swachh Bharat Mission Gramin'],
  [/\bcold storage\b/gi, 'cold storage Agriculture Infrastructure Fund'],
  [/\bfirst home\b/gi, 'first home PMAY home loan interest subsidy'],
  [/\bhome loan (?:interest )?subsid(?:y|ies)\b/gi, 'PMAY home loan interest subsidy CLSS'],
  [/\bhealth cent(?:re|er)s?\b/gi, 'Ayushman Arogya Mandir health and wellness centre'],
  [/\bwellness cent(?:re|er)s?\b/gi, 'Ayushman Arogya Mandir health and wellness centre'],
  [/\bskill(?:ed)? training\b/gi, 'skill training PMKVY'],
  [/\bvocational training\b/gi, 'vocational training PMKVY'],
  [/\bgirl child\b/gi, 'girl child Sukanya Samriddhi'],
  [/\bnewborn girl\b/gi, 'newborn girl Sukanya Samriddhi Beti Bachao'],
  [/\bdisabled (?:adult|person|people)\b/gi, 'disability pension Indira Gandhi National Disability Pension'],
  [/\bhighest priority ration card\b/gi, 'Antyodaya Anna Yojana'],
  [/\bscheduled caste\b/gi, 'Scheduled Caste PM-AJAY'],
  [/\bself employment loan\b/gi, 'self employment loan DAY-NULM'],
  [/\burban poor\b/gi, 'urban poor DAY-NULM'],
  [/\bgroup enterprise loan(?:s)?\b/gi, 'group enterprise loan DAY-NULM'],
  [/\bpmjay\b/gi, 'Ayushman Bharat PM-JAY'],
  [/\bpm-jay\b/gi, 'Ayushman Bharat PM-JAY'],
  [/\bpmkisan\b/gi, 'PM-KISAN'],
  [/\bpm kisan\b/gi, 'PM-KISAN'],
  [/\bkcc\b/gi, 'Kisan Credit Card'],
  [/\bmudra\b/gi, 'Mudra loan'],
  [/\bpmegp\b/gi, 'PMEGP Prime Minister Employment Generation Programme'],
  [/\bpmkvy\b/gi, 'PMKVY Pradhan Mantri Kaushal Vikas Yojana'],
  [/\bpmay\b/gi, 'PMAY Pradhan Mantri Awas Yojana'],
  [/\bcsss\b/gi, 'Central Sector Scholarship Scheme'],
];

/** Extra aliases for schemes whose acronym is not inside parentheses. */
const SCHEME_ALIAS_HINTS = [
  { test: /pm-kisan/i, aliases: ['pm kisan', 'kisan samman nidhi', 'kisan', 'farmer income support'] },
  { test: /pradhan mantri awas yojana|pmay/i, aliases: ['pmay', 'awas yojana', 'housing subsidy', 'home loan subsidy', 'clss'] },
  { test: /ayushman bharat pm-jay/i, aliases: ['pmjay', 'pm-jay', 'ayushman bharat', 'health insurance'] },
  { test: /ayushman arogya mandir/i, aliases: ['health and wellness centre', 'wellness centre', 'health centre'] },
  { test: /pm svanidhi/i, aliases: ['svanidhi', 'street vendor loan', 'vendor loan'] },
  { test: /kisan credit card/i, aliases: ['kcc', 'kisan credit'] },
  { test: /pmegp|employment generation programme/i, aliases: ['pmegp', 'employment generation', 'kvic subsidy'] },
  { test: /kaushal vikas yojana|pmkvy/i, aliases: ['pmkvy', 'skill training', 'vocational training'] },
  { test: /central sector scholarship/i, aliases: ['csss', 'central scholarship'] },
  { test: /sukanya samriddhi/i, aliases: ['sukanya', 'girl child savings', 'beti'] },
  { test: /beti bachao/i, aliases: ['beti bachao', 'girl child'] },
  { test: /day-nulm|national urban livelihoods/i, aliases: ['day nulm', 'nulm', 'urban livelihood'] },
  { test: /agriculture infrastructure fund/i, aliases: ['aif', 'cold storage loan', 'agri infrastructure'] },
  { test: /pm rahat/i, aliases: ['pm rahat', 'road accident'] },
  { test: /yasasvi/i, aliases: ['pm yasasvi', 'yasasvi', 'denotified tribe scholarship'] },
  { test: /antyodaya anna yojana/i, aliases: ['aay', 'antyodaya', 'ration card'] },
  { test: /pm-ajay|anusuchit jaati abhyuday/i, aliases: ['pm ajay', 'pm-ajay', 'scheduled caste development'] },
  { test: /swachh bharat mission.*gramin/i, aliases: ['swachh bharat gramin', 'toilet subsidy'] },
  { test: /kanya sumangala/i, aliases: ['kanya sumangala', 'up girl child'] },
  { test: /indira gandhi national disability pension/i, aliases: ['disability pension', 'disabled pension'] },
  { test: /pm vishwakarma/i, aliases: ['vishwakarma', 'artisan', 'craftsperson'] },
];

function normaliseText(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return (normaliseText(value).match(/[a-z0-9\u0900-\u097f]+/g) || []).filter(
    (word) => word.length > 1 && !STOPWORDS.has(word),
  );
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Expand a user query with Hinglish terms and phrase-level synonyms. */
function expandQuery(query) {
  let text = normaliseText(query);

  for (const [pattern, replacement] of PHRASE_EXPANSIONS) {
    text = text.replace(pattern, replacement);
  }

  for (const [term, replacement] of Object.entries(HINGLISH_TERMS)) {
    // Keep the original token as well: "kisan" is itself a useful lexical
    // signal even after we add the English equivalent "farmer". Latin terms
    // must match whole words; otherwise "gram" would fire on "program" and
    // "rin" on "training".
    const devanagari = /[\u0900-\u097f]/.test(term);
    const pattern = devanagari ? term : `\\b${escapeRegExp(term)}\\b`;
    if (new RegExp(pattern, 'i').test(text)) text = `${text} ${replacement}`;
  }

  return text.replace(/\s+/g, ' ').trim();
}

/** Aliases extracted from a scheme name plus the curated hint table. */
function aliasesFor(scheme) {
  const name = String(scheme?.scheme_name || '');
  const aliases = new Set([name]);

  const withoutParens = name.replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  if (withoutParens) aliases.add(withoutParens);

  for (const match of name.matchAll(/\(([^)]+)\)/g)) {
    const inner = match[1].trim();
    if (!inner) continue;
    aliases.add(inner);
    for (const part of inner.split(/\s*[\/,;]\s*/)) {
      if (part.trim()) aliases.add(part.trim());
    }
  }

  for (const acronym of name.match(/\b[A-Z][A-Z0-9-]{1,}\b/g) || []) {
    aliases.add(acronym);
  }

  for (const hint of SCHEME_ALIAS_HINTS) {
    if (hint.test.test(name)) hint.aliases.forEach((alias) => aliases.add(alias));
  }

  return [...aliases].map((alias) => alias.trim()).filter(Boolean);
}

function documentText(scheme) {
  const eligibility = scheme?.eligibility && typeof scheme.eligibility === 'object'
    ? Object.entries(scheme.eligibility).map(([key, value]) => `${key.replace(/_/g, ' ')}: ${value}`).join('; ')
    : '';
  return [
    ...aliasesFor(scheme),
    scheme?.description,
    scheme?.benefits,
    eligibility,
    scheme?.application_process,
    scheme?.category,
    scheme?.state,
    scheme?.level,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Build a BM25 index.
 * @param {Array<{id: string, text: string}>} docs
 */
function buildBM25(docs) {
  const k1 = 1.5;
  const b = 0.75;
  const n = docs.length;
  const termFreq = docs.map((doc) => {
    const map = new Map();
    for (const token of tokenize(doc.text)) map.set(token, (map.get(token) || 0) + 1);
    return map;
  });
  const lengths = termFreq.map((map) => [...map.values()].reduce((sum, value) => sum + value, 0));
  const averageLength = lengths.reduce((sum, value) => sum + value, 0) / Math.max(n, 1);
  const documentFreq = new Map();
  for (const map of termFreq) {
    for (const token of map.keys()) documentFreq.set(token, (documentFreq.get(token) || 0) + 1);
  }

  function score(query) {
    const tokens = new Set(tokenize(expandQuery(query)));
    return docs
      .map((doc, index) => {
        let value = 0;
        for (const token of tokens) {
          const frequency = termFreq[index].get(token) || 0;
          if (!frequency) continue;
          const df = documentFreq.get(token) || 0;
          const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
          value += (idf * frequency * (k1 + 1)) /
            (frequency + k1 * (1 - b + (b * lengths[index]) / Math.max(averageLength, 1)));
          // A scheme-name/acronym hit is a strong signal for directory search.
          if (normaliseText(doc.name || '').includes(token)) value += idf * 0.8;
        }
        return { id: doc.id, score: value };
      })
      .filter((row) => row.score > 0)
      .sort((left, right) => right.score - left.score);
  }

  return { size: n, score };
}

/**
 * Reciprocal-rank fusion. Scores are summed when an id appears in both lists.
 * @param {string[]} denseIds
 * @param {string[]} lexicalIds
 */
function rrfFuse(denseIds, lexicalIds, { k = 60, denseWeight = 1, lexicalWeight = 1 } = {}) {
  const fused = new Map();
  denseIds.forEach((id, index) => {
    fused.set(id, (fused.get(id) || 0) + denseWeight / (k + index + 1));
  });
  lexicalIds.forEach((id, index) => {
    fused.set(id, (fused.get(id) || 0) + lexicalWeight / (k + index + 1));
  });
  return [...fused.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((left, right) => right.score - left.score);
}

module.exports = {
  STOPWORDS,
  HINGLISH_TERMS,
  PHRASE_EXPANSIONS,
  SCHEME_ALIAS_HINTS,
  normaliseText,
  tokenize,
  expandQuery,
  aliasesFor,
  documentText,
  buildBM25,
  rrfFuse,
};
