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
| **Deterministic eligibility engine** (three outcome classes) | Working, 133-case evaluation |
| Scheme directory with state / category / level filters, bookmarks, voice search | Working |
| Structured eligibility form (full-corpus and need-based modes) | Working |
| Accounts, query history, saved schemes, feedback | Working |
| Grounded answers with a verdict per retrieved scheme | Working |
| Unit tests for the rule engine and rule coverage | `npm test` (16 tests) |

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
    retrieval.js                Chroma search, lexical fallback
    vector-index.js             shared Chroma indexing / sync
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
  test/eligibility.test.js      16 unit tests
  run_eligibility_eval.js       133-case reproducible evaluation
frontend/
  src/lib/api.js                single API client (JWT, SSE)
  src/lib/profile.js            canonical client profile
  src/pages/Chat.jsx            streaming chat + verdict badges
  src/pages/EligibilityForm.jsx structured check, 3 result tabs
  src/pages/BrowseSchemes.jsx   directory, filters, bookmarks, mic
  src/pages/History.jsx         query history + saved schemes
data/schemes.json               112 schemes
chroma_db/                      canonical Chroma persistence directory
Dockerfile                      production image (API + built SPA)
docker-compose.yml              app + MongoDB + Chroma
DEPLOYMENT.md                   self-hosted / managed deployment runbook
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
hosting, backups, environment variables and troubleshooting.

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
npm run eval:eligibility     # 133 labelled cases -> eligibility_engine_metrics.json
npm test                     # engine + rule-coverage unit tests
```

Latest eligibility-engine result (`eligibility_engine_metrics.json`):

| Metric | Value |
| --- | --- |
| Cases | 133 |
| Accuracy | 86.47% |
| Macro precision / recall / F1 | 82.78 / 89.06 / 82.51 |
| False-positive "Eligible" | **0** |
| False "Ineligible" | 1 |
| Over-cautious (Eligible label → Insufficient) | 12 |
| Missed uncertainty | 0 |

The six-rule confusion matrix is stored in the same file. `Insufficient
Information` has low precision (50%) because it is the safe fallback whenever
any mandatory attribute is absent; recall is 100%. This trade-off is deliberate:
for a welfare tool, wrongly telling someone they are ineligible is worse than
asking one more question.

### Reconciliation with the paper

The drafted paper reports **63 retrieval queries** (92.06% Top-1, 98.41%
Recall@3) and **30 eligibility cases**. The committed artefacts in this
repository are larger and more conservative:

| Source | Queries / cases | Dense Top-1 | Lexical (BM25) Top-1 |
| --- | --- | --- | --- |
| Paper draft | 63 | 92.06% | — |
| `retrieval_metrics.json` | 245 single-relevant | 77.96% (Hit@3 92.65%) | 87.76% (Hit@3 96.33%) |
| `eligibility_engine_metrics.json` | 133 | — | — |

Why they differ: the 63-query set was an earlier, easier subset; the 245-query
benchmark adds paraphrases and hard negatives. The repository numbers are the
ones that reproduce from committed data, so the paper should either quote the
245-query benchmark or state that 63 queries are a subset. The lexical baseline
outperforming dense Top-1 is reported rather than hidden; the running system
therefore keeps a lexical fallback when Chroma is unavailable. The eligibility
evaluation was expanded from 30 to 133 cases for the same reason — it is the
number that the committed script actually reproduces.

## Limitations

- Auto-derived rules for the 63 non-curated schemes cover only unambiguous
  metadata; they are labelled "auto-derived" in the UI.
- State-specific scheme lists are not exhaustive; `Other` is offered when a
  state is not in the fixed selector.
- Voice search depends on the browser Web Speech API (Chrome/Edge).
- The LLM can still phrase an explanation poorly; the verdict badge and the
  per-condition breakdown are the authoritative parts of an answer.
