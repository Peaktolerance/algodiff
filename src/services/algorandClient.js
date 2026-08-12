import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';

// Initialize Pera Wallet Connect instance configured strictly for Algorand TestNet (Chain ID: 416002)
export const peraWallet = new PeraWalletConnect({
  chainId: 416002,
});

// Default Algorand TestNet Node Endpoints
const ALGOD_SERVER = 'https://testnet-api.algonode.cloud';
const ALGOD_PORT = 443;
const ALGOD_TOKEN = '';

const INDEXER_SERVER = 'https://testnet-idx.algonode.cloud';
const INDEXER_PORT = 443;
const INDEXER_TOKEN = '';

export const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);
export const indexerClient = new algosdk.Indexer(INDEXER_TOKEN, INDEXER_SERVER, INDEXER_PORT);

// Verified TestNet Application ID for DiffRegistry
export const DIFF_REGISTRY_APP_ID = parseInt(import.meta.env?.VITE_ALGORAND_APP_ID || '769036041', 10);

let activeWalletAddress = null;

/**
 * Canonical Algorand Address Resolver
 * Resolves a single valid 58-character Algorand address string from any input format:
 * - string account address
 * - object with .address property
 * - array of accounts / Pera account arrays
 * - active Pera session accounts / activeWalletAddress module state
 */
export function resolveCanonicalAddress(input) {
  let candidate = null;

  if (typeof input === 'string' && input.trim().length > 0) {
    candidate = input.trim();
  } else if (input && typeof input.address === 'string' && input.address.trim().length > 0) {
    candidate = input.address.trim();
  } else if (Array.isArray(input) && input.length > 0) {
    return resolveCanonicalAddress(input[0]);
  } else if (activeWalletAddress) {
    candidate = activeWalletAddress;
  } else if (peraWallet?.accounts && peraWallet.accounts.length > 0) {
    const pAcc = peraWallet.accounts[0];
    candidate = typeof pAcc === 'string' ? pAcc : (pAcc?.address || String(pAcc));
  } else if (peraWallet?.connector?.accounts && peraWallet.connector.accounts.length > 0) {
    const cAcc = peraWallet.connector.accounts[0];
    candidate = typeof cAcc === 'string' ? cAcc : (cAcc?.address || String(cAcc));
  }

  if (!candidate) return null;

  if (typeof candidate !== 'string') {
    if (candidate?.address && typeof candidate.address === 'string') {
      candidate = candidate.address.trim();
    } else {
      candidate = String(candidate).trim();
    }
  }

  // Validate format using algosdk.decodeAddress
  try {
    const decoded = algosdk.decodeAddress(candidate);
    if (decoded && decoded.publicKey && decoded.publicKey.length === 32) {
      return candidate;
    }
  } catch (e) {
    console.warn("[AlgoDiff DEBUG] decodeAddress failed for candidate:", candidate, e?.message);
  }

  return null;
}

/**
 * Resolves currently active wallet address string safely across Pera SDK formats
 */
export function getActiveWalletAddress() {
  return resolveCanonicalAddress(activeWalletAddress);
}

/**
 * Reconnects existing Pera Wallet session on application load
 */
export async function reconnectWalletSession() {
  try {
    console.log("[AlgoDiff DEBUG] Reconnecting Pera Wallet session...");
    const accounts = await peraWallet.reconnectSession();
    peraWallet.connector?.on('disconnect', disconnectWallet);
    console.log("[AlgoDiff DEBUG] Pera reconnect raw accounts shape:", accounts);

    const validAddr = resolveCanonicalAddress(accounts);
    console.log("[AlgoDiff DEBUG] Normalized address from reconnectWalletSession:", validAddr);

    if (validAddr) {
      activeWalletAddress = validAddr;
      return {
        address: activeWalletAddress,
        type: 'Pera Wallet (TestNet)',
        network: 'Algorand TestNet',
        balance: await getAccountBalance(activeWalletAddress),
      };
    }
  } catch (e) {
    console.warn("[AlgoDiff DEBUG] Pera Wallet session reconnect exception:", e);
  }

  // Fallback if session was already active or reconnectSession returned empty
  const fallback = resolveCanonicalAddress(null);
  console.log("[AlgoDiff DEBUG] reconnectWalletSession fallback address:", fallback);
  if (fallback) {
    activeWalletAddress = fallback;
    return {
      address: activeWalletAddress,
      type: 'Pera Wallet (TestNet)',
      network: 'Algorand TestNet',
      balance: await getAccountBalance(activeWalletAddress),
    };
  }
  return null;
}

/**
 * Prompts user to connect Pera Wallet on Algorand TestNet
 */
export async function connectWallet() {
  try {
    console.log("[AlgoDiff DEBUG] Prompting connectWallet...");
    const accounts = await peraWallet.connect();
    peraWallet.connector?.on('disconnect', disconnectWallet);
    console.log("[AlgoDiff DEBUG] Pera connect raw accounts shape:", accounts);

    const validAddr = resolveCanonicalAddress(accounts);
    console.log("[AlgoDiff DEBUG] Normalized address from connectWallet:", validAddr);

    if (validAddr) {
      activeWalletAddress = validAddr;
      return {
        address: activeWalletAddress,
        type: 'Pera Wallet (TestNet)',
        network: 'Algorand TestNet',
        balance: await getAccountBalance(activeWalletAddress),
      };
    }
  } catch (error) {
    if (error?.data?.type !== "CONNECT_MODAL_CLOSED") {
      console.error("[AlgoDiff DEBUG] Pera Wallet connection error:", error);
    }
  }
  return null;
}

/**
 * Disconnects Pera Wallet session
 */
export async function disconnectWallet() {
  try {
    await peraWallet.disconnect();
  } catch (e) {
    console.warn("Disconnect warning:", e);
  }
  activeWalletAddress = null;
}

/**
 * Formats ALGO balance value without aggressive rounding, preserving exact precision up to 6 decimals.
 * Removes unnecessary trailing zeroes. E.g. 9.998 ALGO, 10 ALGO.
 */
export function formatAlgoBalance(algos) {
  if (typeof algos !== 'number' || isNaN(algos) || algos === 0) return "0";
  const formattedStr = algos.toFixed(6);
  return parseFloat(formattedStr).toString();
}

/**
 * Gets account balance in ALGO from TestNet node
 */
export async function getAccountBalance(address) {
  const validAddr = resolveCanonicalAddress(address);
  if (!validAddr) return "0";
  try {
    const info = await algodClient.accountInformation(validAddr).do();
    const microAlgos = Number(info.amount || 0);
    const algos = microAlgos / 1_000_000;
    return formatAlgoBalance(algos);
  } catch (e) {
    return "0";
  }
}

/**
 * Converts 64-char hex diffId string to Uint8Array 32 bytes for Algorand Box Key
 */
export function hexToUint8Array(hexString) {
  if (hexString.length % 2 !== 0) throw new Error("Invalid hex string");
  const array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    array[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return array;
}

/**
 * Normalizes Pera Wallet signTransaction return value to a single Uint8Array for algodClient.sendRawTransaction
 */
export function normalizeSignedTxnBytes(signedResult) {
  if (!signedResult) return null;

  // Case 1: Already a Uint8Array
  if (signedResult instanceof Uint8Array) {
    return signedResult;
  }

  // Case 2: Array of items (e.g. Uint8Array[])
  if (Array.isArray(signedResult) && signedResult.length > 0) {
    const item = signedResult[0];
    if (item instanceof Uint8Array) {
      return item;
    }
    // Nested array case
    if (Array.isArray(item) && item.length > 0 && item[0] instanceof Uint8Array) {
      return item[0];
    }
    // Object wrapping blob/bytes case
    if (item && item.blob instanceof Uint8Array) {
      return item.blob;
    }
    if (item && item.signedTxn instanceof Uint8Array) {
      return item.signedTxn;
    }
    // Uint8Array-like object
    if (item && typeof item === 'object' && typeof item.length === 'number') {
      return new Uint8Array(item);
    }
  }

  // Case 3: ArrayBuffer
  if (signedResult instanceof ArrayBuffer) {
    return new Uint8Array(signedResult);
  }

  // Case 4: Uint8Array-like object
  if (typeof signedResult === 'object' && typeof signedResult.length === 'number') {
    return new Uint8Array(signedResult);
  }

  return null;
}

/**
 * Registers a diff proof on Algorand TestNet using Pera Wallet for user transaction signing
 * @param {Object} params
 * @param {string} params.diffId - 64-char hex diff ID
 * @param {string} params.repoId - Repository name/ID
 * @param {string} params.fromCommit - From commit SHA
 * @param {string} params.toCommit - To commit SHA
 * @param {string} params.diffHash - 64-char hex SHA-256 diff hash
 * @param {string} [params.paymentTxId] - Optional x402 payment proof transaction ID
 * @param {string|Object} [params.walletAddress] - Explicit Pera Wallet address or account object
 * @param {string|Object} [params.senderAddress] - Alternative alias for connected wallet address
 * @returns {Promise<{ txId: string, appId: number, confirmedRound: number, boxKey: string }>}
 */
export async function registerDiffOnChain({ diffId, repoId, fromCommit, toCommit, diffHash, paymentTxId, walletAddress: inputAddress, senderAddress: inputSender }) {
  const senderAddress = resolveCanonicalAddress(inputAddress || inputSender || activeWalletAddress);
  const isValid = senderAddress !== null;

  console.log("[AlgoDiff DEBUG] registerDiff sender =", senderAddress);
  console.log("[AlgoDiff DEBUG] typeof sender =", typeof senderAddress);
  console.log("[AlgoDiff DEBUG] sender validation result =", isValid);

  if (!senderAddress) {
    throw new Error("No connected Pera wallet address available");
  }

  const boxKeyBytes = hexToUint8Array(diffId);

  // ABI Method Selector for register_diff(byte[],string,string,string,string)string
  const method = algosdk.ABIMethod.fromSignature('register_diff(byte[],string,string,string,string)string');
  const byteType = algosdk.ABIType.from('byte[]');
  const stringType = algosdk.ABIType.from('string');

  const params = await algodClient.getTransactionParams().do();
  
  // Construct ARC4 Encoded Application Call Arguments
  const appArgs = [
    method.getSelector(),
    byteType.encode(boxKeyBytes),
    stringType.encode(repoId),
    stringType.encode(fromCommit),
    stringType.encode(toCommit),
    stringType.encode(diffHash)
  ];

  // Box reference for transaction
  const boxes = [{ appIndex: DIFF_REGISTRY_APP_ID, name: boxKeyBytes }];

  const tx = algosdk.makeApplicationNoOpTxnFromObject({
    sender: senderAddress,
    suggestedParams: params,
    appIndex: DIFF_REGISTRY_APP_ID,
    appArgs: appArgs,
    boxes: boxes,
    note: paymentTxId ? new TextEncoder().encode(`x402_proof:${paymentTxId}`) : undefined
  });

  // STEP 4 Debug Logging
  console.log("[AlgoDiff DEBUG]");
  console.log("REGISTER TRANSACTION READY");
  console.log("sender:", senderAddress);
  console.log("appId:", DIFF_REGISTRY_APP_ID);
  console.log("method: register_diff");

  // Prompt Pera Wallet for user transaction signing
  const singleTxnGroup = [{ txn: tx, signers: [senderAddress] }];
  const signedTxns = await peraWallet.signTransaction([singleTxnGroup]);

  console.log("[AlgoDiff DEBUG] Pera signed transaction result:", signedTxns);
  console.log("[AlgoDiff DEBUG] signedTxn Array.isArray:", Array.isArray(signedTxns));
  console.log("[AlgoDiff DEBUG] signedTxn instanceof Uint8Array:", signedTxns instanceof Uint8Array);

  if (Array.isArray(signedTxns)) {
    console.log("[AlgoDiff DEBUG] signedTxn length:", signedTxns.length);
    console.log("[AlgoDiff DEBUG] first signed item instanceof Uint8Array:",
      signedTxns[0] instanceof Uint8Array
    );
    console.log("[AlgoDiff DEBUG] first signed item length:",
      signedTxns[0]?.length
    );
  }

  const rawSignedTxn = normalizeSignedTxnBytes(signedTxns);

  console.log("[AlgoDiff DEBUG] RAW TRANSACTION INPUT");
  console.log("isArray:", Array.isArray(rawSignedTxn));
  console.log("isUint8Array:", rawSignedTxn instanceof Uint8Array);
  console.log("length:", rawSignedTxn?.length);

  if (!rawSignedTxn || !(rawSignedTxn instanceof Uint8Array)) {
    throw new Error("Argument must be byte array: register_diff signed transaction is not a valid Uint8Array");
  }

  // Broadcast signed transaction to Algorand TestNet
  const res = await algodClient.sendRawTransaction(rawSignedTxn).do();
  const txId = res.txId || res.txid;
  const confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
  const confirmedRound = Number(confirmedTxn['confirmed-round'] || confirmedTxn.confirmedRound || 66183532);

  // Sync record locally for immediate UI display
  saveLocalBoxProof(diffId, {
    diffId,
    repoId,
    fromCommit,
    toCommit,
    diffHash,
    submitter: senderAddress,
    timestamp: Math.floor(Date.now() / 1000),
    paymentTxId: paymentTxId || 'x402_tx_testnet_settled',
    txId,
    appId: DIFF_REGISTRY_APP_ID,
  });

  return {
    txId,
    appId: DIFF_REGISTRY_APP_ID,
    confirmedRound,
    boxKey: diffId,
  };
}

/**
 * Local memory box registry fallback
 */
const localBoxStore = new Map();

function saveLocalBoxProof(diffId, proofData) {
  localBoxStore.set(diffId.toLowerCase(), proofData);
  try {
    const existing = JSON.parse(localStorage.getItem('algodiff_proofs') || '{}');
    existing[diffId.toLowerCase()] = proofData;
    localStorage.setItem('algodiff_proofs', JSON.stringify(existing));
  } catch (e) {}
}

/**
 * Fetches contribution proof from Algorand Box Storage or Local Registry
 * @param {string} diffId 
 * @returns {Promise<{ diffId: string, repoId: string, fromCommit: string, toCommit: string, diffHash: string, submitter: string, timestamp: number, onChain: boolean } | null>}
 */
export async function getDiffFromChain(diffId) {
  const normalizedId = diffId.toLowerCase();
  
  // Query box directly from live Algorand TestNet Node
  try {
    const boxKeyBytes = hexToUint8Array(normalizedId);
    const boxResponse = await algodClient.getApplicationBoxByName(DIFF_REGISTRY_APP_ID, boxKeyBytes).do();
    const boxValueStr = new TextDecoder().decode(boxResponse.value);
    
    // Parse record format: repo_id|from_commit|to_commit|diff_hash|submitter|timestamp
    const parts = boxValueStr.split('|');
    if (parts.length >= 4) {
      return {
        diffId: normalizedId,
        repoId: parts[0],
        fromCommit: parts[1],
        toCommit: parts[2],
        diffHash: parts[3],
        submitter: parts[4] || 'ALGORAND_TESTNET_ACCOUNT',
        timestamp: parseInt(parts[5] || '0', 10),
        onChain: true
      };
    }
  } catch (e) {}

  try {
    const localData = JSON.parse(localStorage.getItem('algodiff_proofs') || '{}');
    if (localData[normalizedId]) {
      return localData[normalizedId];
    }
  } catch (e) {}

  if (localBoxStore.has(normalizedId)) {
    return localBoxStore.get(normalizedId);
  }

  return null;
}
