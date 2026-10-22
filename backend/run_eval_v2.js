/**
 * run_eval_v2.js  ->  put this file and the three *_v2.json / retrieval_benchmark.json files
 * into SchemeSaathi/backend/ (same folder as server.js).
 *
 *   node run_eval_v2.js retrieval     # automatic metrics, needs Chroma only
 *   node run_eval_v2.js lexical       # BM25 baseline for comparison, needs nothing running
 *   node run_eval_v2.js eligibility   # needs backend (server.js) running
 *   node run_eval_v2.js rag           # needs backend running
 *   node run_eval_v2.js load 3        # concurrency test, 3 parallel users
 *   node run_eval_v2.js metrics       # after you have scored the raw files by hand
 *   node run_eval_v2.js all           # retrieval + eligibility + rag
 *
 * Why retrieval talks to Chroma directly: /api/query returns schemes in MongoDB order,
 * not ranked order, so Top-1 cannot be measured through the API.
 */
const fs = require('fs');
const path = require('path');
const API_BASE = process.env.SCHEMESAATHI_API_BASE || 'http://localhost:5000';
const K = 5;
const f = (n) => path.join(__dirname, n);
const read = (n) => JSON.parse(fs.readFileSync(f(n), 'utf8'));
const write = (n, o) => fs.writeFileSync(f(n), JSON.stringify(o, null, 2));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------- pure metric helpers (exported for testing) ----------------
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const pct = (x) => (x == null ? null : +(x * 100).toFixed(2));
function percentile(arr, p) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1);
  return s[Math.max(0, i)];
}
function latencyStats(msArr) {
  const s = msArr.map((x) => x / 1000);
  return { n: s.length, mean_s: mean(s), median_s: percentile(s, 50), p95_s: percentile(s, 95), max_s: s.length ? Math.max(...s) : null };
}
function retrievalMetrics(rows, k) {
  // rows: {ranked:[names], relevant:[names]}; only rows with non-empty relevant
  const r = rows.filter((x) => x.relevant.length);
  const top1 = [], hit = [], prec = [], rec = [], rr = [];
  for (const x of r) {
    const rel = new Set(x.relevant);
    const topk = x.ranked.slice(0, k);
    const tp = topk.filter((n) => rel.has(n)).length;
    top1.push(rel.has(x.ranked[0]) ? 1 : 0);
    hit.push(tp > 0 ? 1 : 0);
    prec.push(tp / k);
    rec.push(tp / rel.size);
    const idx = x.ranked.findIndex((n) => rel.has(n));
    rr.push(idx >= 0 && idx < K ? 1 / (idx + 1) : 0);
  }
  const P = mean(prec), R = mean(rec);
  return { queries: r.length, k, top1_accuracy: pct(mean(top1)), [`hit_at_${k}`]: pct(mean(hit)), [`recall_at_${k}`]: pct(R), [`precision_at_${k}`]: pct(P), [`f1_at_${k}`]: pct(P + R ? (2 * P * R) / (P + R) : 0), mrr: +mean(rr).toFixed(4) };
}
function confusion(rows) {
  const L = ['Eligible', 'Ineligible', 'Insufficient Information'];
  const m = Object.fromEntries(L.map((a) => [a, Object.fromEntries(L.map((b) => [b, 0]))]));
  for (const r of rows) if (m[r.ground_truth] && m[r.ground_truth][r.predicted_eligibility] !== undefined) m[r.ground_truth][r.predicted_eligibility]++;
  const per = {};
  for (const c of L) {
    const tp = m[c][c];
    const fp = L.filter((x) => x !== c).reduce((s, x) => s + m[x][c], 0);
    const fn = L.filter((x) => x !== c).reduce((s, x) => s + m[c][x], 0);
    const p = tp + fp ? tp / (tp + fp) : 0, r = tp + fn ? tp / (tp + fn) : 0;
    per[c] = { precision: pct(p), recall: pct(r), f1: pct(p + r ? (2 * p * r) / (p + r) : 0), support: tp + fn };
  }
  const correct = L.reduce((s, c) => s + m[c][c], 0);
  const n = rows.length;
  return {
    labeled_cases: n, accuracy: pct(n ? correct / n : 0), confusion_matrix_rows_actual_cols_predicted: m, per_class: per,
    macro_precision: pct(mean(L.map((c) => per[c].precision / 100))), macro_recall: pct(mean(L.map((c) => per[c].recall / 100))), macro_f1: pct(mean(L.map((c) => per[c].f1 / 100))),
  };
}


// ---------------- lexical baseline (BM25) ----------------
const STOP = new Set('a an the and or of to in for on with is are am i my me can do does how what which who get any from at by it this that be as have has not no if so was were will would should could scheme schemes government help'.split(' '));
const tok = (s) => (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter((w) => !STOP.has(w) && w.length > 1);
function buildBM25(docs) {
  const N = docs.length, tf = docs.map((d) => { const m = new Map(); tok(d).forEach((w) => m.set(w, (m.get(w) || 0) + 1)); return m; });
  const len = tf.map((m) => [...m.values()].reduce((a, b) => a + b, 0)), avg = mean(len);
  const df = new Map(); tf.forEach((m) => m.forEach((_, w) => df.set(w, (df.get(w) || 0) + 1)));
  return (q) => docs.map((_, i) => { let s = 0; for (const w of new Set(tok(q))) { const f = tf[i].get(w) || 0; if (!f) continue; const idf = Math.log(1 + (N - df.get(w) + 0.5) / (df.get(w) + 0.5)); s += (idf * f * 2.5) / (f + 1.5 * (0.25 + 0.75 * (len[i] / avg))); } return s; });
}
async function runLexical() {
  const schemes = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/schemes.json'), 'utf8'));
  const docs = schemes.map((s) => `${s.scheme_name}. ${s.description} ${s.benefits || ''} ${JSON.stringify(s.eligibility || {})}`);
  const score = buildBM25(docs);
  const bench = read('retrieval_benchmark.json');
  const rows = bench.map((c) => {
    const sc = score(c.query).map((v, i) => [v, schemes[i].scheme_name]).sort((a, b) => b[0] - a[0]);
    return { id: c.id, type: c.type, relevant: c.expected_scheme ? [c.expected_scheme, ...c.also_relevant] : [], ranked: sc.slice(0, K).map((x) => x[1]) };
  });
  const single = rows.filter((r) => r.type === 'single'), multi = rows.filter((r) => r.type === 'multi_relevant');
  const m = { baseline: 'BM25 over scheme_name + description + benefits + eligibility', schemes: schemes.length, single_relevant: { k3: retrievalMetrics(single, 3), k5: retrievalMetrics(single, 5) }, multi_relevant: { k3: retrievalMetrics(multi, 3) } };
  write('lexical_baseline_metrics.json', m);
  console.log(JSON.stringify(m, null, 2));
}

// ---------------- backend call ----------------
async function ask(query) {
  const t0 = Date.now();
  const res = await fetch(`${API_BASE}/api/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
  const ms = Date.now() - t0;
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return { data: await res.json(), ms };
}

// ---------------- runners ----------------
async function runRetrieval() {
  const { ChromaClient } = require('chromadb');
  const chroma = new ChromaClient({ host: 'localhost', port: 8000, ssl: false });
  const col = await chroma.getOrCreateCollection({ name: 'schemes' });
  const bench = read('retrieval_benchmark.json');
  const rows = [];
  const BATCH = 10;
  for (let i = 0; i < bench.length; i += BATCH) {
    const chunk = bench.slice(i, i + BATCH);
    const t0 = Date.now();
    const out = await col.query({ queryTexts: chunk.map((c) => c.query), nResults: K });
    const per = (Date.now() - t0) / chunk.length;
    chunk.forEach((c, j) => {
      rows.push({
        id: c.id, query: c.query, type: c.type, expected_scheme: c.expected_scheme, also_relevant: c.also_relevant,
        relevant: c.expected_scheme ? [c.expected_scheme, ...c.also_relevant] : [],
        ranked: out.metadatas[j].map((m) => m.scheme_name),
        distances: out.distances ? out.distances[j] : null,
        retrieval_latency_ms: Math.round(per),
      });
    });
    process.stdout.write(`\r[retrieval] ${Math.min(i + BATCH, bench.length)}/${bench.length}`);
  }
  console.log();
  const single = rows.filter((r) => r.type === 'single');
  const multi = rows.filter((r) => r.type === 'multi_relevant');
  const neg = rows.filter((r) => r.type === 'out_of_scope');
  const failures = single.filter((r) => r.ranked[0] !== r.expected_scheme).map((r) => ({ id: r.id, query: r.query, expected: r.expected_scheme, got_top3: r.ranked.slice(0, 3) }));
  const m = {
    note: 'Single-relevant queries mirror the paper protocol (Precision@3 is capped at 33.3%). Multi-relevant queries use several acceptable schemes.',
    single_relevant: { k3: retrievalMetrics(single, 3), k5: retrievalMetrics(single, 5) },
    multi_relevant: { k3: retrievalMetrics(multi, 3), k5: retrievalMetrics(multi, 5) },
    overall: { k3: retrievalMetrics([...single, ...multi], 3) },
    out_of_scope: { queries: neg.length, top1_distances: neg.map((r) => r.distances && r.distances[0]), in_scope_top1_distance_mean: mean(single.map((r) => r.distances && r.distances[0]).filter((x) => x != null)) },
    retrieval_latency_ms: latencyStats(rows.map((r) => r.retrieval_latency_ms)),
    top1_failures: failures,
  };
  write('retrieval_results_raw.json', rows);
  write('retrieval_metrics.json', m);
  console.log(JSON.stringify({ single: m.single_relevant.k3, multi: m.multi_relevant.k3, failures: failures.length }, null, 2));
  console.log('Wrote retrieval_results_raw.json and retrieval_metrics.json');
}

async function runEligibility() {
  const cases = read('eligibility_test_cases_v2.json');
  const out = [];
  for (const c of cases) {
    const q = `${c.profile_narrative} Am I eligible for ${c.scheme}? Please explain why or why not based on the actual eligibility criteria.`;
    process.stdout.write(`\r[eligibility] ${c.id}`);
    try {
      const { data, ms } = await ask(q);
      out.push({ id: c.id, scheme: c.scheme, ground_truth: c.ground_truth, category: c.category, query_sent: q, raw_answer: data.answer, retrieved_sources: (data.sources || []).map((s) => s.scheme_name), latency_ms: ms, predicted_eligibility: null, prediction_correct: null, scorer_notes: '' });
    } catch (e) { out.push({ id: c.id, scheme: c.scheme, ground_truth: c.ground_truth, error: e.message }); }
    write('eligibility_results_raw_v2.json', out); // incremental save
  }
  console.log(`\nWrote eligibility_results_raw_v2.json (${out.length})`);
}

async function runRag() {
  const qs = read('rag_test_queries_v2.json');
  const out = [];
  for (const q of qs) {
    process.stdout.write(`\r[rag] ${q.id}`);
    try {
      const { data, ms } = await ask(q.query);
      out.push({ id: q.id, category: q.category, query: q.query, notes: q.notes, eligibility_applicable: q.eligibility_applicable, raw_answer: data.answer, retrieved_sources: (data.sources || []).map((s) => s.scheme_name), latency_ms: ms, groundedness_score: null, relevance_score: null, eligibility_correctness_score: q.eligibility_applicable ? null : 'n/a', unsupported_claims_found: null, scorer_notes: '' });
    } catch (e) { out.push({ id: q.id, category: q.category, query: q.query, error: e.message }); }
    write('rag_results_raw_v2.json', out);
  }
  console.log(`\nWrote rag_results_raw_v2.json (${out.length})`);
}

async function runLoad(conc) {
  const qs = read('rag_test_queries_v2.json').map((q) => q.query);
  const total = Math.min(qs.length, 40);
  let idx = 0, errors = 0; const lat = [];
  const t0 = Date.now();
  await Promise.all(Array.from({ length: conc }, async () => {
    while (idx < total) {
      const q = qs[idx++];
      try { const { ms } = await ask(q); lat.push(ms); } catch (_) { errors++; }
    }
  }));
  const wall = (Date.now() - t0) / 1000;
  const r = { concurrency: conc, requests: total, errors, wall_s: wall, throughput_rps: +(total / wall).toFixed(3), latency: latencyStats(lat) };
  write(`load_results_c${conc}.json`, r);
  console.log(r);
}

function runMetrics() {
  const out = {};
  if (fs.existsSync(f('eligibility_results_raw_v2.json'))) {
    const rows = read('eligibility_results_raw_v2.json');
    const labeled = rows.filter((r) => r.predicted_eligibility);
    out.eligibility = confusion(labeled);
    out.eligibility.unlabeled_or_errored = rows.length - labeled.length;
    out.eligibility.by_category_accuracy = {};
    for (const c of [...new Set(labeled.map((r) => r.category))]) {
      const g = labeled.filter((r) => r.category === c);
      out.eligibility.by_category_accuracy[c] = { n: g.length, accuracy: pct(mean(g.map((r) => (r.predicted_eligibility === r.ground_truth ? 1 : 0)))) };
    }
    out.eligibility.latency = latencyStats(rows.filter((r) => r.latency_ms).map((r) => r.latency_ms));
  }
  if (fs.existsSync(f('rag_results_raw_v2.json'))) {
    const rows = read('rag_results_raw_v2.json');
    const sc = rows.filter((r) => r.groundedness_score != null && r.relevance_score != null);
    const num = (a) => a.filter((x) => typeof x === 'number');
    const el = sc.filter((r) => r.eligibility_applicable && typeof r.eligibility_correctness_score === 'number');
    out.rag = {
      scored_queries: sc.length,
      mean_groundedness: mean(num(sc.map((r) => r.groundedness_score))),
      mean_relevance: mean(num(sc.map((r) => r.relevance_score))),
      eligibility_applicable_queries: el.length,
      mean_eligibility_correctness: mean(el.map((r) => r.eligibility_correctness_score)),
      unsupported_addition_rate_pct: pct(mean(sc.map((r) => (Array.isArray(r.unsupported_claims_found) && r.unsupported_claims_found.length ? 1 : 0)))),
      by_category: {},
      latency: latencyStats(rows.filter((r) => r.latency_ms).map((r) => r.latency_ms)),
    };
    for (const c of [...new Set(sc.map((r) => r.category))]) {
      const g = sc.filter((r) => r.category === c);
      out.rag.by_category[c] = { n: g.length, groundedness: +mean(g.map((r) => r.groundedness_score)).toFixed(2), relevance: +mean(g.map((r) => r.relevance_score)).toFixed(2), unsupported_rate_pct: pct(mean(g.map((r) => (Array.isArray(r.unsupported_claims_found) && r.unsupported_claims_found.length ? 1 : 0)))) };
    }
  }
  write('metrics_summary_v2.json', out);
  console.log(JSON.stringify(out, null, 2));
}

module.exports = { buildBM25, tok, retrievalMetrics, confusion, latencyStats, percentile };

if (require.main === module) {
  const mode = process.argv[2];
  const job = { retrieval: runRetrieval, lexical: runLexical, eligibility: runEligibility, rag: runRag, load: () => runLoad(+process.argv[3] || 3), metrics: async () => runMetrics(),
    all: async () => { await runRetrieval(); await runEligibility(); await runRag(); } }[mode];
  if (!job) { console.log('usage: node run_eval_v2.js retrieval|lexical|eligibility|rag|load [N]|metrics|all'); process.exit(1); }
  job().catch((e) => { console.error('\n❌', e.message); process.exit(1); });
}