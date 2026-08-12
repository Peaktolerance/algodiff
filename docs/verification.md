# Cryptographic Fingerprinting & Verification Specification

This document details the canonical SHA-256 fingerprinting algorithm and Algorand Box Storage verification protocol used by **AlgoDiff**.

---

## 1. Canonical Payload Structure

To guarantee that the computed hash remains identical across different environments, git clients, and line-ending settings, AlgoDiff constructs a sorted JSON payload:

```json
{
  "diff": "<normalized_unified_diff>",
  "fromCommit": "<from_commit_sha>",
  "repositoryIdentifier": "<owner/repo>",
  "toCommit": "<to_commit_sha>"
}
```

### Normalization Rules
1. **Line Endings**: Convert all `\r\n` and `\r` occurrences to `\n`.
2. **Whitespace**: Strip leading and trailing whitespace from each field.
3. **Key Ordering**: Sort object keys alphabetically (`diff`, `fromCommit`, `repositoryIdentifier`, `toCommit`).
4. **Encoding**: Serialize to UTF-8 JSON string without whitespace around separators (`JSON.stringify(sortedObj)`).

---

## 2. Hash Computations

### A. Diff Fingerprint (`diffHash`)
```text
diffHash = SHA256(canonicalPayload)
```
- **Output**: 64-character lowercase hexadecimal string (32 bytes).

### B. Algorand Box Storage Key (`diffId`)
```text
inputString = "${repositoryIdentifier}:${fromCommit}:${toCommit}:${diffHash}"
diffId = SHA256(inputString)
```
- **Output**: 64-character lowercase hexadecimal string (32 bytes).

---

## 3. Algorand Box Storage Commitment

- **App ID**: `769036041` (Algorand TestNet)
- **Box Key**: `diffId` (32-byte hex converted to binary bytes)
- **Box Content Layout**:
  - `repoId`: String (max 64 bytes)
  - `fromCommit`: String (40 bytes)
  - `toCommit`: String (40 bytes)
  - `diffHash`: String (64 bytes)
  - `submitter`: Address (32 bytes)
  - `timestamp`: uint64 (8 bytes)

---

## 4. Verification Protocol

When verifying a repository change, the system performs:

1. **Local Fingerprint Calculation**:
   - Compute `diffHash` and `diffId` from the target commit comparison and diff text.
2. **On-Chain Query**:
   - Execute Algorand SDK Box Storage lookup: `algodClient.getApplicationBoxByName(appId, diffIdBytes)`.
3. **Evaluation**:
   - **`NOT_REGISTERED`**: Box key does not exist on-chain.
   - **`VERIFIED`**: Box key exists and stored `diffHash` matches local `diffHash`.
   - **`MISMATCH`**: Box key exists but stored `diffHash` differs from local `diffHash`.
