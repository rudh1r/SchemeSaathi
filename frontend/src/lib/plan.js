/**
 * Local "My Plan" store.
 *
 * A plan is deliberately device-local: it works without an account, needs no
 * server round-trip, and never stores sensitive eligibility answers. Signed-in
 * users can still use server-side bookmarks; the Plan page merges both sources.
 */

export const PLAN_KEY = 'schemesaathi_plan';
export const REMINDER_KEY = 'schemesaathi_reminders';
export const CHECKLIST_KEY = 'schemesaathi_checklist';
export const MAX_PLAN_ITEMS = 30;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage can be disabled in private mode; the UI still works this session */
  }
}

export function loadPlan() {
  const items = readJson(PLAN_KEY, []);
  return Array.isArray(items) ? items.filter((item) => item && item.id) : [];
}

export function savePlan(items) {
  writeJson(PLAN_KEY, (items || []).slice(0, MAX_PLAN_ITEMS));
}

export function addToPlan(scheme) {
  const id = String(scheme?._id || scheme?.id || '');
  if (!id) return { ok: false, reason: 'missing-id' };
  const items = loadPlan();
  if (items.some((item) => String(item.id) === id)) return { ok: true, already: true };
  if (items.length >= MAX_PLAN_ITEMS) return { ok: false, reason: 'limit' };
  const next = [
    ...items,
    { id, name: scheme.scheme_name || scheme.name || 'Scheme', added_at: new Date().toISOString() },
  ];
  savePlan(next);
  return { ok: true };
}

export function removeFromPlan(id) {
  const target = String(id);
  savePlan(loadPlan().filter((item) => String(item.id) !== target));
  removeReminder(target);
}

export function isInPlan(id) {
  return loadPlan().some((item) => String(item.id) === String(id));
}

export function loadReminders() {
  const reminders = readJson(REMINDER_KEY, {});
  return reminders && typeof reminders === 'object' && !Array.isArray(reminders) ? reminders : {};
}

export function setReminder(id, reminder) {
  const reminders = loadReminders();
  const target = String(id);
  if (!reminder || !reminder.date) delete reminders[target];
  else reminders[target] = { date: reminder.date, note: reminder.note || '', updated_at: new Date().toISOString() };
  writeJson(REMINDER_KEY, reminders);
  return reminders;
}

export function removeReminder(id) {
  const reminders = loadReminders();
  delete reminders[String(id)];
  writeJson(REMINDER_KEY, reminders);
}

export function loadChecklist(id) {
  const all = readJson(CHECKLIST_KEY, {});
  const checked = all?.[String(id)];
  return Array.isArray(checked) ? checked : [];
}

export function saveChecklist(id, checkedIds) {
  const all = readJson(CHECKLIST_KEY, {});
  all[String(id)] = [...new Set(checkedIds || [])];
  writeJson(CHECKLIST_KEY, all);
}

/** Return reminders that are due today or overdue. */
export function dueReminders(reminders = loadReminders(), today = new Date()) {
  const iso = today.toISOString().slice(0, 10);
  return Object.entries(reminders)
    .filter(([, reminder]) => reminder?.date && reminder.date <= iso)
    .map(([id, reminder]) => ({ id, ...reminder }));
}
