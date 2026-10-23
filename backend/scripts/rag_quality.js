#!/usr/bin/env node
/**
 * Transparent, automatic RAG quality checks.
 *
 * These are *support signals*, not a substitute for human groundedness
 * judgement. They measure whether an answer names its retrieved sources,
 * carries a confirmation/next-step instruction, and avoids currency amounts
 * that are absent from the retrieved evidence. The manual rubric is in
 * GROUNDEDNESS_RUBRIC.md.
 *
 * Usage: node scripts/rag_quality.js [--input rag_results_raw_v2.json]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const inputArg = args.indexOf('--input');
const input = inputArg >= 0 ? path.resolve(process.cwd(), args[inputArg + 1]) : path.join(ROOT, 'rag_results_raw_v2.json');
const rows = JSON.parse(fs.readFileSync(input, 'utf8'));
const schemes = JSON.parse(fs.readFileSync(path.join(ROOT, '..', 'data', 'schemes.json'), 'utf8'));
const byName = new Map(schemes.map((scheme) => [normalise(scheme.scheme_name), scheme]));

function normalise(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function sourceCorpus(sources) {
  return sources
    .map((name) => byName.get(normalise(name)))
    .filter(Boolean)
    .map((scheme) => [
      scheme.scheme_name,
      scheme.description,
      scheme.benefits,
      scheme.application_process,
      JSON.stringify(scheme.eligibility || {}),
    ].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase();
}

function amountTokens(text) {
  return (String(text).match(/(?:₹|rs\.?|inr)\s*[\d,]+(?:\.\d+)?/gi) || [])
    .map((value) => value.replace(/[^\d]/g, ''))
    .filter(Boolean);
}

/** Compare amounts without thousands separators ("6,000" -> "6000"). */
function compactNumbers(text) {
  return String(text).replace(/(\d),(?=\d)/g, '$1');
}

function mentionedSourceCount(answer, sources) {
  const text = normalise(answer);
  let count = 0;
  for (const source of sources) {
    const key = normalise(source);
    if (text.includes(key)) {
      count += 1;
      continue;
    }
    // Fall back to the acronym/first distinctive token for long official names.
    const tokens = key.split(' ').filter((token) => token.length >= 4);
    if (tokens.some((token) => text.includes(token))) count += 1;
  }
  return count;
}

const checks = rows.map((row) => {
  const answer = String(row.raw_answer || row.answer || '');
  const sources = Array.isArray(row.retrieved_sources) ? row.retrieved_sources : [];
  const corpus = compactNumbers(sourceCorpus(sources));
  const amounts = amountTokens(answer);
  const unsupportedAmounts = amounts.filter((amount) => !corpus.includes(amount));
  const sourceMentions = mentionedSourceCount(answer, sources);
  const hasCitationMarker = /\[\d+\]/.test(answer);
  const hasOfficialLink = /https?:\/\//i.test(answer);
  const hasConfirmation = /confirm|official|verify|authority|portal/i.test(answer);
  const hasNextStep = /apply|visit|portal|document|contact|csc|common service centre/i.test(answer);

  return {
    id: row.id,
    category: row.category,
    query: row.query,
    answer_chars: answer.length,
    source_count: sources.length,
    sources_mentioned: sourceMentions,
    source_name_coverage_pct: sources.length ? Number(((sourceMentions / sources.length) * 100).toFixed(2)) : null,
    has_citation_marker: hasCitationMarker,
    has_official_link: hasOfficialLink,
    has_confirmation_language: hasConfirmation,
    has_next_step: hasNextStep,
    currency_amounts: amounts.length,
    unsupported_currency_amounts: unsupportedAmounts,
    empty_or_error: !answer.trim(),
  };
});

const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const pct = (value) => (value == null ? null : Number((value * 100).toFixed(2)));
const withSources = checks.filter((row) => row.source_count > 0);
const metrics = {
  generated_at: new Date().toISOString(),
  input: path.basename(input),
  note: 'Automatic support checks only. Do not report these as human groundedness scores.',
  answers: checks.length,
  empty_or_error: checks.filter((row) => row.empty_or_error).length,
  mean_answer_chars: Math.round(mean(checks.map((row) => row.answer_chars)) || 0),
  mean_sources_per_answer: Number((mean(checks.map((row) => row.source_count)) || 0).toFixed(2)),
  source_name_coverage_pct: pct(mean(withSources.map((row) => row.source_name_coverage_pct / 100))),
  citation_marker_rate_pct: pct(mean(checks.map((row) => (row.has_citation_marker ? 1 : 0)))),
  official_link_rate_pct: pct(mean(checks.map((row) => (row.has_official_link ? 1 : 0)))),
  confirmation_language_rate_pct: pct(mean(checks.map((row) => (row.has_confirmation_language ? 1 : 0)))),
  next_step_rate_pct: pct(mean(checks.map((row) => (row.has_next_step ? 1 : 0)))),
  answers_with_unsupported_currency_amounts: checks.filter((row) => row.unsupported_currency_amounts.length > 0).length,
  unsupported_currency_amount_examples: checks
    .filter((row) => row.unsupported_currency_amounts.length > 0)
    .slice(0, 10)
    .map((row) => ({ id: row.id, amounts: row.unsupported_currency_amounts })),
  by_category: {},
  per_answer: checks,
};

for (const category of [...new Set(checks.map((row) => row.category))]) {
  const group = checks.filter((row) => row.category === category);
  metrics.by_category[category] = {
    answers: group.length,
    mean_sources: Number((mean(group.map((row) => row.source_count)) || 0).toFixed(2)),
    source_name_coverage_pct: pct(mean(group.map((row) => (row.source_name_coverage_pct == null ? 0 : row.source_name_coverage_pct / 100)))),
    confirmation_rate_pct: pct(mean(group.map((row) => (row.has_confirmation_language ? 1 : 0)))),
    next_step_rate_pct: pct(mean(group.map((row) => (row.has_next_step ? 1 : 0)))),
  };
}

const outPath = path.join(ROOT, 'rag_quality_metrics.json');
fs.writeFileSync(outPath, `${JSON.stringify(metrics, null, 2)}\n`);

// A CSV that two annotators can fill independently. Keep the answer text
// quoted/escaped so the sheet opens cleanly in Excel/Sheets.
const csvEscape = (value) => `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
const header = ['id', 'category', 'query', 'retrieved_sources', 'answer', 'groundedness_1_5', 'relevance_1_5', 'notes'];
const lines = [header.join(',')];
for (const row of rows) {
  lines.push([
    row.id,
    row.category,
    row.query,
    (row.retrieved_sources || []).join(' | '),
    row.raw_answer || row.answer || '',
    '',
    '',
    '',
  ].map(csvEscape).join(','));
}
fs.writeFileSync(path.join(ROOT, 'rag_manual_scoring_sheet.csv'), `${lines.join('\n')}\n`);

console.log(JSON.stringify({
  answers: metrics.answers,
  mean_sources: metrics.mean_sources_per_answer,
  source_name_coverage_pct: metrics.source_name_coverage_pct,
  citation_marker_rate_pct: metrics.citation_marker_rate_pct,
  confirmation_rate_pct: metrics.confirmation_language_rate_pct,
  next_step_rate_pct: metrics.next_step_rate_pct,
  unsupported_currency_answers: metrics.answers_with_unsupported_currency_amounts,
}, null, 2));
console.log(`Wrote ${path.basename(outPath)} and rag_manual_scoring_sheet.csv`);
