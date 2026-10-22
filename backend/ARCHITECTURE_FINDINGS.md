# Architecture findings — eligibility matching & response generation

> **Status: superseded (Phase 1 implemented).** This note describes the code
> before the deterministic eligibility engine existed. The system now has
> `backend/src/eligibility/` (rules + evaluator) and the LLM may only explain
> the verdict. Keep this file as a record of the original gap analysis.

From inspecting the actual code (`backend/server.js`, `backend/embed-schemes.js`,
`frontend/src/pages/EligibilityForm.jsx`, `frontend/src/pages/Chat.jsx`):

## There is no separate eligibility-matching engine
- `EligibilityForm.jsx` collects structured fields (age, income, occupation,
  state, category, land ownership, etc.) via `useState`, but only uses them
  to build **one natural-language sentence** (`buildQuery()`), e.g. *"I am a
  34-year-old male, living in a rural area of Uttar Pradesh... What government
  welfare schemes am I eligible for?"*
- That sentence is POSTed to `/api/query` — **the exact same endpoint the
  chat UI calls**, with the exact same retrieval + Groq generation logic in
  `server.js`.
- The form's own copy literally says: *"checks it against the same scheme
  database and AI used by the Chat Assistant — no separate scoring system,
  no fabricated match percentages."*
- There is no rules engine, no threshold comparisons, no classifier anywhere
  in `backend/*.js` — `grep` for eligibility/rule/score/classifier logic in
  the backend turns up nothing beyond passing the `eligibility` object into
  the Chroma document text and the Groq prompt as unstructured JSON.

## What this means for the evaluation
"Eligibility matching" in SchemeSaathi is not a separate classifier to
benchmark — **eligibility determination is entirely performed by the Groq
LLM's free-text reasoning**, inside the same RAG pipeline used for every
other question. Concretely, this means:
- Part 1 (eligibility) and Part 2 (RAG generation) in the paper are testing
  the **same underlying system** from two angles: Part 1 uses
  eligibility-focused queries with known ground truth (Eligible / Ineligible
  / Insufficient Information) and grades the *conclusion*; Part 2 uses a
  broader query set and grades groundedness/relevance/unsupported claims
  more generally, including an `eligibility_correctness` dimension for the
  queries that touch on it.
- This is worth stating explicitly and positively in the paper's
  Methodology section — it's an accurate description of a valid design
  choice (using a general-purpose LLM for eligibility reasoning instead of
  a brittle rules engine), not a flaw to hide. It does mean you should not
  claim to have evaluated "two components" as if they were architecturally
  independent; frame it as one generation pipeline evaluated from two
  complementary angles.
