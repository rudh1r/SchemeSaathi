/**
 * Client-side profile model.
 *
 * The eligibility form collects friendly values ("Farmer / Agricultural
 * Worker", ₹1,50,000) and converts them into the canonical attribute names the
 * backend rules engine expects. Keeping this in one place means the chat page
 * and the eligibility page personalise answers with exactly the same profile.
 */

export const PROFILE_KEY = 'schemesaathi_profile';

export const EMPTY_PROFILE = {
  state: '',
  area: 'Rural',
  age: '',
  gender: 'Female',
  category: 'General',
  income: '',
  occupation: '',
  ownsLand: false,
  landAcres: '',
};

export function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY);
}

/** Friendly form state -> canonical API payload. */
export function toApiProfile(form) {
  const profile = {};

  if (form.age !== '' && form.age !== null && form.age !== undefined) profile.age = Number(form.age);
  if (form.gender) profile.gender = form.gender;
  if (form.state && form.state !== 'Other') profile.state = form.state;
  if (form.area) profile.area = form.area;
  if (form.category) profile.category = form.category;
  if (form.income !== '' && form.income !== null && form.income !== undefined) profile.income = Number(form.income);
  if (form.occupation) profile.occupation = form.occupation;

  if (form.ownsLand) {
    profile.land_owned = true;
    if (form.landAcres !== '' && form.landAcres !== null && form.landAcres !== undefined) {
      profile.land_acres = Number(form.landAcres);
    }
  } else if (form.ownsLand === false) {
    profile.land_owned = false;
  }

  return profile;
}

/** Short human summary used in the chat banner. */
export function describeProfile(profile) {
  if (!profile) return null;
  const bits = [];
  if (profile.age) bits.push(`${profile.age}y`);
  if (profile.gender) bits.push(profile.gender);
  if (profile.occupation) bits.push(profile.occupation);
  if (profile.category) bits.push(profile.category);
  if (profile.state) bits.push(profile.state);
  if (profile.area) bits.push(profile.area.toLowerCase());
  if (profile.income) bits.push(`₹${Number(profile.income).toLocaleString('en-IN')}/yr`);
  return bits.join(' · ');
}

export const STATUS_STYLES = {
  Eligible: {
    label: 'Eligible',
    className: 'bg-secondary-light text-secondary border-secondary/30',
  },
  'Insufficient Information': {
    label: 'Needs info',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  Ineligible: {
    label: 'Not eligible',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
};
