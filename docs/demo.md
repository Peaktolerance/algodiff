# AlgoDiff Hackathon Presentation & Demo Script

This guide outlines the recommended 7-step presentation flow for presenting **AlgoDiff** at hackathons and product demonstrations.

---

## Presentation Sequence

### Step 1: Overview Dashboard
- **Action**: Navigate to `Overview` tab.
- **Narrative**:
  > "Welcome to AlgoDiff — the repository change intelligence and verifiable change monitoring platform for Algorand. Developers and organizations need to understand every code change and prove what happened without trusting centralized intermediaries."
- **Key Visuals**: Highlighting metric cards (Watched Repositories, Updates Detected, Verified Proofs) and platform hero.

---

### Step 2: Repo Watch Dashboard
- **Action**: Navigate to `Repo Watch` tab.
- **Narrative**:
  > "Repo Watch continuously monitors public GitHub repositories such as React, Next.js, and Express. When a new commit is pushed, the background engine fetches the commit diff, calculates a canonical SHA-256 fingerprint, and generates a structured summary."
- **Action**: Click `[ Check Updates ]` on any repository card to demonstrate live monitoring.

---

### Step 3: Change Intelligence Report
- **Action**: Select a repository update to open `Repo Detail`.
- **Narrative**:
  > "When we open a detected update, AlgoDiff presents a complete Change Intelligence report answering six critical questions:
  > 1. **What Changed?** — Structured, evidence-backed bullet points.
  > 2. **Why Does It Matter?** — Concise risk and impact context.
  > 3. **Impact Metrics** — Files changed, additions (+), and deletions (-).
  > 4. **Files Affected** — Detailed per-file status breakdown.
  > 5. **Unified Diff Evidence** — The exact git diff for visual verification."

---

### Step 4: Canonical Fingerprint Identity
- **Action**: Scroll to the **Change Fingerprint** box.
- **Narrative**:
  > "AlgoDiff generates a 64-character SHA-256 canonical fingerprint of the diff payload and a 32-byte `diffId` key. This fingerprint is deterministic and environment-independent."

---

### Step 5: Proof Registration on Algorand (Pera Wallet & x402)
- **Action**: Click `[ Register Proof on Algorand ]`.
- **Narrative**:
  > "To anchor this fingerprint on the blockchain, we trigger our HTTP 402 pay-per-use flow. Pera Wallet pops up to approve:
  > 1. **x402 Micro-payment**: 0.001 ALGO service fee to the treasury.
  > 2. **Smart Contract Call**: `register_diff` application call to Algorand TestNet App ID 769036041."

---

### Step 6: Independent Proof Verification
- **Action**: Navigate to `Verify Proof` tab.
- **Narrative**:
  > "Anyone can independently verify a repository change against Algorand Box Storage. By selecting a Repo Watch update or searching by Diff ID, AlgoDiff queries the AVM contract state and confirms: `✓ VERIFIED ON ALGORAND`."

---

### Step 7: Cryptographic Tamper Demo
- **Action**: Navigate to `Tamper Demo` tab.
- **Narrative**:
  > "To demonstrate cryptographic integrity, if an attacker modifies even a single character in a git diff, the SHA-256 fingerprint changes completely (`A !== B`). AlgoDiff immediately flags: `✕ VERIFICATION FAILED / TAMPER DETECTED`."
