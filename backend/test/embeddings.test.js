const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const seed = require('../../data/schemes.json');
const embeddings = require('../../data/scheme_embeddings.json');

test('precomputed embeddings cover every scheme with one consistent dimension', () => {
  const names = seed.map((scheme) => scheme.scheme_name);
  assert.equal(names.length, 112);
  assert.equal(new Set(names).size, names.length);
  assert.equal(embeddings.model, 'Xenova/all-MiniLM-L6-v2');

  for (const name of names) {
    const vector = embeddings.embeddings[name];
    assert.ok(Array.isArray(vector), `missing embedding for ${name}`);
    assert.equal(vector.length, embeddings.dimensions);
    assert.ok(vector.every((value) => Number.isFinite(value)));
  }
});

test('the embeddings file is small enough to keep in the repository', () => {
  const file = path.resolve(__dirname, '../../data/scheme_embeddings.json');
  const size = fs.statSync(file).size;
  assert.ok(size > 0 && size < 2_000_000, `unexpected embeddings size: ${size}`);
});
