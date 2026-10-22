/** Small validation helpers — enough for our request shapes without a dependency. */

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function str(value, field, { required = false, min = 0, max = 5000 } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `${field} is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new HttpError(400, `${field} must be text`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw new HttpError(400, `${field} must be at least ${min} characters`);
  if (trimmed.length > max) throw new HttpError(400, `${field} must be at most ${max} characters`);
  return trimmed;
}

function email(value, field = 'email') {
  const s = str(value, field, { required: true, max: 254 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) throw new HttpError(400, 'Please enter a valid email address');
  return s.toLowerCase();
}

function int(value, field, { required = false, min = -Infinity, max = Infinity, fallback } = {}) {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `${field} is required`);
    return fallback;
  }
  const n = Number(value);
  if (!Number.isInteger(n)) throw new HttpError(400, `${field} must be a whole number`);
  if (n < min || n > max) throw new HttpError(400, `${field} must be between ${min} and ${max}`);
  return n;
}

function object(value, field) {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, `${field} must be an object`);
  return value;
}

module.exports = { HttpError, str, email, int, object };
