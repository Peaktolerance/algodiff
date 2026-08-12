/**
 * Canonical Hashing Utility for AlgoDiff
 * Deterministically fingerprints Git diff contributions using Web Crypto SHA-256.
 */

/**
 * Normalizes input text to LF line endings and consistent formatting.
 * @param {string} str 
 * @returns {string}
 */
export function normalizeText(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

/**
 * Creates a deterministic canonical representation object of a diff contribution.
 * @param {Object} payload 
 * @param {string} payload.repositoryIdentifier 
 * @param {string} payload.fromCommit 
 * @param {string} payload.toCommit 
 * @param {string} payload.diff 
 * @returns {string} Canonical JSON string
 */
export function createCanonicalPayload({ repositoryIdentifier, fromCommit, toCommit, diff }) {
  const canonicalObj = {
    diff: normalizeText(diff),
    fromCommit: normalizeText(fromCommit),
    repositoryIdentifier: normalizeText(repositoryIdentifier),
    toCommit: normalizeText(toCommit),
  };

  // Ensure keys are sorted deterministically
  const sortedKeys = Object.keys(canonicalObj).sort();
  const sortedObj = {};
  for (const key of sortedKeys) {
    sortedObj[key] = canonicalObj[key];
  }

  return JSON.stringify(sortedObj);
}

/**
 * Computes SHA-256 hex string of input string using browser Web Crypto API.
 * @param {string} text 
 * @returns {Promise<string>} 64-character lowercase hex string
 */
export async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback Web Crypto digest computation
  const cryptoObj = window.crypto || globalThis.crypto;
  const hashBuffer = await cryptoObj.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates the canonical SHA-256 hash for a contribution diff.
 * @param {Object} params
 * @returns {Promise<{ canonicalPayload: string, diffHash: string }>}
 */
export async function generateContributionHash({ repositoryIdentifier, fromCommit, toCommit, diff }) {
  const canonicalPayload = createCanonicalPayload({ repositoryIdentifier, fromCommit, toCommit, diff });
  const diffHash = await sha256Hex(canonicalPayload);
  return { canonicalPayload, diffHash };
}

/**
 * Generates a deterministic 32-byte diffId hex string from repoId, commits, and diffHash.
 * @param {string} repoId 
 * @param {string} fromCommit 
 * @param {string} toCommit 
 * @param {string} diffHash 
 * @returns {Promise<string>} 64-character hex string (32 bytes)
 */
export async function generateDiffId(repoId, fromCommit, toCommit, diffHash) {
  const inputStr = `${normalizeText(repoId)}:${normalizeText(fromCommit)}:${normalizeText(toCommit)}:${normalizeText(diffHash)}`;
  return await sha256Hex(inputStr);
}
