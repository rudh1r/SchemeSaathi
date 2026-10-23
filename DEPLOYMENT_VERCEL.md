# Vercel deployment

Two Vercel projects currently serve the app:

| Project | Root directory | URL |
|---|---|---|
| `schemesaathi` | `frontend` | <https://schemesaathi-chi.vercel.app> |
| `schemesaathi-api` | `backend` | <https://schemesaathi-api-delta.vercel.app> |

The API is an Express app wrapped by a Vercel Function
([`backend/api/index.js`](backend/api/index.js)) and connected to MongoDB Atlas.
This makes the deployment self-contained: no laptop tunnel and no always-on
server is required for the demo.

**Retrieval difference:** the serverless API sets `DISABLE_CHROMA=true`, so it
uses the BM25 lexical fallback. The dense Chroma + BM25 hybrid used in the
evaluation needs a long-running Chroma process; run the Docker path below (or a
hosted Chroma endpoint) when you want the full hybrid stack. The public demo is
honest about this: `/api/health` reports `"chroma":"down (lexical fallback
active)"` and `"status":"degraded"` while chat, eligibility, browse, auth and
history remain functional.

```
Vercel (static SPA)  ──HTTPS──>  Vercel Function (Express API)
                                      ├── MongoDB Atlas
                                      └── in-process BM25 over 112 schemes
```

The frontend calls the API through `VITE_API_BASE`; the API allows the frontend
origin through `CORS_ORIGINS`.

## 1. Vercel projects

### API project (`schemesaathi-api`)

1. Import the GitHub repository and set **Root Directory** to `backend`.
2. Framework preset: **Express** (or "Other"); no build command is required.
3. Add the environment variables in the table below for **Production**.
4. Deploy. [`backend/vercel.json`](backend/vercel.json) rewrites `/api/*` to the
   single function entry point while preserving the original Express path.
5. Disable Vercel Authentication for the project if you want a public demo:
   `vercel project protection disable schemesaathi-api --sso`.

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas SRV URI |
| `MONGODB_DB` | `schemesaathi` |
| `GROQ_API_KEY` | Groq key |
| `JWT_SECRET` | at least 32 random characters |
| `CORS_ORIGINS` | `https://schemesaathi-chi.vercel.app` (add other origins as needed) |
| `TRUST_PROXY` | `true` |
| `DISABLE_CHROMA` | `true` |
| `RATE_LIMIT_MAX` | `60` (optional; defaults to 30/min/IP) |

`backend/api/index.js` opens the Atlas connection lazily and caches it for warm
invocations. `backend/src/retrieval.js` keeps Chroma lazy, so the function does
not load the vector client when `DISABLE_CHROMA=true`.

### Frontend project (`schemesaathi`)

1. Import the same repository and set **Root Directory** to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
3. Set `VITE_API_BASE=https://schemesaathi-api-delta.vercel.app`.
4. Deploy. [`frontend/vercel.json`](frontend/vercel.json) provides the SPA
   fallback for `/chat`, `/eligibility`, `/plan`, `/compare`, `/schemes` and
   other deep links.
5. Disable Vercel Authentication for public access:
   `vercel project protection disable schemesaathi --sso`.

After changing `VITE_API_BASE`, redeploy the frontend because Vite inlines
`VITE_*` variables at build time.

## 2. MongoDB Atlas

1. Create a free/shared Atlas cluster.
2. Create a database user and allow Vercel egress. For a short-lived demo,
   `0.0.0.0/0` is the simplest allowlist entry; tighten it when you have fixed
   egress IPs.
3. Copy the SRV connection string:
   `mongodb+srv://user:password@cluster.mongodb.net/schemesaathi?retryWrites=true&w=majority`

The API creates indexes on first use. The existing cluster already contains the
112 schemes, 112 rule sets and user/bookmark collections. To populate a fresh
cluster, run `npm run bootstrap` from `backend/` with `MONGODB_URI` set.

## 3. Verify the deployment

```bash
curl https://schemesaathi-api-delta.vercel.app/api/health
curl -I https://schemesaathi-chi.vercel.app
```

Expected health shape (the Chroma line is intentionally down in serverless
mode):

```json
{
  "status": "degraded",
  "services": {
    "mongodb": "up",
    "chroma": "down (lexical fallback active)",
    "llm": "configured"
  },
  "knowledge_base": {
    "schemes": 112,
    "embedded_documents": 0,
    "rules_total": 112,
    "rules_reviewed": 49
  }
}
```

Then check in the browser:

- the directory loads all 112 schemes;
- a chat question streams an answer with sources;
- the eligibility check returns a verdict and source link;
- `/plan` and `/compare` survive a refresh;
- signing in, bookmarking, and history work against the API origin.

## 4. Full hybrid retrieval (optional Docker API)

For the evaluated dense + BM25 stack, run the API and Chroma as containers and
point the frontend at that API instead:

```
Vercel (static SPA)  ──HTTPS──>  Render/Railway/VPS API container
                                      ├── MongoDB Atlas
                                      └── private Chroma service + disk
```

Deploy the repository's `Dockerfile` as a Docker web service. Required
environment variables:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas SRV URI |
| `MONGODB_DB` | `schemesaathi` |
| `CHROMA_URL` | internal Chroma URL, e.g. `http://schemesaathi-chroma:8000` |
| `CHROMA_COLLECTION` | `schemes` |
| `GROQ_API_KEY` | Groq key |
| `JWT_SECRET` | at least 32 random characters |
| `CORS_ORIGINS` | `https://your-app.vercel.app` (add preview domains if needed) |
| `TRUST_PROXY` | `true` |
| `HYBRID_RETRIEVAL` | `true` |

Use [`deploy/chroma.Dockerfile`](deploy/chroma.Dockerfile) with a persistent disk
at `/data`. If your host does not support private services, use a managed
Chroma/Qdrant endpoint and set `CHROMA_URL` to it. Do not expose an
unauthenticated Chroma instance on the public internet.

A Render Blueprint is provided at [`deploy/render.yaml`](deploy/render.yaml).
Edit the `sync: false` values in the dashboard before applying it.

`GROQ_API_KEY`, `JWT_SECRET`, and `MONGODB_URI` are mandatory in production.
The app refuses placeholder secrets.

Health check: `GET /api/health`. A full hybrid instance reports MongoDB and
Chroma as `up`, 112 schemes, 112 embeddings, 112 rule sets, and 49 reviewed
rules.

## 5. Costs and trade-offs

- Vercel Hobby is sufficient for the static frontend and this low-traffic API.
- Vercel Functions have cold starts; the first chat request after idle is slower.
- The serverless API uses BM25 only. If your evaluation or demo depends on
  dense retrieval, deploy the Docker API + Chroma path.
- A private Chroma service with a disk is usually a paid tier. For a low-traffic
  demo, a small VPS running `docker compose` (see
  [`DEPLOYMENT.md`](DEPLOYMENT.md)) has fewer moving parts.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser CORS error | Vercel origin missing from `CORS_ORIGINS` |
| API returns `MongoDB is unreachable` | Atlas IP allowlist does not include Vercel, or the Atlas user/password is wrong |
| `/api/health` shows Chroma down | expected with `DISABLE_CHROMA=true`; chat falls back to BM25 |
| 500 on first boot | `GROQ_API_KEY`/`JWT_SECRET` missing or placeholder |
| Schemes load but embeddings are 0 | expected in serverless mode; run the Docker/Chroma path for embeddings |
| Chat works but no sources | retrieval returned no candidates; verify the Mongo import and `MONGODB_DB` |
| Vercel deep link 404 | `frontend/vercel.json` not deployed; root directory must be `frontend` |
