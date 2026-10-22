# Scoring rubric — eligibility & RAG generation evaluation

Applies to `eligibility_results_raw.json` and `rag_results_raw.json`
produced by `run_live_eval.js`. Every score below is assigned by reading
the actual `raw_answer` text against the actual `ground_truth` /
`eligibility_source` fields — not by an automated grader model. If you
send me the two `*_results_raw.json` files, I will fill these fields in
myself, case by case, and show my reasoning for each one so every number
in the paper traces back to a specific case.

## Part A — Eligibility cases (`eligibility_results_raw.json`)

For each case, read `raw_answer` and decide what the system actually told
the user, then fill in:

- **`predicted_eligibility`**: one of `"Eligible"`, `"Ineligible"`,
  `"Insufficient Information"`. Insufficient Information means the answer
  hedges / asks for more details / says it can't be sure — not that the
  answer is merely polite about a clear yes or no.
- **`prediction_correct`**: `true` if `predicted_eligibility ==
  ground_truth`, else `false`.
- **`scorer_notes`**: one sentence citing the specific phrase in
  `raw_answer` that drove the label, and, for incorrect predictions, which
  eligibility condition (from `eligibility_source`) the answer got wrong
  or ignored.

**Aggregate metrics** (computed after all 30 are labeled), as a 3×3
confusion matrix over {Eligible, Ineligible, Insufficient Information}:
- Accuracy = correct / 30
- Per-class precision/recall/F1 (one-vs-rest), plus macro-averaged
  precision/recall/F1 across the three classes
- Report separately for the `boundary` and `insufficient_information`
  category subsets, since those are the cases most likely to fail and are
  the most interesting for a paper's error analysis

## Part B — RAG generation queries (`rag_results_raw.json`)

For each query, score against the retrieved `sources` and the underlying
`schemes.json` (not against outside knowledge of Indian schemes):

- **`groundedness_score`** (0–2): `0` = contains claims not supported by
  the retrieved scheme data; `1` = mostly grounded with a minor
  unsupported detail; `2` = every factual claim traces to a retrieved
  scheme field.
- **`relevance_score`** (0–2): `0` = doesn't address the question asked;
  `1` = partially addresses it; `2` = directly and completely addresses it.
- **`eligibility_correctness_score`** (0–2, only for queries that discuss
  eligibility — mark `n/a` otherwise): `0` = eligibility conclusion is
  wrong; `1` = right conclusion but wrong or incomplete reasoning; `2` =
  correct conclusion with correct reasoning traceable to the eligibility
  fields.
- **`unsupported_claims_found`**: list (can be empty) of specific
  sentences/numbers in `raw_answer` that are not present anywhere in
  `schemes.json` for the retrieved schemes — e.g. an invented interest
  rate, a made-up processing time, a fabricated document requirement.

**Aggregate metrics**: mean groundedness, mean relevance, mean eligibility
correctness (over applicable queries only), and total count + rate of
unsupported claims per query, broken down by `category` (eligibility
question / benefit / document / process / discovery / incomplete profile
/ not eligible / insufficient retrieved info) so the paper can show where
the system is strongest and weakest.

## Why not an automatic "AI judge" score

An LLM-as-judge score would need to call an LLM (network), and more
importantly would just be evaluating one model's output using another
model's opinion — not something a reviewer can independently verify.
Every score above is instead traceable to a specific sentence in a
specific response and a specific field in `schemes.json`, so it can be
spot-checked by hand.
