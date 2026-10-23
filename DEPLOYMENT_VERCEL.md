# Deployment: Vercel frontend + Render API

The public demo uses two hosts:

| Component | Host | URL |
|---|---|---|
| React SPA | Vercel (`schemesaathi`, root `frontend`) | <https://schemesaathi-chi.vercel.app> |
| Express API + Chroma | Render Docker (`schemesaathi-api`) | <https://schemesaathi-api-6zjg.onrender.com> |
| Health | Render | <https://schemesaathi-api-6zjg.onrender.com/api/health> |

The Render service is built from
[`deploy/Dockerfile.allinone`](deploy/Dockerfile.allinone). It runs Chroma on
loopback inside the API container, so the vector database is never exposed
publicly and no private-network add-on is required. MongoDB Atlas remains the
durable source of truth for schemes, users, history and bookmarks.

```
Vercel static SPA  ──HTTPS──>  Render Docker web service
                               ├─ Express API :$PORT
                               ├─ Chroma 127.0.0.1:8000 (ephemeral)
                               ├─ precomputed embeddings baked into the image
                               └─ MongoDB Atlas
```

The frontend calls the API through `VITE_API_BASE`; the API allows the frontend
origin through `CORS_ORIGINS`.

## 1. Render Docker API (full hybrid retrieval)

The live service uses Render's **free** web-service plan in the `oregon`
region. It has no persistent disk. On each cold start the container:

1. starts Chroma on `127.0.0.1:8000`;
2. imports the 112 schemes if Atlas is empty;
3. rebuilds the Chroma collection from
   [`data/scheme_embeddings.json`](data/scheme_embeddings.json) — this takes
   about a second, because the 384-dimensional vectors are precomputed;
4. starts Express on Render's `$PORT`.

The ONNX query-embedding model is downloaded during the Docker build, so the
container does not fetch it on first use. `/api/health` reports Chroma `up` and
112 embedded documents while the service is awake.

### Create the service

The reproducible definition is
[`deploy/render-free.yaml`](deploy/render-free.yaml). In the Render dashboard,
choose **New → Blueprint**, connect the repository, and point the Blueprint path
at `deploy/render-free.yaml`. Fill the `sync: false` secrets in the dashboard.

The currently deployed service was created with the equivalent Render API
payload:

```json
{
  "type": "web_service",
  "name": "schemesaathi-api",
  "repo": "https://github.com/rudh1r/SchemeSaathi.git",
  "branch": "main",
  "autoDeploy": "yes",
  "serviceDetails": {
    "runtime": "docker",
    "plan": "free",
    "region": "oregon",
    "numInstances": 1,
    "healthCheckPath": "/api/health",
    "envSpecificDetails": {
      "dockerfilePath": "deploy/Dockerfile.allinone",
      "dockerContext": "."
    }
  }
}
```

### Environment variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas SRV URI (secret) |
| `MONGODB_DB` | `schemesaathi` |
| `GROQ_API_KEY` | Groq key (secret) |
| `JWT_SECRET` | at least 32 random characters (secret) |
| `CORS_ORIGINS` | `https://schemesaathi-chi.vercel.app` |
| `TRUST_PROXY` | `true` |
| `RATE_LIMIT_MAX` | `60` |

Do **not** set `DISABLE_CHROMA=true` on the Render service. `CHROMA_URL`
defaults to `http://127.0.0.1:8000` inside the image.

### Free-tier behaviour

- Render spins a free web service down after about 15 minutes without traffic.
  The next request wakes it; the first response can take 30–90 seconds.
- Chroma data is ephemeral. Atlas persists the schemes; the vector index is
  rebuilt from the committed embeddings on every wake.
- The service has 512 MB RAM and a fraction of a CPU. The measured local
  container footprint after startup is roughly 75–130 MB, so it fits, but
  concurrent LLM/streaming requests are still limited.
- Free instances are suitable for a project demo, not for guaranteed uptime.

## 2. Vercel frontend

1. Import the repository and set **Root Directory** to `frontend`.
2. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
3. Set `VITE_API_BASE=https://schemesaathi-api-6zjg.onrender.com` for
   **Production**.
4. Deploy. [`frontend/vercel.json`](frontend/vercel.json) provides the SPA
   fallback for `/chat`, `/eligibility`, `/plan`, `/compare`, `/schemes` and
   other deep links.
5. Disable Vercel Authentication for public access:
   `vercel project protection disable schemesaathi --sso`.

`VITE_*` values are inlined at build time, so changing `VITE_API_BASE` requires
a new frontend deployment.

## 3. Legacy Vercel API (BM25 fallback)

The Vercel Function API is still deployed but is no longer the frontend's API:

| Project | Root directory | URL |
|---|---|---|
| `schemesaathi-api` | `backend` | <https://schemesaathi-api-delta.vercel.app> |

It sets `DISABLE_CHROMA=true`, so it uses BM25 only and reports
`"status":"degraded"` with `"chroma":"down (lexical fallback active)"`. Keep it
as a fallback/comparison, or remove it if you only want one API origin.

If you do keep it, its environment variables are:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas SRV URI |
| `MONGODB_DB` | `schemesaathi` |
| `GROQ_API_KEY` | Groq key |
| `JWT_SECRET` | at least 32 random characters |
| `CORS_ORIGINS` | `https://schemesaathi-chi.vercel.app` |
| `TRUST_PROXY` | `true` |
| `DISABLE_CHROMA` | `true` |
| `RATE_LIMIT_MAX` | `60` |

[`backend/vercel.json`](backend/vercel.json) rewrites `/api/*` to the single
function entry point while preserving the original Express path.
[`backend/api/index.js`](backend/api/index.js) opens the Atlas connection lazily
and caches it for warm invocations.

## 4. MongoDB Atlas

1. Create a free/shared Atlas cluster.
2. Create a database user and allow Render egress. For a short-lived demo,
   `0.0.0.0/0` is the simplest allowlist entry; tighten it when you have fixed
   egress IPs.
3. Copy the SRV connection string:
   `mongodb+srv://user:password@cluster.mongodb.net/schemesaathi?retryWrites=true&w=majority`

The API creates indexes on first use. The existing cluster already contains the
112 schemes, 112 rule sets and user/bookmark collections. To populate a fresh
cluster, run `npm run bootstrap` from `backend/` with `MONGODB_URI` set.

## 5. Verify the deployment

```bash
curl https://schemesaathi-api-6zjg.onrender.com/api/health
curl -I https://schemesaathi-chi.vercel.app
```

Expected health shape while the Render service is awake:

```json
{
  "status": "ok",
  "services": {
    "mongodb": "up",
    "chroma": "up",
    "llm": "configured"
  },
  "knowledge_base": {
    "schemes": 112,
    "embedded_documents": 112,
    "rules_total": 112,
    "rules_reviewed": 49
  }
}
```

Then check in the browser:

- the directory loads all 112 schemes;
- a chat question streams an answer with sources and reports
  `"retrieval":{"engine":"hybrid"}`;
- the eligibility check returns a verdict and source link;
- `/plan` and `/compare` survive a refresh;
- signing in, bookmarking, and history work against the Render API origin.

## 6. Costs and trade-offs

- Vercel Hobby is sufficient for the static frontend.
- Render's free web service is $0 but sleeps and has an ephemeral disk. That is
  why the all-in-one image rebuilds Chroma from precomputed vectors.
- The paid alternative is a Render Starter private Chroma service with a 1 GB
  disk plus a separate API service (see
  [`deploy/render.yaml`](deploy/render.yaml)). It removes the cold-start
  reindex but adds roughly $7/month.
- A small VPS running `docker compose` (see
  [`DEPLOYMENT.md`](DEPLOYMENT.md)) is another option with persistent storage
  and no sleep.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser CORS error | Frontend origin missing from `CORS_ORIGINS` |
| API returns `MongoDB is unreachable` | Atlas allowlist does not include Render, or the Atlas user/password is wrong |
| `/api/health` shows Chroma down on Render | The container is still booting, or Chroma failed to start; check Render logs |
| First request after idle is slow | Expected on Render's free tier; the service is waking |
| 500 on first boot | `GROQ_API_KEY`/`JWT_SECRET` missing or placeholder |
| Schemes load but embeddings are 0 | Bootstrap has not finished; wait for the health check or inspect logs |
| Chat works but no sources | Retrieval returned no candidates; verify the Mongo import and `MONGODB_DB` |
| Vercel deep link 404 | `frontend/vercel.json` not deployed; root directory must be `frontend` |
