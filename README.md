# AlgoDiff — Verifiable Git Contributions on Algorand

**AlgoDiff** is a Web3 DApp built on **Algorand TestNet** that allows developers to generate cryptographic fingerprints of Git contribution diffs, pay a micro-service fee via the **HTTP x402 Payment Protocol**, and anchor the contribution proofs permanently into **Algorand Box Storage** using an **AlgoPy** smart contract.

```
Git Commits ➔ Unified Diff ➔ Web Crypto SHA-256 (diffHash) ➔ HTTP x402 Payment ➔ AlgoPy Smart Contract ➔ Algorand TestNet Box Storage ➔ Verification
```

---

## 🌟 Key Features

* **Browser-Native Git Diff Engine**: Compare commit snapshots from built-in demo repositories (`TechMart`) or load **any Public GitHub Repository** directly in the browser via GitHub REST APIs.
* **Deterministic Canonical Hashing**: Enforces sorted JSON key formatting, LF line ending normalization (`\r\n` ➔ `\n`), and browser-native Web Crypto SHA-256 calculation (`crypto.subtle.digest`).
* **HTTP x402 Payment Protocol**: Micro-service fee (`0.001 ALGO`) handled via HTTP 402 challenge-response flow (`WWW-Authenticate` and `Authorization: x402 txid="..."` headers).
* **AlgoPy Smart Contract & Box Storage**: Stores `repo_id|from_commit|to_commit|diff_hash|submitter|timestamp` in 32-byte `diffId` box entries on Algorand TestNet.
* **1-Click Tamper Detection Demo**: Demonstrates cryptographic integrity by modifying 1 character of code (`return amount + 1;`), triggering real-time recalculation of Hash B, resulting in `✗ HASH MISMATCH / TAMPER DETECTED!`.

---

## 🌐 Verified Blockchain Infrastructure

* **Algorand Network**: `Algorand TestNet` (`https://testnet-api.algonode.cloud`)
* **Verified Application ID**: **`769036041`**
* **Deployment TxID**: `3LVXVJOA5TDKXHUNHHILRB2VRNF7I7OZYQGSOFTEZZGCCKJ5UWDQ`
* **Box MBR Funding TxID**: `YPABMGMA3ZKY37Q6H3HVXGQ5F2D6FIVHCZFLPXIIOEZDLPI6XEMQ`
* **Deployer Account**: `VVWZ6BXLRM2HWFOMKUDPXE6A7BVSRKTH6A3RO36WT5JJRXHET3VTLYJETE`

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
VITE_ALGORAND_NETWORK=testnet
VITE_ALGORAND_APP_ID=769036041
VITE_X402_API_URL=/api/x402/register-quote
```

### 3. Run Development Servers
Start the x402 Express payment service:
```bash
npm run x402-server
```

In a separate terminal, start the React Vite frontend:
```bash
npm run dev
```

Open `http://127.0.0.1:5173` in your browser.

---

## 🐳 Docker Deployment

AlgoDiff is fully containerized using Docker and Docker Compose.

### Build and Run Containers
```bash
docker compose up --build -d
```

### Service Ports
* **Frontend (Nginx / SPA)**: `http://localhost:80`
* **x402 Server**: `http://localhost:4020`
* **Health Check**: `http://localhost:4020/health`

---

## 🔒 Security Architecture

* **Zero Hardcoded Secrets**: All user transaction signing is handled non-custodially via connected browser Web3 wallets (`window.algorand` / Pera Wallet).
* **Environment Protection**: `.env` and deployment secrets are excluded from Git and Docker contexts via `.gitignore` and `.dockerignore`.
* **Public Configuration**: Only public parameters (`VITE_ALGORAND_APP_ID`, `VITE_ALGORAND_NETWORK`) are bundled into client code.

---

## 📜 License

MIT License. Built for the Algorand Hackathon.
