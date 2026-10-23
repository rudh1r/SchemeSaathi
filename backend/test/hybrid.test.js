const test = require('node:test');
const assert = require('node:assert/strict');

const {
  expandQuery,
  aliasesFor,
  buildBM25,
  rrfFuse,
  documentText,
} = require('../src/search/hybrid');

test('query expansion bridges Hinglish and common paraphrases', () => {
  assert.match(expandQuery('kisan ko sahayata chahiye'), /farmer/);
  assert.match(expandQuery('beti ke liye scholarship'), /girl/);
  assert.match(expandQuery('gaon mein ration card'), /rural/);
  assert.match(expandQuery('roadside vendor loan'), /PM SVANidhi/i);
  assert.match(expandQuery('latrine subsidy'), /Swachh Bharat/i);
});

test('scheme aliases include acronyms and curated common names', () => {
  const aliases = aliasesFor({
    scheme_name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
  }).map((alias) => alias.toLowerCase());

  assert.ok(aliases.includes('pm-kisan'));
  assert.ok(aliases.includes('pm kisan'));
  assert.ok(aliases.includes('pradhan mantri kisan samman nidhi'));
  assert.ok(aliases.includes('kisan'));
});

test('BM25 ranks an exact acronym match first', () => {
  const docs = [
    { id: 'a', name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', text: documentText({ scheme_name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)', description: 'farmer income support' }) },
    { id: 'b', name: 'Pradhan Mantri Awas Yojana', text: documentText({ scheme_name: 'Pradhan Mantri Awas Yojana', description: 'housing' }) },
    { id: 'c', name: 'Kisan Credit Card', text: documentText({ scheme_name: 'Kisan Credit Card', description: 'farm loan' }) },
  ];
  const index = buildBM25(docs);
  const ranked = index.score('PM-KISAN');

  assert.equal(ranked[0].id, 'a');
  assert.ok(ranked[0].score > 0);
});

test('RRF rewards documents that appear in both rankings', () => {
  const fused = rrfFuse(['a', 'b'], ['b', 'c'], { k: 60 });

  assert.equal(fused[0].id, 'b');
  assert.ok(fused[0].score > fused.find((row) => row.id === 'a').score);
  assert.ok(fused.find((row) => row.id === 'c'));
});

test('Hinglish terms do not remove the original query signal', () => {
  const expanded = expandQuery('kisan pension yojana');
  assert.match(expanded, /farmer/);
  assert.match(expanded, /pension/);
  assert.match(expanded, /kisan/);
});

test('Latin Hinglish expansions match whole words, not substrings', () => {
  const expanded = expandQuery('training programme for a digital programme');
  assert.doesNotMatch(expanded, /\brural village\b/);
  assert.doesNotMatch(expanded, /\bloan\b/);
  assert.match(expanded, /training/);
});

