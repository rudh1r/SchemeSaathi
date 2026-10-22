/**
 * Profile normalisation.
 *
 * The UI sends canonical field names, but evaluation fixtures, old clients and
 * free-form imports use many synonyms (family_income_lakh, monthly_income,
 * community, owns_home, ...). This module maps all of them onto one canonical
 * attribute set and converts units, so the rules engine only ever sees
 * consistent values.
 *
 * Design rule: a missing value stays missing. Nothing is guessed, because the
 * paper's core requirement is that an unchecked condition must surface as
 * "Insufficient Information" rather than be treated as satisfied.
 */

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry',
  'Chandigarh', 'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep',
];

const STATE_ALIASES = {
  up: 'Uttar Pradesh', mp: 'Madhya Pradesh', wb: 'West Bengal', tn: 'Tamil Nadu',
  ap: 'Andhra Pradesh', ts: 'Telangana', tg: 'Telangana', mh: 'Maharashtra',
  ka: 'Karnataka', kl: 'Kerala', gj: 'Gujarat', rj: 'Rajasthan', pb: 'Punjab',
  hr: 'Haryana', hp: 'Himachal Pradesh', uk: 'Uttarakhand', od: 'Odisha', or: 'Odisha',
  br: 'Bihar', jh: 'Jharkhand', cg: 'Chhattisgarh', dl: 'Delhi', as: 'Assam',
  'jammu & kashmir': 'Jammu and Kashmir',
};

const CATEGORY_ALIASES = {
  general: 'general', gen: 'general', ur: 'general', unreserved: 'general',
  obc: 'obc', 'obc-ncl': 'obc', eb: 'obc',
  sc: 'sc', scheduledcaste: 'sc', 'scheduled caste': 'sc',
  st: 'st', scheduledtribe: 'st', 'scheduled tribe': 'st',
  ews: 'ews', ebc: 'ebc', dnt: 'dnt', minority: 'minority',
};

const MINORITY_MARKERS = ['muslim', 'christian', 'sikh', 'buddhist', 'jain', 'parsi', 'minority'];

const BOOLEAN_TRUE = new Set(['true', 'yes', 'y', '1', 'haan', 'ha', 'हाँ']);
const BOOLEAN_FALSE = new Set(['false', 'no', 'n', '0', 'nahi', 'नहीं']);

function toBool(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const s = String(value).trim().toLowerCase();
  if (BOOLEAN_TRUE.has(s)) return true;
  if (BOOLEAN_FALSE.has(s)) return false;
  if (s.includes('not ') || s.startsWith('non') || s.includes('no ')) return false;
  return undefined;
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const s = String(value).trim().toLowerCase().replace(/[₹,\s]/g, '');
  if (!s) return undefined;
  // "Class 9", "10th", "1.5 hectares" -> leading number
  const leading = s.match(/^(?:class)?([\d.]+)/);
  const unitMatch = s.match(/^([\d.]+)(lakh|lac|l|crore|cr|k|thousand)?$/);
  const base = Number(unitMatch ? unitMatch[1] : leading ? leading[1] : NaN);
  if (!Number.isFinite(base)) return undefined;
  const unit = unitMatch ? unitMatch[2] : undefined;
  if (unit === 'lakh' || unit === 'lac' || unit === 'l') return base * 100000;
  if (unit === 'crore' || unit === 'cr') return base * 10000000;
  if (unit === 'k' || unit === 'thousand') return base * 1000;
  return base;
}

function firstDefined(raw, keys) {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null && raw[key] !== '') return raw[key];
  }
  return undefined;
}

function normaliseState(value) {
  if (!value) return undefined;
  const s = String(value).trim().toLowerCase().replace(/\./g, '');
  if (STATE_ALIASES[s]) return STATE_ALIASES[s];
  const hit = STATES.find((state) => state.toLowerCase() === s);
  if (hit) return hit;
  const partial = STATES.find((state) => s.includes(state.toLowerCase()));
  return partial || String(value).trim();
}

function normaliseCategory(value) {
  if (!value) return undefined;
  const key = String(value).trim().toLowerCase().replace(/[^a-z& -]/g, '');
  if (CATEGORY_ALIASES[key]) return CATEGORY_ALIASES[key];
  if (MINORITY_MARKERS.some((m) => key.includes(m))) return 'minority';
  return key || undefined;
}

function normaliseGender(value) {
  if (!value) return undefined;
  const s = String(value).trim().toLowerCase();
  if (['female', 'f', 'woman', 'girl', 'लड़की', 'महिला'].includes(s)) return 'female';
  if (['male', 'm', 'man', 'boy', 'पुरुष', 'लड़का'].includes(s)) return 'male';
  if (s.startsWith('other') || s === 'transgender') return 'other';
  return undefined;
}

function normaliseArea(raw) {
  const explicit = firstDefined(raw, ['area', 'residence_area', 'rural_urban', 'location_type']);
  if (explicit) {
    const s = String(explicit).toLowerCase();
    if (s.includes('rural') || s.includes('village')) return 'rural';
    if (s.includes('urban') || s.includes('city') || s.includes('town')) return 'urban';
  }
  const urban = toBool(raw.urban);
  if (urban === true) return 'urban';
  if (urban === false) return 'rural';
  const location = raw.location ? String(raw.location).toLowerCase() : '';
  if (location.includes('rural')) return 'rural';
  if (location.includes('urban')) return 'urban';
  return undefined;
}

function isStudent(raw, classLevel) {
  const explicit = toBool(firstDefined(raw, ['is_student', 'student']));
  if (explicit !== undefined) return explicit;
  if (classLevel !== undefined) return true;
  const occupation = String(raw.occupation || '').toLowerCase();
  if (/student|pupil|scholar|studying/.test(occupation)) return true;
  const education = [raw.education, raw.education_level, raw.class_or_level, raw.course]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  if (/studying|enrolled|pursuing|class \d|school|college|university|b\.?tech|b\.?sc|b\.?a\b|b\.?com|m\.?tech|m\.?sc|m\.?a\b|mba|diploma|degree|graduation|post.?graduat|intermediate|12th|11th|10th/.test(education)) {
    return true;
  }
  return undefined;
}

function normaliseProfile(input = {}) {
  const raw = input && typeof input === 'object' ? input : {};
  const attributes = {};

  // --- age -------------------------------------------------------------
  const age = toNumber(firstDefined(raw, ['age', 'applicant_age', 'age_years']));
  if (age !== undefined) attributes.age = age;

  // --- gender ----------------------------------------------------------
  const gender = normaliseGender(firstDefined(raw, ['gender', 'sex']));
  if (gender) attributes.gender = gender;

  // --- income (canonical: annual household income in INR) --------------
  let income = toNumber(firstDefined(raw, ['annual_income', 'annual_family_income', 'household_income', 'income']));
  if (income === undefined) {
    const lakh = toNumber(firstDefined(raw, ['family_income_lakh', 'income_lakh', 'annual_income_lakh']));
    if (lakh !== undefined) income = lakh * 100000;
  }
  if (income === undefined) {
    const monthly = toNumber(firstDefined(raw, ['monthly_income', 'monthly_family_income', 'monthly_household_income']));
    if (monthly !== undefined) income = monthly * 12;
  }
  // Some fixtures use parental_income / family_income as an annual figure.
  if (income === undefined) {
    const family = toNumber(firstDefined(raw, ['family_income', 'parental_income', 'parents_income']));
    if (family !== undefined) income = family;
  }
  if (income !== undefined) {
    attributes.income = income;
    attributes.monthly_income = Math.round(income / 12);
  }

  // --- geography -------------------------------------------------------
  const state = normaliseState(firstDefined(raw, ['state', 'residence_state', 'state_ut']));
  if (state) attributes.state = state;
  const area = normaliseArea(raw);
  if (area) attributes.area = area;

  // --- social category -------------------------------------------------
  const category = normaliseCategory(firstDefined(raw, ['category', 'social_category', 'caste_category', 'community', 'caste']));
  if (category) attributes.category = category;
  const minorityFlag = toBool(raw.minority);
  if (minorityFlag !== undefined) attributes.minority = minorityFlag;
  else if (category === 'minority') attributes.minority = true;
  else if (raw.community && MINORITY_MARKERS.some((m) => String(raw.community).toLowerCase().includes(m))) {
    attributes.minority = true;
  }

  // --- occupation ------------------------------------------------------
  const occupation = firstDefined(raw, ['occupation', 'profession', 'job', 'occupation_type']);
  if (occupation) attributes.occupation = String(occupation);

  // --- land ------------------------------------------------------------
  let landAcres = toNumber(firstDefined(raw, ['land_acres', 'land_owned_acres', 'land_holding_acres', 'agricultural_land_acres']));
  if (landAcres === undefined) {
    const hectares = toNumber(firstDefined(raw, ['land_hectares', 'land_owned_hectares']));
    if (hectares !== undefined) landAcres = Number((hectares * 2.47105).toFixed(3));
  }
  if (landAcres !== undefined) {
    attributes.land_acres = landAcres;
    attributes.land_hectares = Number((landAcres / 2.47105).toFixed(3));
  }
  let landOwned = toBool(firstDefined(raw, ['land_owned', 'land_in_own_name', 'owns_land', 'land_ownership']));
  if (landOwned === undefined && landAcres !== undefined) landOwned = landAcres > 0;
  if (landOwned !== undefined) attributes.land_owned = landOwned;
  // Holding farmland is itself evidence of being a farmer.
  if (!attributes.occupation && landAcres !== undefined && landAcres > 0) attributes.occupation = 'Farmer';

  // --- straightforward booleans ----------------------------------------
  const booleanAliases = {
    income_tax_payer: ['income_tax_payer', 'tax_payer', 'taxpayer', 'tax_or_gst_payer', 'gst_payer'],
    has_bank_account: ['has_bank_account', 'bank_account', 'aadhaar_linked_bank', 'bank_account_linked'],
    bpl: ['bpl', 'below_poverty_line', 'in_secc', 'secc_listed', 'bpl_household'],
    owns_pucca_house: ['owns_pucca_house', 'pucca_house', 'owns_pucca'],
    owns_home: ['owns_home', 'homeowner', 'house_owner'],
    has_lpg: ['has_lpg', 'lpg_connection'],
    epfo_member: ['epfo_member', 'epfo_nps_esic', 'epfo_esic', 'formal_sector_employee'],
    other_pension: ['other_pension', 'receiving_pension', 'govt_pension'],
    ration_card: ['ration_card', 'ration_card_holder'],
    orphan: ['orphan'],
    pregnant: ['pregnant', 'expecting'],
    pregnancy_registered: ['pregnancy_registered', 'anc_registered'],
    government_job_in_family: ['govt_job_in_family', 'government_job_in_family', 'govt_employee_in_family'],
    employed_full_time: ['employed', 'full_time_employed', 'employed_full_time'],
    existing_scholarship: ['receiving_other_central_scholarship', 'existing_scholarship', 'other_scholarship'],
    cleared_qualifying_exam: ['cleared_nmms_qualifying_exam', 'cleared_qualifying_exam'],
    dpiit_recognised: ['dpiit', 'dpiit_recognised', 'dpiit_recognized'],
    roof_suitable: ['roof_suitable', 'suitable_roof'],
    vending_certificate: ['vending_certificate', 'certificate_of_vending'],
    greenfield: ['greenfield', 'new_enterprise'],
    age_related_impairment: ['has_age_related_impairment', 'age_related_impairment'],
    retired: ['retired'],
    swasthya_sathi: ['swasthya_sathi', 'swasthya_sathi_card'],
    backward_block: ['backward_block', 'educationally_backward_block'],
    has_udid_card: ['has_udid_card', 'udid_card'],
    disability_certificate: ['disability_certificate'],
    delivery_in_facility: ['delivery_in_facility', 'institutional_delivery'],
    mother: ['mother', 'is_mother'],
  };
  for (const [canonical, keys] of Object.entries(booleanAliases)) {
    const value = toBool(firstDefined(raw, keys));
    if (value !== undefined) attributes[canonical] = value;
  }

  // A ration-card value such as "BPL", "APL" or "AAY" still means the holder
  // has a ration card.
  if (attributes.ration_card === undefined && raw.ration_card) attributes.ration_card = true;
  // A registered pregnancy presupposes a pregnancy.
  if (attributes.pregnant === undefined && attributes.pregnancy_registered === true) attributes.pregnant = true;
  // "greenfield manufacturing" / "new enterprise"
  if (attributes.greenfield === undefined && raw.enterprise_type && /greenfield|new/i.test(String(raw.enterprise_type))) {
    attributes.greenfield = true;
  }

  // "owns_home: true" is also evidence of not being homeless; keep separate
  // from owns_pucca_house rather than conflating the two.

  // --- education -------------------------------------------------------
  const classLevel = toNumber(firstDefined(raw, ['class', 'class_level', 'current_class', 'standard', 'class_or_level']));
  if (classLevel !== undefined) attributes.class_level = classLevel;
  const education = firstDefined(raw, ['education', 'education_level', 'qualification', 'class_or_level', 'course']);
  if (education) attributes.education_level = String(education);
  const marks = toNumber(firstDefined(raw, ['marks_percent', 'percentage', 'marks']));
  if (marks !== undefined) attributes.marks_percent = marks;
  const percentile = toNumber(firstDefined(raw, ['class12_percentile', 'percentile', 'class_12_percentile']));
  if (percentile !== undefined) attributes.class12_percentile = percentile;
  const schoolType = firstDefined(raw, ['school_type', 'institution_type']);
  if (schoolType) attributes.school_type = String(schoolType);
  const student = isStudent(raw, classLevel);
  if (student !== undefined) attributes.is_student = student;

  // --- disability ------------------------------------------------------
  let disability = toNumber(firstDefined(raw, ['disability_percent', 'disability_percentage', 'udid_disability_percent']));
  // A valid UDID card is issued at 40% or above, so possession is treated as
  // documented evidence of the 40% threshold (not as a guess about severity).
  if (disability === undefined && attributes.has_udid_card === true) disability = 40;
  if (disability !== undefined) attributes.disability_percent = disability;

  // --- family / household ---------------------------------------------
  const married = toBool(raw.married);
  const widow = toBool(raw.widow);
  if (widow === true) attributes.marital_status = 'widowed';
  else if (married === true) attributes.marital_status = 'married';
  else if (married === false) attributes.marital_status = 'single';
  else {
    const marital = firstDefined(raw, ['marital_status']);
    if (marital) {
      const s = String(marital).toLowerCase();
      attributes.marital_status = s.includes('widow') ? 'widowed' : s.includes('divorc') ? 'divorced' : s.includes('single') || s.includes('unmarried') ? 'single' : s.includes('married') ? 'married' : s;
    }
  }

  const whichChildRaw = firstDefined(raw, ['which_child', 'child_number']);
  const ORDINALS = { first: 1, second: 2, third: 3, fourth: 4, '1st': 1, '2nd': 2, '3rd': 3 };
  const whichChild = toNumber(whichChildRaw) ?? (typeof whichChildRaw === 'string' ? ORDINALS[whichChildRaw.toLowerCase().trim()] : undefined);
  if (whichChild !== undefined) attributes.which_child = whichChild;
  const daughterAge = toNumber(firstDefined(raw, ['daughter_age', 'girl_child_age', 'child_age']));
  if (daughterAge !== undefined) attributes.daughter_age = daughterAge;
  const girlChildren = toNumber(firstDefined(raw, ['girl_children', 'girls_in_family_applying', 'number_of_girls', 'daughters']));
  if (girlChildren !== undefined) attributes.girl_children = girlChildren;
  const childrenCount = toNumber(firstDefined(raw, ['children', 'children_count', 'number_of_children']));
  if (childrenCount !== undefined) attributes.children_count = childrenCount;

  // --- scheme-specific facts -------------------------------------------
  const cause = firstDefined(raw, ['cause', 'circumstance', 'reason']);
  if (cause) attributes.cause = String(cause);
  const trade = firstDefined(raw, ['trade', 'craft', 'artisan_trade']);
  if (trade) attributes.trade = String(trade);
  const business = firstDefined(raw, ['business_type', 'enterprise_type', 'type', 'purpose']);
  if (business) attributes.business_type = String(business);
  const projectCost = toNumber(firstDefined(raw, ['project_cost', 'project_cost_lakh', 'project_lakh']));
  if (projectCost !== undefined) {
    // Fixtures use project_lakh; treat it as lakh when the key says so.
    attributes.project_cost = raw.project_cost_lakh !== undefined || raw.project_lakh !== undefined ? projectCost * 100000 : projectCost;
  }
  const incorporated = toNumber(firstDefined(raw, ['incorporated_years_ago', 'years_since_incorporation']));
  if (incorporated !== undefined) attributes.incorporated_years_ago = incorporated;
  const yearsInCity = toNumber(firstDefined(raw, ['years_in_city', 'years_of_residence']));
  if (yearsInCity !== undefined) attributes.years_in_city = yearsInCity;
  const branchQuota = firstDefined(raw, ['branch_quota_status']);
  if (branchQuota) attributes.branch_quota_status = String(branchQuota);
  const programme = firstDefined(raw, ['program', 'programme']);
  if (programme) attributes.programme = String(programme);

  return { attributes, original: raw };
}

/** Human-readable question used to ask for a missing attribute. */
const ATTR_QUESTIONS = {
  age: 'How old are you?',
  gender: 'What is your gender?',
  income: 'What is your annual household income?',
  state: 'Which state do you live in?',
  area: 'Do you live in a rural or urban area?',
  category: 'Which social category do you belong to (General/OBC/SC/ST/EWS)?',
  occupation: 'What is your occupation?',
  land_acres: 'How much agricultural land does your family hold?',
  land_owned: 'Is the agricultural land in your family’s name?',
  income_tax_payer: 'Do you pay income tax or GST?',
  has_bank_account: 'Do you have a savings bank account?',
  bpl: 'Is your household below the poverty line / on the SECC or BPL list?',
  owns_pucca_house: 'Does your family already own a pucca house?',
  owns_home: 'Do you own your home?',
  has_lpg: 'Does your household already have an LPG connection?',
  epfo_member: 'Are you a member of EPFO, NPS or ESIC?',
  other_pension: 'Are you receiving any other government pension?',
  ration_card: 'Do you hold a ration card?',
  disability_percent: 'What percentage of disability is recorded on your certificate?',
  is_student: 'Are you currently a student?',
  class_level: 'Which class are you studying in?',
  marks_percent: 'What percentage did you score in your previous examination?',
  class12_percentile: 'What was your Class 12 percentile?',
  marital_status: 'What is your marital status?',
  pregnant: 'Are you pregnant or has the delivery just taken place?',
  girl_children: 'How many girl children are there in the family?',
  daughter_age: 'How old is the girl child?',
  government_job_in_family: 'Is anyone in your family in a government job?',
  employed_full_time: 'Are you in full-time employment?',
  existing_scholarship: 'Are you already receiving another central government scholarship?',
  cleared_qualifying_exam: 'Have you cleared the NMMS qualifying examination?',
  dpiit_recognised: 'Is your startup DPIIT-recognised?',
  incorporated_years_ago: 'How many years ago was your startup incorporated?',
  roof_suitable: 'Is your rooftop suitable for a solar installation?',
  vending_certificate: 'Do you have a certificate of vending / ULB survey ID?',
  greenfield: 'Is this a new (greenfield) enterprise?',
  age_related_impairment: 'Do you have an age-related physical impairment?',
  trade: 'Which artisan trade do you work in?',
  cause: 'What is the reason for your claim?',
};

module.exports = { normaliseProfile, ATTR_QUESTIONS, STATES };
