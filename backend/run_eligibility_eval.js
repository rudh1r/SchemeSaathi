#!/usr/bin/env node
/**
 * Deterministic eligibility evaluation.
 *
 * Runs the rules engine against eligibility_test_cases_v2.json and writes:
 *   eligibility_engine_results.json   per-case verdicts and explanations
 *   eligibility_engine_metrics.json   accuracy, macro P/R/F1, confusion matrix
 *
 * Unlike the earlier LLM-graded run, this is fully reproducible: the same input
 * always produces the same verdict.
 *
 * Usage: node run_eligibility_eval.js [--verbose] [--limit N]
 *        [--dataset eligibility_test_cases_v3.json] [--output eligibility_engine_v3]
 */
const fs = require('fs');
const path = require('path');
const { connectDB, collections, closeDB } = require('./src/db');
const { attachRules } = require('./src/eligibility/service');
const { evaluateScheme } = require('./src/eligibility/evaluate');
const { normaliseProfile } = require('./src/eligibility/profile');

const CLASSES = ['Eligible', 'Ineligible', 'Insufficient Information'];
const args = process.argv.slice(2);
const verbose = args.includes('--verbose');
const limitArg = args.indexOf('--limit');
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : Infinity;
const datasetArg = args.indexOf('--dataset');
const outputArg = args.indexOf('--output');
const datasetPath = datasetArg >= 0
  ? path.resolve(process.cwd(), args[datasetArg + 1])
  : path.join(__dirname, 'eligibility_test_cases_v2.json');
const outputPrefix = outputArg >= 0
  ? String(args[outputArg + 1]).replace(/[^a-z0-9_-]/gi, '')
  : (datasetPath.includes('_v3') ? 'eligibility_engine_v3' : 'eligibility_engine');

const pct = (x) => (x == null ? null : Number((x * 100).toFixed(2)));

/** 95% Wilson score interval for a binomial proportion. */
function wilson(successes, n, z = 1.96) {
  if (!n) return { low: null, high: null };
  const p = successes / n;
  const denominator = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return {
    low: pct(Math.max(0, (centre - margin) / denominator)),
    high: pct(Math.min(1, (centre + margin) / denominator)),
    method: 'Wilson score interval, 95%',
  };
}

function confusion(rows, labels) {
  const matrix = Object.fromEntries(labels.map((a) => [a, Object.fromEntries(labels.map((b) => [b, 0]))]));
  for (const row of rows) {
    if (matrix[row.expected]?.[row.predicted] !== undefined) matrix[row.expected][row.predicted] += 1;
  }
  const perClass = {};
  for (const label of labels) {
    const tp = matrix[label][label];
    const fp = labels.filter((x) => x !== label).reduce((sum, x) => sum + matrix[x][label], 0);
    const fn = labels.filter((x) => x !== label).reduce((sum, x) => sum + matrix[label][x], 0);
    perClass[label] = {
      precision: pct(tp + fp ? tp / (tp + fp) : 0),
      precision_ci_95: wilson(tp, tp + fp),
      recall: pct(tp + fn ? tp / (tp + fn) : 0),
      recall_ci_95: wilson(tp, tp + fn),
      f1: pct(tp + fp && tp + fn ? (2 * tp) / (2 * tp + fp + fn) : 0),
      support: tp + fn,
      predicted: tp + fp,
    };
  }
  const correct = labels.reduce((sum, label) => sum + matrix[label][label], 0);
  return {
    labeled_cases: rows.length,
    correct,
    accuracy: pct(rows.length ? correct / rows.length : 0),
    accuracy_ci_95: wilson(correct, rows.length),
    confusion_matrix_actual_rows_predicted_cols: matrix,
    per_class: perClass,
    macro_precision: pct(perClass ? CLASSES.reduce((s, c) => s + perClass[c].precision / 100, 0) / CLASSES.length : 0),
    macro_recall: pct(CLASSES.reduce((s, c) => s + perClass[c].recall / 100, 0) / CLASSES.length),
    macro_f1: pct(CLASSES.reduce((s, c) => s + perClass[c].f1 / 100, 0) / CLASSES.length),
  };
}

async function main() {
  await connectDB({ retries: 2 });
  const cases = JSON.parse(fs.readFileSync(datasetPath, 'utf8')).slice(0, limit);
  const schemes = attachRules(await collections.schemes().find({}).toArray());
  const byName = new Map(schemes.map((s) => [s.scheme_name.toLowerCase(), s]));

  const rows = [];
  const missing = [];

  for (const testCase of cases) {
    const scheme = byName.get(String(testCase.scheme).toLowerCase());
    if (!scheme) {
      missing.push(testCase.scheme);
      continue;
    }
    const { attributes } = normaliseProfile(testCase.profile_fields || {});
    const result = evaluateScheme(scheme, attributes);
    rows.push({
      id: testCase.id,
      scheme: testCase.scheme,
      expected: testCase.ground_truth,
      predicted: result.status,
      correct: result.status === testCase.ground_truth,
      category: testCase.category,
      profile: attributes,
      satisfied: result.satisfied.map((s) => s.label),
      violated: result.violated.map((s) => s.label),
      unresolved: result.unresolved.map((s) => s.label),
      summary: result.summary,
      rationale: testCase.rationale,
    });
  }

  const metrics = confusion(rows, CLASSES);
  const byCategory = {};
  for (const row of rows) {
    const entry = byCategory[row.category] || { cases: 0, correct: 0 };
    entry.cases += 1;
    if (row.correct) entry.correct += 1;
    byCategory[row.category] = entry;
  }
  for (const entry of Object.values(byCategory)) entry.accuracy = pct(entry.correct / entry.cases);

  // Every off-diagonal confusion cell belongs to exactly one failure mode.
  const errorsByType = {
    falseIneligible: rows.filter((r) => r.expected !== 'Ineligible' && r.predicted === 'Ineligible').length,
    falseEligible: rows.filter((r) => r.expected !== 'Eligible' && r.predicted === 'Eligible').length,
    overCautious: rows.filter((r) => r.expected === 'Eligible' && r.predicted === 'Insufficient Information').length,
    missedIneligible: rows.filter((r) => r.expected === 'Ineligible' && r.predicted === 'Insufficient Information').length,
    missedUncertainty: rows.filter((r) => r.expected === 'Insufficient Information' && r.predicted !== 'Insufficient Information').length,
  };
  const incorrect = rows.filter((row) => !row.correct);
  const classifiedErrors = Object.values(errorsByType).reduce((sum, value) => sum + value, 0);

  const report = {
    generated_at: new Date().toISOString(),
    engine: 'deterministic rule engine (no LLM in the loop)',
    dataset: path.basename(datasetPath),
    test_cases: cases.length,
    evaluated: rows.length,
    missing_schemes: [...new Set(missing)],
    metrics,
    per_category: byCategory,
    errors_by_type: errorsByType,
    error_taxonomy_check: {
      incorrect_cases: incorrect.length,
      classified_cases: classifiedErrors,
      unclassified_cases: incorrect.length - classifiedErrors,
    },
    incorrect_cases: incorrect.map((row) => ({
      id: row.id,
      scheme: row.scheme,
      expected: row.expected,
      predicted: row.predicted,
      unresolved: row.unresolved,
      violated: row.violated,
    })),
  };

  fs.writeFileSync(path.join(__dirname, `${outputPrefix}_metrics.json`), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(__dirname, `${outputPrefix}_results.json`), JSON.stringify(rows, null, 2));

  console.log(`\nDataset: ${path.basename(datasetPath)}`);
  console.log(`Evaluated ${rows.length} cases (${missing.length} skipped)\n`);
  console.log(`Accuracy          : ${metrics.accuracy}%  (95% CI ${metrics.accuracy_ci_95.low}–${metrics.accuracy_ci_95.high}%)`);
  console.log(`Macro precision   : ${metrics.macro_precision}%`);
  console.log(`Macro recall      : ${metrics.macro_recall}%`);
  console.log(`Macro F1          : ${metrics.macro_f1}%`);
  console.log('\nPer class:');
  for (const label of CLASSES) {
    const c = metrics.per_class[label];
    console.log(`  ${label.padEnd(24)} P ${String(c.precision).padStart(6)}%  R ${String(c.recall).padStart(6)}%  F1 ${String(c.f1).padStart(6)}%  n=${c.support}  (R CI ${c.recall_ci_95.low}–${c.recall_ci_95.high}%)`);
  }
  console.log('\nErrors by type:', errorsByType);
  console.log(`Taxonomy check: ${classifiedErrors}/${incorrect.length} incorrect cases classified`);

  if (verbose) {
    console.log('\nIncorrect cases:');
    for (const row of rows.filter((r) => !r.correct)) {
      console.log(`\n[${row.id}] ${row.scheme}`);
      console.log(`  expected ${row.expected} / predicted ${row.predicted}`);
      console.log(`  ${row.summary}`);
    }
  }

  await closeDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
