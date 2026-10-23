# SchemeSaathi

SchemeSaathi is a web-based conversational application that helps citizens discover government welfare schemes based on their personal circumstances.

Users can provide details such as age, income, occupation, location, education, and specific needs through a chat interface. The system uses Retrieval-Augmented Generation (RAG) to retrieve relevant scheme information from its knowledge base and generate simple responses covering scheme details, eligibility, and benefits. The platform aims to simplify welfare scheme discovery and demonstrate the use of conversational AI for public-service information.

**7.2 Software Requirements:**

**Programming Language:** Python, JavaScript

**Frontend:** React.js + Vite, HTML, CSS

**Backend/API:** Express, Node.js

**AI/NLP:** Large Language Model (LLM), Embedding Model, Retrieval-Augmented Generation (RAG)

**Vector Database:** ChromaDB

**LLM:** Groq

**Database:** MongoDB / PostgreSQL, depending on implementation requirements

**IDE:** Visual Studio Code

**Version Control:** Git, GitHub

**System Architecture:** <img width="1035" height="625" alt="image" src="https://github.com/user-attachments/assets/20bfbcc1-3ed2-4b35-b387-42f9e4416edd" />

---

## What is implemented

| Area | Status |
| --- | --- |
| Conversation assistant (RAG + streaming answers) | Working |
| **Deterministic eligibility engine** (three outcome classes) | Working, 133-case strict benchmark + audited regression suite |
| **Hybrid retrieval** (dense Chroma + BM25, reciprocal-rank fusion) | Working, evaluated |
| Hinglish / Devanagari query bridge | Working, 24-query evaluation |
| Scheme directory with filters, bookmarks, voice search, comparison | Working |
| **My Plan**: saved profile, per-scheme document checklist, personal reminders | Working (device-local) |
| Structured eligibility form (full-corpus and need-based modes) | Working |
| Accounts, query history, saved schemes, feedback | Working |
| Grounded answers with a verdict per retrieved scheme | Working; automatic quality checks, manual groundedness scoring pending |
| Unit tests for the rule engine, coverage, retrieval and expansion | `npm test` (26 tests) |

> **Academic honesty:** this is an informational tool, not an official eligibility decision. Every answer tells the user to confirm details on the official portal.

## Architecture

```
React (Vite)  ──HTTP/SSE──▶  Express API
                               │
                 ┌─────────────┼──────────────────┐
                 ▼             ▼                  ▼
          MongoDB          ChromaDB           Groq LLM
      schemes, users,   112 embeddings     explanation only
      history, bookmarks  (collection:      │
                 │            schemes)       │
                 └──────► Eligibility rules engine ◄──┘
                          (deterministic verdict)
```

The LLM never decides eligibility. The rule engine produces an authoritative
`Eligible` / `Ineligible` / `Insufficient Information` verdict from explicit
conditions; the LLM is instructed to explain that verdict and to never upgrade
a missing answer to "eligible".

## Repository layout

```
backend/
  server.js                     API + production SPA server
  src/
    config.js                   env + feature checks
    db.js                       MongoDB collections
    retrieval.js                Chroma search, hybrid search, lexical fallback
    vector-index.js             shared Chroma indexing / sync
    search/hybrid.js            BM25 + reciprocal-rank fusion + query expansion
    llm.js                      grounded prompt + streaming
    eligibility/
      profile.js                alias/unit normalisation
      evaluate.js               three-class rule evaluator
      auto-rules.js             conservative rule derivation
      curated-rules.json        49 hand-verified rule sets
      rules.json                generated: 112 rule sets
      service.js                attach rules, rank, missing info
    routes/                     health, auth, schemes, eligibility, query, account
  scripts/build-rules.js        curated + auto -> rules.json
  scripts/bootstrap.js          idempotent first-run seed + embed
  test/                        26 unit tests (engine, rules, hybrid, regressions)
  run_eligibility_eval.js       133-case reproducible evaluation
frontend/
  src/lib/api.js                single API client (JWT, SSE)
  src/lib/profile.js            canonical client profile
  src/lib/checklist.js          derived document/step guidance
  src/lib/plan.js               device-local plan + reminders
  src/lib/compare.js            device-local comparison
  src/pages/Chat.jsx            streaming chat + verdict badges
  src/pages/EligibilityForm.jsx structured check, 3 result tabs
  src/pages/BrowseSchemes.jsx   directory, filters, bookmarks, mic, compare/plan
  src/pages/Plan.jsx            saved profile, checklist, reminders
  src/pages/Compare.jsx         side-by-side comparison
  src/pages/History.jsx         query history + saved schemes
data/schemes.json               112 schemes
chroma_db/                      canonical Chroma persistence directory
Dockerfile                      production image (API + built SPA)
docker-compose.yml              app + MongoDB + Chroma
DEPLOYMENT.md                   self-hosted / managed deployment runbook
DEPLOYMENT_VERCEL.md            Vercel frontend + Docker API runbook
RESULTS.md                      evaluation tables, methodology and caveats
```

## Prerequisites

- Node.js 20.19+ (tested on Node 24)
- MongoDB running locally, or an Atlas connection string
- Python + `chromadb` CLI **or** the bundled server, for the vector store
- A Groq API key
- Docker + Compose v2.24+ only for the container deployment path

## Setup

1. **Install dependencies**

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

   On Linux, run `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install` in
   `backend/` so onnxruntime does not download optional CUDA binaries. The
   application only uses the CPU execution provider. The Docker image sets
   this automatically.

2. **Configure the backend**

   ```bash
   cp backend/.env.example backend/.env
   ```

   Fill in at least:

   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017
   MONGODB_DB=schemesaathi
   GROQ_API_KEY=...
   JWT_SECRET=...            # long random string
   CHROMA_URL=http://localhost:8000
   CHROMA_COLLECTION=schemes
   PORT=5000
   ```

3. **Start ChromaDB** (from `backend/`, using the canonical store at the repo root)

   ```bash
   npm run chroma
   # equivalent to: chroma run --path ../chroma_db --port 8000
   ```

4. **Seed MongoDB and embeddings** (only needed on a fresh machine)

   ```bash
   npm run bootstrap   # idempotent: imports schemes + builds vectors
   npm run rules       # curated-rules.json + auto rules -> rules.json
   ```

   `npm run migrate` and `npm run embed` remain available as separate,
   destructive steps when you need to refresh one store in isolation.

5. **Start the API**

   ```bash
   npm start           # or: npm run dev
   ```

6. **Start the frontend**

   ```bash
   cd ../frontend
   npm run dev
   ```

   Open http://localhost:5173. To point at a different API host, copy
   `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE`.

7. **Verify**

   ```bash
   curl http://localhost:5000/api/health
   ```

   A healthy instance reports `"status":"ok"`, MongoDB/Chroma `"up"`, 112
   schemes, 112 embeddings and 112 rule sets (49 hand-reviewed).

## Deployment

A production build is self-contained: Express serves the compiled React app and
the API on one origin, and Docker Compose provides MongoDB and Chroma.

```bash
cp .env.deploy.example .env      # add GROQ_API_KEY + a 32+ char JWT_SECRET
docker compose up -d --build
curl http://localhost:5000/api/health
```

The first boot imports all 112 schemes and builds the vector index
automatically. See **[DEPLOYMENT.md](DEPLOYMENT.md)** for HTTPS/Caddy, managed
hosting, backups, environment variables and troubleshooting. For a split
deployment with the SPA on Vercel and the API/Chroma on Render or Railway, see
**[DEPLOYMENT_VERCEL.md](DEPLOYMENT_VERCEL.md)**.

## The eligibility engine

### Three outcome classes

| Class | Condition |
| --- | --- |
| `Eligible` | every mandatory condition is satisfied |
| `Ineligible` | at least one mandatory condition is contradicted |
| `Insufficient Information` | nothing is contradicted, but at least one condition cannot be checked |

A missing attribute is **never** coerced into `satisfied`. Conditions marked
`optional: true` are shown for context but do not change the class. The special
operator `any_of` accepts alternative condition groups (used for cascading
central/state scheme overlaps).

### Rule coverage

- **49 schemes** have hand-curated rules (`curated-rules.json`), including all
  21 benchmark schemes from the paper.
- **63 schemes** have conservatively auto-derived rules (`auto-rules.js`):
  only conditions that can be read directly from structured scheme metadata
  are encoded; anything uncertain is left out rather than guessed.
- **10 universal schemes** have no restrictive conditions and are open to all.

`npm run rules` regenerates `rules.json` from the curated file and the
auto-deriver. `GET /api/eligibility/rules/:schemeId` exposes the exact
conditions used for a scheme, so a reviewer can audit any verdict.

### Canonical profile

The client sends friendly values; `profile.js` maps synonyms and units onto one
canonical set (`age`, `income`, `state`, `area`, `category`, `occupation`,
`land_acres`, `land_owned`, `disability_percent`, ...). Examples:

- `family_income_lakh: 1.5` → `income: 150000`
- `monthly_income: 12000` → `income: 144000`
- `state: "mh"` → `Maharashtra`
- `land_hectares: 1` → `land_acres: 2.471`
- `has_udid_card: true` → `disability_percent: 40` (a UDID card is issued at
  40% or above; this is a documented domain inference, not a guess about
  severity)

Chat messages are parsed deterministically too: a sentence such as *"I am a
45-year-old farmer in Maharashtra with 1.5 acres"* yields `age`, `state`,
`occupation` and `land_acres` without an LLM. Values stated in the current
message take precedence; the saved structured profile fills any attributes the
message omits. `POST /api/query` returns the merged `attributes` so the UI can
show what was checked.

## API summary

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | service and knowledge-base status |
| POST | `/api/register`, `/api/login` | account + JWT |
| GET | `/api/me`, `/api/profile` | current user / saved profile |
| GET | `/api/schemes?search=&state=&category=&level=` | directory search |
| GET | `/api/schemes/filters` | filter values |
| GET | `/api/schemes/:id` | one scheme with rule set |
| POST | `/api/eligibility/check` | one scheme, explicit profile |
| POST | `/api/eligibility/match` | full-corpus or need-based match |
| GET | `/api/eligibility/rules/:schemeId` | encoded conditions |
| POST | `/api/query` | RAG answer as JSON |
| POST | `/api/query/stream` | same answer as Server-Sent Events |
| GET/DELETE | `/api/history`, `/api/history/:id` | query history |
| GET/POST/DELETE | `/api/bookmarks` | saved schemes |
| POST | `/api/feedback` | answer feedback |

`POST /api/eligibility/match` accepts `{ profile, need?, limit? }`. Without
`need` it evaluates the whole 112-scheme corpus; with `need` it semantically
retrieves candidates first. `limit` caps each result group in the response,
while `totals` always reports the true counts.

## Evaluation

Reproduce the numbers with:

```bash
cd backend
npm test                     # 26 unit tests: engine, coverage, hybrid, regressions
npm run eval:eligibility     # strict 133-case benchmark
npm run eval:eligibility:v3  # audited correction/regression suite
node run_eval_v2.js retrieval          # dense Chroma baseline
node run_eval_v2.js hybrid             # dense + BM25 fusion
node run_eval_v2.js multilingual-dense
node run_eval_v2.js multilingual-lexical
node run_eval_v2.js multilingual
npm run quality:rag          # automatic RAG support checks + manual scoring sheet
```

### Eligibility engine

The headline result is the **original strict 133-case benchmark**, kept
unchanged so that the comparison is reproducible. After the rule fixes it
scores 90.23% accuracy (95% Wilson CI 83.99–94.20), macro precision 85.56%,
macro recall 92.03%, and macro F1 86.43%.

| Class | Precision | Recall | F1 | n |
| --- | --- | --- | --- | --- |
| Eligible | 100.00% | 80.77% | 89.36% | 52 |
| Ineligible | 100.00% | 95.31% | 97.60% | 64 |
| Insufficient Information | 56.67% | 100.00% | 72.34% | 17 |

There are **zero false-`Eligible`** and **zero false-`Ineligible`** cases. The
13 remaining errors are all conservative: 10 expected-`Eligible` cases return
`Insufficient Information`, and 3 expected-`Ineligible` cases return
`Insufficient Information`. The committed `run_eligibility_eval.js` classifies
all 13 into the five-cell error taxonomy, with `unclassified_cases: 0`.

A separate **audited v3 suite** (`eligibility_test_cases_v3.json`) documents 19
corrections. The audit distinguishes three actions: engine fixes, completing a
fixture with a fact already stated in its rationale, and relabelling an
overreaching expected label. The corrected suite scores 100% by construction and
is therefore a **regression suite, not a held-out generalisation benchmark**.
The original v2 file is not modified. See `eligibility_test_audit.json` for the
per-case evidence.

### Retrieval

English benchmark: 270 queries, of which 245 have one relevant scheme and 15
have multiple relevant schemes.

| Method | Single Top-1 | Single Hit@3 | Single MRR | Multi Top-1 | Multi Hit@3 |
| --- | --- | --- | --- | --- | --- |
| Dense (`all-MiniLM-L6-v2`) | 77.96% | 92.65% | 0.8543 | 80.00% | 93.33% |
| BM25 | 87.76% | 96.33% | 0.9210 | 73.33% | 93.33% |
| Hybrid (dense + BM25 RRF) | **89.80%** | **98.78%** | **0.9415** | **86.67%** | **100.00%** |

The hybrid result is not a guarantee: it is an actual end-to-end run of the
retrieval function used by the API. Dense retrieval latency was 30.7 ms mean /
53 ms p95; hybrid retrieval was 374 ms mean / 598 ms p95 in this environment,
because it queries Chroma and scores the full BM25 corpus. The LLM dominates
end-to-end chat latency.

Hinglish/Hindi benchmark: 24 queries written in Romanised Hinglish or
Devanagari.

| Method | Top-1 | Hit@3 | MRR |
| --- | --- | --- | --- |
| Dense | 41.67% | 58.33% | 0.4944 |
| BM25 | 50.00% | 66.67% | 0.5903 |
| Hybrid + query bridge | **75.00%** | **91.67%** | **0.8438** |

The remaining hybrid failures are mostly near misses where a reasonable
alternative scheme ranks first (for example, a PMAY component instead of the
umbrella scheme). These are reported as failures rather than relabelled.

### RAG answers

The 88-answer suite completed with 0 errors/empty answers, 3.0 sources per
answer, and mean answer length 1,281 characters. Automatic support checks
(`rag_quality_metrics.json`) report 84.85% source-name coverage, 67.05% bracket
citation-marker rate, 81.82% confirmation language, 85.23% actionable next
steps, and 11 answers containing a currency amount absent from their retrieved
evidence.

These are **not** groundedness scores. The manual 1–5 rubric and scoring sheet
are in `backend/GROUNDEDNESS_RUBRIC.md` and
`backend/rag_manual_scoring_sheet.csv`; groundedness/relevance should not be
claimed until that sheet is scored and checked for agreement.

### Reconciliation with the paper

The drafted paper reports 63 retrieval queries and 30 eligibility cases. The
committed artefacts are larger and more conservative. The 63-query set was an
earlier, easier subset; the 245-query benchmark adds paraphrases and hard
negatives. The paper should quote the committed benchmark, or state explicitly
that 63 queries are a subset. The eligibility benchmark was expanded from 30 to
133 cases for the same reason — it is the number the script actually
reproduces. Full tables and caveats are in [`RESULTS.md`](RESULTS.md).


## Limitations

- Auto-derived rules for the 63 non-curated schemes cover only unambiguous
  metadata; they are labelled "auto-derived" in the UI.
- State-specific scheme lists are not exhaustive; `Other` is offered when a
  state is not in the fixed selector.
- Voice search depends on the browser Web Speech API (Chrome/Edge).
- The LLM can still phrase an explanation poorly; the verdict badge and the
  per-condition breakdown are the authoritative parts of an answer.
- Manual groundedness/relevance scoring is pending. The automatic checks in
  `rag_quality_metrics.json` are diagnostics, not a substitute.
- My Plan and comparison are stored in the browser, not synced across devices.
  Reminders use a user-chosen target date; the scheme dataset has no official
  deadline field.
- Application checklists are derived from scheme text plus commonly requested
  documents, not an official checklist. The UI labels them as a preparation aid.
- The embedding model is English-only. Hinglish/Devanagari quality comes from
  the query bridge and BM25, not from a multilingual embedding model.
- The current production stack needs a long-running API and a reachable Chroma
  service; a Vercel-only deployment would require a vector-store migration.
  See [`DEPLOYMENT_VERCEL.md`](DEPLOYMENT_VERCEL.md).
