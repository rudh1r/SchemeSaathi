# SchemeSaathi evaluation results

Generated from committed artefacts on 2026-10-23. Every number below is
reproducible with the commands in this file. Where a metric was **not** measured,
it is labelled as such rather than inferred.

## 1. Scope and benchmark construction

- Corpus: 112 schemes in `data/schemes.json`.
- Eligibility benchmark: 133 hand-labelled cases in
  `eligibility_test_cases_v2.json`, covering all 21 paper benchmark schemes and
  the three output classes.
- Retrieval benchmark: 270 queries in `retrieval_benchmark.json` — 245
  single-relevant, 15 multi-relevant, 10 out-of-scope.
- Multilingual benchmark: 24 queries in `multilingual_benchmark.json` (Romanised
  Hinglish and Devanagari).
- RAG benchmark: 88 prompts in `rag_test_cases_v2.json`, spanning eligibility,
  benefits, documents, process, discovery, incomplete profiles, state schemes,
  out-of-scope questions, multilingual questions, and adversarial prompts.

The eligibility engine is deterministic. The LLM receives the rule-engine
verdicts and explains them; it is instructed never to upgrade
`Insufficient Information` to eligible. Retrieval evaluation is separate from
answer generation so a retrieval failure is not hidden by fluent prose.

## 2. Eligibility engine — strict v2 benchmark

Original benchmark, unchanged for comparability:

| Metric | Value |
| --- | --- |
| Cases | 133 |
| Correct | 120 |
| Accuracy | **90.23%** |
| 95% Wilson CI for accuracy | **83.99–94.20%** |
| Macro precision | 85.56% |
| Macro recall | 92.03% |
| Macro F1 | 86.43% |
| False `Eligible` | **0** |
| False `Ineligible` | **0** |

Per class:

| Class | Precision | Recall | F1 | Support | Predicted |
| --- | --- | --- | --- | --- | --- |
| Eligible | 100.00% | 80.77% | 89.36% | 52 | 42 |
| Ineligible | 100.00% | 95.31% | 97.60% | 64 | 61 |
| Insufficient Information | 56.67% | 100.00% | 72.34% | 17 | 30 |

Confusion matrix (rows = expected, columns = predicted):

| | Eligible | Ineligible | Insufficient |
| --- | --- | --- | --- |
| **Eligible** | 42 | 0 | 10 |
| **Ineligible** | 0 | 61 | 3 |
| **Insufficient** | 0 | 0 | 17 |

The 13 remaining errors are all conservative:

- 10 `Eligible` → `Insufficient Information`
- 3 `Ineligible` → `Insufficient Information`
- 0 unsafe upgrades or contradictions

The error taxonomy in `eligibility_engine_metrics.json` accounts for all 13
(`unclassified_cases: 0`). This is the number to quote for generalisation: the
test set is small, and the confidence interval is wide.

### Why precision for `Insufficient Information` is 56.67%

The engine treats an absent mandatory attribute as unknown, never as satisfied.
That deliberately over-produces `Insufficient Information` rather than risk a
false `Eligible`. In a welfare tool this is the safer error direction, but it
lowers precision for the uncertainty class.

## 3. Eligibility engine — audited v3 regression suite

`eligibility_test_cases_v3.json` and `eligibility_test_audit.json` document 19
audited corrections. The audit protocol is explicit:

| Action | Count | Meaning |
| --- | --- | --- |
| `engine_fix` | 5 | A rule or normaliser was wrong; the original label was retained. |
| `complete_profile` | 12 | The case rationale already stated a missing fact (for example, a women-only scheme with no gender field); the fixture was completed. |
| `relabel` | 2 | The expected label could not be derived from the supplied facts; adjudicated to `Insufficient Information`. |

The corrected suite scores 133/133 (100%, Wilson CI 97.19–100%). **This is a
regression suite, not a held-out benchmark**, because the fixture corrections
were made with knowledge of the expected labels. It is useful for catching
regressions, not for claiming generalisation. The original v2 file is untouched.

Notable genuine fixes:

- AICTE Pragati now requires a technical programme and treats the two-girls
  family cap as mandatory.
- PMEGP accepts `Class 10` as satisfying the Class 8 education gate.
- Sukanya Samriddhi checks existing accounts rather than the number of girls.
- JSY requires delivery in a recognised facility.
- Delivery place text (`government hospital`, `home`) is normalised into the
  facility-delivery condition.

## 4. Retrieval — English benchmark

245 single-relevant queries:

| Method | Top-1 | Hit@3 | P@3 | R@3 | F1@3 | MRR |
| --- | --- | --- | --- | --- | --- | --- |
| Dense (`Xenova/all-MiniLM-L6-v2`) | 77.96% | 92.65% | 30.88% | 92.65% | 46.33% | 0.8543 |
| BM25 | 87.76% | 96.33% | 32.11% | 96.33% | 48.16% | 0.9210 |
| **Hybrid (dense + BM25 RRF)** | **89.80%** | **98.78%** | **32.93%** | **98.78%** | **49.39%** | **0.9415** |

15 multi-relevant queries:

| Method | Top-1 | Hit@3 | P@3 | R@3 | F1@3 | MRR |
| --- | --- | --- | --- | --- | --- | --- |
| Dense | 80.00% | 93.33% | 60.00% | 66.67% | 63.16% | 0.8833 |
| BM25 | 73.33% | 93.33% | 60.00% | 65.56% | 62.65% | 0.8222 |
| **Hybrid** | **86.67%** | **100.00%** | **66.67%** | **72.22%** | **69.33%** | **0.9333** |

Overall in-scope (260 queries, Hit@3):

| Method | Top-1 | Hit@3 | MRR |
| --- | --- | --- | --- |
| Dense | 78.08% | 92.69% | 0.8560 |
| Hybrid | **89.62%** | **98.85%** | **0.9410** |

Retrieval latency in this environment (270 queries):

| Method | Mean | Median | p95 | Max |
| --- | --- | --- | --- | --- |
| Dense | 30.7 ms | 28 ms | 53 ms | 54 ms |
| Hybrid | 374 ms | 358 ms | 598 ms | 722 ms |

Hybrid is slower because it queries Chroma for candidates and scores the full
BM25 corpus. Chat latency is dominated by the LLM, not retrieval.

**Deployment note:** these retrieval numbers come from the Docker/Chroma stack.
The public demo now uses the same all-in-one image on Render, so its chat path is
the dense + BM25 hybrid while the container is awake. Render's free tier has no
persistent disk and sleeps after idle; Chroma is rebuilt from committed
precomputed embeddings on wake. The retained Vercel Function API is still
BM25-only and reports that honestly. See
[`DEPLOYMENT_VERCEL.md`](DEPLOYMENT_VERCEL.md).

### Retrieval complementarity

For the 245 single-relevant English queries:

- dense Top-1 correct: 191/245
- BM25 Top-1 correct: 215/245
- union ceiling: 231/245 (94.29%)
- dense Top-3 correct: 227/245
- BM25 Top-3 correct: 236/245
- union ceiling: 240/245 (97.96%)

The union ceiling is an upper bound for an oracle fusion, not a result achieved
by the current system. Hybrid actually achieves 220/245 Top-1 (89.80%) and
242/245 Hit@3 (98.78%). The gap between the ceiling and the achieved result is
the remaining fusion/reranking opportunity.

## 5. Retrieval — Hinglish and Devanagari

24 queries written in Romanised Hinglish or Devanagari:

| Method | Top-1 | Hit@3 | P@3 | R@3 | F1@3 | MRR |
| --- | --- | --- | --- | --- | --- | --- |
| Dense (English-only embedder) | 41.67% | 58.33% | 19.44% | 56.25% | 28.90% | 0.4944 |
| BM25 | 50.00% | 66.67% | 22.22% | 64.58% | 33.07% | 0.5903 |
| **Hybrid + Hinglish/Devanagari bridge** | **75.00%** | **91.67%** | **31.94%** | **89.58%** | **47.10%** | **0.8438** |

The dense model is English-only, so the multilingual gap is expected. The hybrid
bridge preserves the original query tokens, appends English equivalents, and
boosts exact acronym/alias matches. The remaining six Top-1 failures are mostly
near misses where a reasonable alternative ranks first (for example, a PMAY
component instead of the umbrella scheme, or a related ration/ONORC scheme).
They are reported as failures, not relabelled. Hybrid latency on this set was
242 ms mean / 267 ms p95.

## 6. RAG answer suite

88 answers completed:

| Metric | Value |
| --- | --- |
| Answers completed | 88/88 |
| Errors / empty answers | 0 |
| Mean sources per answer | 3.0 |
| Mean answer length | 1,281 characters |
| Mean latency | 9.59 s |
| Median latency | 10.54 s |
| p95 latency | 14.60 s |
| Max latency | 15.87 s |

Five initially empty responses and one provider `429` were retried during that
run. The current code adds bounded exponential backoff for `429`, timeouts,
5xx responses, and empty completions; a partially streamed answer is never
retried because that would duplicate text.

### Automatic support checks (not groundedness)

`npm run quality:rag` writes `rag_quality_metrics.json` and
`rag_manual_scoring_sheet.csv`.

| Check | Value |
| --- | --- |
| Source-name coverage | 84.85% |
| Bracket citation marker present | 67.05% |
| Official URL present | 30.68% |
| Confirmation/official-authority language | 81.82% |
| Actionable next step | 85.23% |
| Answers with a currency amount absent from retrieved evidence | 11/88 |

These are diagnostics. They do **not** establish factual groundedness: a
fabricated sentence can contain a valid scheme name, and a correct answer can
omit a bracket marker. The manual rubric is in
`backend/GROUNDEDNESS_RUBRIC.md`; the scoring sheet has `groundedness_1_5`,
`relevance_1_5`, and notes columns. Until two annotators (or one audited rater)
fill it, the paper must say groundedness was not measured.

## 7. Out-of-scope separation (dense diagnostic)

For the 10 out-of-scope English queries, the mean top-1 distance was 1.439,
versus 0.914 for in-scope queries. This is a distance diagnostic, not a calibrated
abstention classifier. The API also has an explicit lexical/dense fallback and
the prompt is instructed to say when evidence is insufficient.

## 8. What changed in v2 results

The earlier committed eligibility run reported 86.47% accuracy. After the rule
and normaliser fixes, the same v2 benchmark scores 90.23%. The improvement is
not from changing labels: `eligibility_test_cases_v2.json` is byte-for-byte
unchanged. The v3 file is a separate, documented audit.

The earlier retrieval table reported only dense and BM25. Hybrid is now the
default retrieval path and is evaluated end-to-end. The reported dense/BM25
numbers remain the baselines, not the system result.

## 9. Reproduction commands

```bash
cd backend
npm test
node run_eligibility_eval.js --verbose
node run_eligibility_eval.js --dataset eligibility_test_cases_v3.json
node scripts/build-eligibility-audit.js
node run_eval_v2.js retrieval
node run_eval_v2.js hybrid
node run_eval_v2.js multilingual-dense
node run_eval_v2.js multilingual-lexical
node run_eval_v2.js multilingual
npm run quality:rag
```

The retrieval/hybrid commands require MongoDB, ChromaDB, and the seeded corpus.

## 10. Honest limitations

- The 133-case eligibility set is small; the 95% CI is wide.
- The audited v3 suite is not held out.
- Groundedness and relevance are not yet scored by humans.
- The multilingual benchmark has 24 queries and was authored by the project
  team; it is a diagnostic, not a linguistic benchmark.
- The embedding model is English-only.
- Hybrid retrieval latency is environment-dependent.
- Application checklists and reminders are derived/personal features, not
  official scheme data.
