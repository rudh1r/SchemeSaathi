/** Device-local scheme comparison list (maximum three schemes). */

export const COMPARE_KEY = 'schemesaathi_compare';
export const MAX_COMPARE = 3;

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COMPARE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id) : [];
  } catch {
    return [];
  }
}

function write(items) {
  try {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(items.slice(0, MAX_COMPARE)));
  } catch {
    /* ignore storage failures */
  }
}

export function loadCompare() {
  return read();
}

export function isCompared(id) {
  return read().some((item) => String(item.id) === String(id));
}

export function addCompare(scheme) {
  const id = String(scheme?._id || scheme?.id || '');
  if (!id) return { ok: false, reason: 'missing-id' };
  const items = read();
  if (items.some((item) => String(item.id) === id)) return { ok: true, already: true };
  if (items.length >= MAX_COMPARE) return { ok: false, reason: 'limit' };
  write([...items, { id, name: scheme.scheme_name || scheme.name || 'Scheme' }]);
  return { ok: true };
}

export function removeCompare(id) {
  const target = String(id);
  write(read().filter((item) => String(item.id) !== target));
}

export function clearCompare() {
  write([]);
}
