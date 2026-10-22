# Deploying SchemeSaathi

The repository ships a production build path that runs the API **and** the
compiled React frontend from one Node process, with MongoDB and Chroma in the
same Docker Compose network. One public port is enough; no CDN, separate static
host, or build server is required.

```
browser ──> app :5000 (Express + frontend/dist)
                 ├──> mongo :27017   (schemes, users, history, bookmarks)
                 └──> chroma :8000   (112 embedded scheme passages)
                           └──> Groq API (explanations only)
```

## Option A — self-hosted Docker Compose (recommended)

### 1. Prerequisites

- A Linux VM with Docker Engine and Docker Compose v2.24+ (or Docker Desktop)
- 2 GB RAM and ~2 GB free disk (the embedding model is downloaded once)
- A [Groq API key](https://console.groq.com/keys)
- Outbound HTTPS access to `api.groq.com` and the Hugging Face model hub

### 2. Configure secrets

```bash
cp .env.deploy.example .env
openssl rand -hex 32          # paste the result into JWT_SECRET
```

Edit `.env` and set `GROQ_API_KEY` and `JWT_SECRET`. Leave `MONGODB_URI` and
`CHROMA_URL` commented out to use the bundled containers.

> `.env` is gitignored and is never copied into the image.

### 3. Start

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:5000/api/health
```

The first start does the following automatically:

1. MongoDB starts empty.
2. `bootstrap` imports `data/schemes.json` (112 schemes).
3. Chroma downloads its local embedding model, then builds 112 vectors.
4. Express starts and serves the SPA and `/api` on port 5000.

The health endpoint should report:

```json
{
  "status": "ok",
  "services": { "mongodb": "up", "chroma": "up" },
  "knowledge_base": {
    "schemes": 112,
    "embedded_documents": 112,
    "rules_total": 112,
    "rules_reviewed": 49
  }
}
```

Open `http://<server-ip>:5000`. All React routes (`/chat`, `/eligibility`,
`/browse`, `/privacy`, …) are fallbacks to the same `index.html`, so direct
links and refreshes work.

Follow first boot with:

```bash
docker compose logs -f app
```

### 4. Put it behind HTTPS (public domain)

The app is plain HTTP on port 5000. For a real domain, put Caddy in front; it
obtains and renews TLS certificates automatically.

`Caddyfile`:

```caddyfile
schemes.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:5000
}
```

A copy is in [`deploy/Caddyfile.example`](deploy/Caddyfile.example).

Then:

1. Point the domain's A/AAAA record at the VM.
2. Allow ports 80 and 443 in the firewall.
3. Set `TRUST_PROXY=true` in `.env` so rate limits see the client IP.
4. Restart the app: `docker compose up -d`.
5. Optionally stop publishing port 5000 publicly (`127.0.0.1:5000:5000` in
   `docker-compose.yml`) and expose only Caddy.

`CORS_ORIGINS` is **not required** for this same-origin setup. Set it only when
a separately hosted frontend calls the API from another domain.

### 5. Update a deployment

```bash
git pull
docker compose up -d --build
```

Data lives in the named volumes `mongo_data` and `chroma_data`; rebuilding the
image does not touch it. `bootstrap` is idempotent and does not re-import on a
normal restart.

### 6. Refresh the scheme data (destructive)

Use this only when `data/schemes.json` changes:

```bash
# in .env
SEED_FORCE=true
EMBED_FORCE=true

docker compose up -d
docker compose logs -f app
# then remove the two flags and `docker compose up -d` again
```

`SEED_FORCE` replaces the schemes collection; `EMBED_FORCE` rebuilds Chroma. User
accounts, history and bookmarks are **not** deleted. Because scheme ObjectIds
change, existing bookmarks to old schemes become stale — acceptable for an
academic deployment, but back up first if that matters.

## Option B — managed services

The same image works on Render, Railway, Fly.io or a VPS because the frontend
defaults to same-origin in a production build.

| Piece | Service |
| --- | --- |
| App (API + SPA) | Render/Railway/Fly Docker service, port 5000 |
| MongoDB | MongoDB Atlas (set `MONGODB_URI`) |
| Chroma | Chroma Cloud or a small always-on Docker host (set `CHROMA_URL`) |

Required environment variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
MONGODB_DB=schemesaathi
GROQ_API_KEY=gsk_...
JWT_SECRET=<32+ random characters>
CHROMA_URL=https://your-chroma-host:443
CHROMA_COLLECTION=schemes
```

Notes:

- Atlas requires the platform's egress IPs in the network allowlist.
- Run `npm run bootstrap` once after the first deploy, or use the Docker CMD,
  which already does it.
- A platform health check should target `GET /api/health`.
- Do not set `VITE_API_BASE` unless the frontend is hosted separately; the
  default production value is same-origin.

## Environment reference

| Variable | Required | Production default | Purpose |
| --- | --- | --- | --- |
| `MONGODB_URI` | yes | — | MongoDB connection string |
| `MONGODB_DB` | no | `schemesaathi` | Database name |
| `GROQ_API_KEY` | yes | — | Explanations only; never decides eligibility |
| `JWT_SECRET` | yes | — | random ≥32 chars; placeholder values are rejected |
| `CHROMA_URL` | no | `http://localhost:8000` | Vector store origin |
| `CHROMA_COLLECTION` | no | `schemes` | Collection name |
| `PORT` | no | `5000` | HTTP port |
| `NODE_ENV` | no | `development` | Set to `production` in containers |
| `FRONTEND_DIST` | no | `../frontend/dist` | Built SPA location |
| `TRUST_PROXY` | no | `false` | `true` behind Caddy/Nginx |
| `CORS_ORIGINS` | no | localhost dev origins | Extra allowed browser origins |
| `RATE_LIMIT_MAX` | no | `30` | AI requests/minute/IP |
| `RATE_LIMIT_DISABLED` | no | `false` | Only for load tests |
| `SEED_FORCE` | no | `false` | Re-import schemes (destructive) |
| `EMBED_FORCE` | no | `false` | Rebuild vectors |
| `APP_PORT` | no | `5000` | Host port published by Compose |

## Operations

### Backups

```bash
# MongoDB
docker compose exec -T mongo mongodump --archive --gzip > schemesaathi-mongo.gz

# Chroma persistence
docker run --rm -v schemesaathi_chroma_data:/data -v "$PWD":/backup \
  alpine tar czf /backup/schemesaathi-chroma.tgz -C /data .
```

The Chroma index is reproducible from MongoDB with `EMBED_FORCE=true`, so the
MongoDB dump is the important backup.

### Logs and resource use

```bash
docker compose logs -f app
docker stats
```

### Stop / remove

```bash
docker compose down            # keep data
docker compose down -v         # delete MongoDB + Chroma volumes
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| App exits with `JWT_SECRET must be at least 32 characters` | Generate a longer secret in `.env` |
| `bootstrap` cannot reach Chroma | `docker compose logs chroma`; wait for first pull/start |
| Health says `mongodb: down` | `docker compose logs mongo`; confirm `MONGODB_URI` |
| Health says `chroma: down` | Retrieval falls back to lexical search; check Chroma logs |
| First request is slow | The embedding model is downloading/caching on first boot |
| 429 responses | Per-IP rate limit; tune `RATE_LIMIT_MAX` |
| `bind: address already in use` | Stop the local dev server or set `APP_PORT=5050` in `.env` |
| Blank page after deploy | Confirm the image built `frontend/dist`; check `docker compose logs app` for the served-frontend line |

## Security checklist

- [ ] `JWT_SECRET` is random and unique to this deployment
- [ ] HTTPS terminates at Caddy/Nginx; port 5000 is not publicly exposed
- [ ] `TRUST_PROXY=true` only when a trusted proxy is in front
- [ ] MongoDB and Chroma are not published to the host
- [ ] Atlas network allowlist is restricted
- [ ] `.env` is never committed
- [ ] Backups are scheduled and test-restored

The app includes Helmet security headers, a restrictive CSP, body-size limits,
per-IP rate limiting on AI and auth endpoints, no-store API caching, JSON-only
API 404s, and graceful shutdown. It stores JWTs in `localStorage`; if the threat
model requires protection from XSS, move authentication to HttpOnly cookies
before exposing sensitive data.
