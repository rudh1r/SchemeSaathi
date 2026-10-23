# Vercel deployment (frontend) with a Docker API

Vercel is an excellent host for the React/Vite frontend, but it is **not** a
drop-in host for this backend as it stands. The API uses a long-lived Express
process, an SSE chat stream, and a local ChromaDB process with an ONNX
embedding model. Vercel Functions have a different execution model and no
persistent local filesystem, so running the current stack entirely inside
Vercel would require replacing Chroma with a hosted vector database and moving
all state to managed services.

This repository therefore uses the practical split:

```
Vercel (static SPA)  ──HTTPS──>  Render/Railway API container
                                     ├── MongoDB Atlas
                                     └── private Chroma service + disk
```

The frontend calls the API through `VITE_API_BASE`; no Vercel rewrite/proxy is
required. The API allows the Vercel origin through `CORS_ORIGINS`.

## 1. MongoDB Atlas

1. Create a free/shared Atlas cluster.
2. Create a database user and allow the Render/Railway egress IPs (or
   `0.0.0.0/0` for a short-lived demo, then tighten it).
3. Copy the SRV connection string:
   `mongodb+srv://user:password@cluster.mongodb.net/schemesaathi?retryWrites=true&w=majority`

The backend creates indexes and imports the 112 schemes on first boot.

## 2. Chroma as a private service

Use [`deploy/chroma.Dockerfile`](deploy/chroma.Dockerfile) and mount a
persistent disk at `/data`. The disk is important: Chroma stores the 112
vectors and collection metadata there. The embedding model cache lives in the
API container (`HF_HOME`); after a container recreation it is downloaded again
unless you add a cache volume.

If your host does not support private services, use a managed Chroma/Qdrant
endpoint and set `CHROMA_URL` to it. Do not expose an unauthenticated Chroma
instance on the public internet.

## 3. API service

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

`GROQ_API_KEY`, `JWT_SECRET`, and `MONGODB_URI` are mandatory in production.
The app refuses placeholder secrets.

Health check: `GET /api/health`. A healthy response reports MongoDB and Chroma
as `up`, 112 schemes, 112 embeddings, 112 rule sets, and 49 reviewed rules.

A Render Blueprint is provided at [`deploy/render.yaml`](deploy/render.yaml).
Edit the `sync: false` values in the dashboard before applying it.

## 4. Vercel frontend

1. Import the GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite. Build command: `npm run build`. Output: `dist`.
4. Add the environment variable:
   `VITE_API_BASE=https://your-api-host.example.com`
5. Deploy.

[`frontend/vercel.json`](frontend/vercel.json) provides the SPA fallback so
`/chat`, `/eligibility`, `/plan`, `/compare`, and `/schemes?scheme=...` survive
a refresh.

After Vercel assigns a domain, add it to the API's `CORS_ORIGINS`. If you use
Vercel preview deployments, either add each preview origin or set
`CORS_ORIGINS` to a deliberately permissive value **only for a temporary demo**.

## 5. Verify

```bash
curl https://your-api-host.example.com/api/health
curl -I https://your-app.vercel.app
```

Then check in the browser:

- the directory loads schemes;
- a chat question streams an answer;
- the eligibility check returns a verdict and source link;
- `/plan` and `/compare` survive a refresh;
- signing in, bookmarking, and history work across the Vercel and API origins.

## 6. Costs and alternatives

- Vercel Hobby is sufficient for the static frontend.
- Render/Railway free tiers may sleep; the first request after sleep is slow.
- A private Chroma service with a disk is usually a paid tier. For a
  low-traffic demo, a small VPS running `docker compose` (see
  [`DEPLOYMENT.md`](DEPLOYMENT.md)) is often cheaper and has fewer moving
  parts.
- If you need a **single-platform Vercel deployment**, the next step is a
  retrieval migration: replace Chroma with MongoDB Atlas Vector Search or a
  hosted vector DB, remove the local ONNX embedder, and move the API to
  Vercel Functions. That is a separate architecture change and is not
  pretended to be a configuration toggle.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Browser CORS error | Vercel origin missing from `CORS_ORIGINS` |
| `/api/health` shows Chroma down | wrong `CHROMA_URL`, private service asleep, or disk not mounted |
| 500 on first boot | `GROQ_API_KEY`/`JWT_SECRET` missing or placeholder |
| Schemes load but embeddings are 0 | Chroma reachable but bootstrap has not finished; check API logs |
| Chat works but no sources | retrieval returned no candidates; verify Mongo import and Chroma collection count |
| Vercel deep link 404 | `frontend/vercel.json` not deployed; root directory must be `frontend` |
