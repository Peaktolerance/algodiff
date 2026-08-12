# AlgoDiff Repository Walkthrough & Fix Report

AlgoDiff is a developer security and repository intelligence SaaS platform built on Algorand TestNet, providing verifiable change monitoring, SHA-256 canonical diff fingerprinting, and x402 HTTP pay-per-use proof registration.

---

## Directory Overview

```text
Hack/
├── contracts/
│   └── diff_registry/         # AlgoPy AVM Smart Contract source & TEAL artifacts
├── docs/                      # Technical documentation (Architecture, Demo, Verification)
├── server/                    # Express 5 REST API & Repo Watch polling engine
│   ├── clients/               # GitHub REST API client (User-Agent header enforcement)
│   ├── services/              # Change Intelligence summarizer
│   ├── storage/               # JSON data store & Docker persistence
│   └── watcher/               # Background polling service
├── src/                       # React 19 + Vite frontend
│   ├── components/            # UI Modals, Navbar, and DiffViewer
│   ├── pages/                 # Overview, RepoWatch, RepoDetail, Activity, Verify, Tamper, Register
│   ├── services/              # Algorand SDK, Pera Wallet, x402, and Hashing services
│   └── styles/                # Tailwind CSS / Light SaaS CSS design system
├── docker-compose.yml         # Production multi-container composition
├── frontend.Dockerfile        # Vite + Nginx Alpine frontend container
└── x402.Dockerfile            # Express Node 22 Alpine backend container
```

---

## GitHub API 403 Production Fix Summary

### Root Cause
- **Direct Browser `fetch()` Calls**: Client-side browser code (`src/services/gitEngine.js`) called `https://api.github.com/...` directly. Modern browsers strip/prohibit custom `User-Agent` headers in `fetch()`. GitHub REST API strictly requires a `User-Agent` header for all requests, returning `HTTP 403 Forbidden` (`"Request forbidden by administrative rules"`).

### Production Solution
1. **Backend REST Proxy**: Created `/api/github/repos/:owner/:repo/*` endpoints in `server/x402Server.js` powered by `server/clients/githubClient.js`.
2. **Server-Side User-Agent**: Node backend executes requests with `'User-Agent': 'AlgoDiff-RepoWatcher/1.0'`.
3. **Frontend Routing**: Updated `src/services/gitEngine.js` to proxy all Manual Diff requests through `/api/github/repos/...`.
4. **Header & Status Inspection**: Updated `server/clients/githubClient.js` to inspect `x-ratelimit-remaining` response headers before classifying 403 errors, ensuring rate-limiting is only reported when remaining counter is 0.

---

## Production Deployment (Docker Compose)

```bash
# Build production images without cache
docker compose build --no-cache

# Launch containers in detached mode
docker compose up -d

# Verify container status
docker compose ps
```

- **Frontend**: `http://localhost` (Port 80)
- **Backend API**: `http://localhost:4020` (Port 4020)
