# AlgoDiff Repository Walkthrough & Setup Guide

AlgoDiff is a developer security and repository intelligence SaaS platform built on Algorand TestNet, providing verifiable change monitoring, SHA-256 canonical diff fingerprinting, and x402 HTTP pay-per-use proof registration.

---

## Directory Overview

```text
Hack/
├── contracts/
│   └── diff_registry/         # AlgoPy AVM Smart Contract source & TEAL artifacts
├── docs/                      # Technical documentation (Architecture, Demo, Verification)
├── server/                    # Express 5 REST API & Repo Watch polling engine
│   ├── clients/               # GitHub REST API client
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

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
# Start frontend dev server
npm run dev

# Start x402 backend server
npm run x402-server
```

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
