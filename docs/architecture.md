# AlgoDiff System Architecture

AlgoDiff is a repository change intelligence and verifiable change monitoring platform. It combines automated GitHub commit tracking, canonical SHA-256 fingerprinting, x402 HTTP micro-payments, and Algorand TestNet Box Storage proof anchoring.

---

## High-Level Architecture

```text
┌───────────────────────────────┐
│     React / Vite Frontend     │
│   (Pera Wallet Integration)   │
└──────────────┬────────────────┘
               │ HTTP / REST & x402 Header
               ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│    Express x402 Server        │──────►│       GitHub REST API         │
│ (Repo Watch Polling Engine)   │       │   (Commits & Unified Diffs)   │
└──────────────┬────────────────┘       └───────────────────────────────┘
               │
               │ Algorand SDK Transaction Submission
               ▼
┌───────────────────────────────┐
│     Algorand TestNet (AVM)    │
│  App ID: 769036041 (Box Store)│
└───────────────────────────────┘
```

---

## Core Components

### 1. Frontend (`src/`)
- **Framework**: React 19 + Vite 8
- **Styling**: Modern SaaS Light Theme CSS Design Tokens (`#f8fafc` background, crisp cards, dark typography)
- **Wallet Connection**: `@perawallet/connect` for Pera Wallet session management
- **Pages**:
  - `OverviewPage`: High-level metrics, platform introduction, recent activity feed
  - `RepoWatchPage`: Monitored repository grid, commit status, manual update trigger
  - `RepoDetailPage`: **Change Intelligence Report** (What Changed, Why It Matters, Impact Metrics, Files Affected, Fingerprint, On-Chain Status)
  - `ActivityPage`: Chronological timeline filterable by Repository, Category, Risk Level, and Verification Status
  - `VerifyPage`: Dual-path independent verification against live Algorand Box Storage
  - `TamperDemoPage`: Interactive cryptographic tamper demonstration
  - `RegisterPage`: Legacy Manual Diff fallback flow

### 2. Backend Engine (`server/`)
- **Server Entry**: `server/x402Server.js` (Express 5 REST server on Port 4020)
- **Watcher Engine** (`server/watcher/repoWatcher.js`): Background polling service monitoring repositories every 5 minutes with duplicate protection
- **GitHub Client** (`server/clients/githubClient.js`): Interacts with GitHub REST API for commits, repository metadata, and unified diff comparisons
- **Summarizer Service** (`server/services/summarizer.js`): Provider-independent, deterministic Change Intelligence generator producing evidence-backed summaries, risk indicators, and why-it-matters explanations
- **Store & Persistence** (`server/storage/watcherStore.js`): Manages local JSON data (`server/data/watcher_store.json`) mounted to Docker persistent volume `x402-data`

### 3. Cryptographic Fingerprint Engine (`src/services/canonicalHash.js`)
- **Canonical Payload Structure**:
  ```json
  {
    "diff": "<normalized_unified_diff>",
    "fromCommit": "<from_commit_sha>",
    "repositoryIdentifier": "<owner/repo>",
    "toCommit": "<to_commit_sha>"
  }
  ```
- **Hashing**: SHA-256 via Web Crypto API / Node `crypto` (`diffHash`)
- **On-Chain Box Key (`diffId`)**: `SHA-256("${repoId}:${fromCommit}:${toCommit}:${diffHash}")`

### 4. Algorand Smart Contract (`contracts/diff_registry/contract.py`)
- **Language**: AlgoPy (Python AVM Contract)
- **Deployed App ID**: `769036041` (Algorand TestNet)
- **Method**: `register_diff(diff_id: Bytes, repo_id: String, from_commit: String, to_commit: String, diff_hash: String, payment_tx: PayTxn)`
- **Box Storage**: Stores 32-byte `diffId` box containing structured submission metadata (`repoId`, `fromCommit`, `toCommit`, `diffHash`, `submitter`, `timestamp`).

---

## Deployment Infrastructure

- **Containerization**: Docker Compose (`docker-compose.yml`)
  - `hack-frontend`: Nginx Alpine serving production Vite build (Port 80)
  - `hack-x402-server`: Node 22 Alpine executing Express server (Port 4020) with named persistent volume `x402-data` mapped to `/app/server/data`.
