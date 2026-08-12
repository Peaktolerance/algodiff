import algosdk from 'algosdk';
import { algodClient, peraWallet, resolveCanonicalAddress, normalizeSignedTxnBytes } from './algorandClient.js';

const X402_SERVER_ENDPOINT = import.meta.env?.VITE_X402_API_URL || '/api/x402/register-quote';

/**
 * Executes full x402 HTTP Payment Protocol flow using Pera Wallet for user authorization
 * @param {Object} params
 * @param {string} params.diffId
 * @param {string} params.diffHash
 * @param {Object|string} params.walletAccount - Active Pera Wallet account object or address
 * @param {string} [params.walletAddress] - Explicit Pera Wallet address
 * @param {Function} [params.onStepChange] - Callback for updating UI payment modal state
 * @returns {Promise<{ success: boolean, paymentTxId: string, receiptToken: string }>}
 */
export async function executeX402Payment({ diffId, diffHash, walletAccount, walletAddress: inputAddress, onStepChange }) {
  try {
    // STEP 1: Send initial request to paid resource
    if (onStepChange) onStepChange({ step: 1, title: 'Requesting Resource', status: 'pending', details: 'Sending request to x402 resource endpoint...' });
    
    let initialRes;
    try {
      initialRes = await fetch(X402_SERVER_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diffId, diffHash }),
      });
    } catch (netErr) {
      throw new Error("Could not reach x402 payment server at " + X402_SERVER_ENDPOINT);
    }

    // STEP 2: Handle HTTP 402 Payment Required
    if (initialRes.status === 402) {
      const paymentSpec = await initialRes.json();
      const nonce = paymentSpec.challengeNonce || 'nonce_' + Date.now();
      const payToAddress = paymentSpec.payTo;
      const amount = paymentSpec.amountMicroAlgos || 1000;

      if (onStepChange) {
        onStepChange({
          step: 2,
          title: 'HTTP 402 Payment Required',
          status: '402_RECEIVED',
          details: `Service Fee Required: ${paymentSpec.amountAlgo || '0.001 ALGO'}`,
          paymentSpec
        });
      }

      // STEP 3: Prompt Pera Wallet for User Payment Approval
      if (onStepChange) {
        onStepChange({
          step: 3,
          title: 'Approve Payment in Pera Wallet',
          status: 'SIGNING',
          details: `Please approve ${amount / 1e6} ALGO service fee transfer to ${payToAddress.substring(0, 10)}... in Pera Wallet`
        });
      }

      const senderAddress = resolveCanonicalAddress(inputAddress || walletAccount);

      console.log("[AlgoDiff DEBUG] PAYMENT TRANSACTION INPUT");
      console.log("senderAddress:", senderAddress);
      console.log("senderAddress type:", typeof senderAddress);
      console.log("receiver/payTo:", payToAddress);
      console.log("receiver/payTo type:", typeof payToAddress);
      console.log("challenge:", nonce);

      if (!senderAddress) {
        throw new Error("No connected Pera wallet address available");
      }

      // Validate BOTH sender and receiver addresses explicitly with algosdk
      try {
        algosdk.decodeAddress(senderAddress);
      } catch (addrErr) {
        throw new Error("Invalid sender wallet address format: " + senderAddress);
      }

      if (!payToAddress) {
        throw new Error("No x402 treasury payTo address received from server");
      }

      try {
        algosdk.decodeAddress(payToAddress);
      } catch (addrErr) {
        throw new Error(`Invalid x402 treasury payTo address ("${payToAddress}"): ${addrErr.message}`);
      }

      console.log("[AlgoDiff DEBUG] Creating payment transaction", {
        sender: senderAddress,
        receiver: payToAddress,
        amount
      });

      const suggestedParams = await algodClient.getTransactionParams().do();
      const payTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        sender: senderAddress,
        receiver: payToAddress,
        amount: amount,
        note: new TextEncoder().encode(`x402:${nonce}`),
        suggestedParams
      });

      console.log("[X402 DEBUG] UNSIGNED TRANSACTION:");
      console.log("  sender:", payTxn.sender ? algosdk.encodeAddress(payTxn.sender.publicKey) : undefined);
      console.log("  receiver:", payTxn.payment?.receiver ? algosdk.encodeAddress(payTxn.payment.receiver.publicKey) : undefined);
      console.log("  amount:", payTxn.payment?.amount?.toString());
      console.log("  fee:", payTxn.fee?.toString());
      console.log("  firstValid:", payTxn.firstValid?.toString());
      console.log("  lastValid:", payTxn.lastValid?.toString());
      console.log("  genesisID:", payTxn.genesisID);
      console.log("  genesisHash:", payTxn.genesisHash ? (payTxn.genesisHash instanceof Uint8Array ? Array.from(payTxn.genesisHash) : payTxn.genesisHash) : undefined);
      console.log("  note:", payTxn.note ? new TextDecoder().decode(payTxn.note) : undefined);
      console.log("  group:", payTxn.group);

      // Sign x402 service fee payment via Pera Wallet
      const singleTxnGroup = [{ txn: payTxn, signers: [senderAddress] }];
      const signedPayTxns = await peraWallet.signTransaction([singleTxnGroup]);

      console.log("[X402 DEBUG] Pera signed result:", signedPayTxns);
      console.log("[X402 DEBUG] Array.isArray:", Array.isArray(signedPayTxns));
      console.log("[X402 DEBUG] signed result length:", signedPayTxns?.length);
      console.log("[X402 DEBUG] first item:", signedPayTxns?.[0]);
      console.log("[X402 DEBUG] first item type:", typeof signedPayTxns?.[0]);
      console.log(
        "[X402 DEBUG] first item instanceof Uint8Array:",
        signedPayTxns?.[0] instanceof Uint8Array
      );
      console.log(
        "[X402 DEBUG] first item byteLength:",
        signedPayTxns?.[0]?.byteLength
      );

      const rawPayTxn = normalizeSignedTxnBytes(signedPayTxns);

      console.log("[X402 DEBUG] normalized signed bytes:", rawPayTxn);
      console.log("[X402 DEBUG] normalized instanceof Uint8Array:", rawPayTxn instanceof Uint8Array);
      console.log("[X402 DEBUG] normalized byteLength:", rawPayTxn?.byteLength);
      console.log("[X402 DEBUG] normalized length:", rawPayTxn?.length);

      // CRITICAL ALGOSDK VALIDATION DECODING
      try {
        const decodedObj = algosdk.decodeObj(rawPayTxn);
        console.log("[X402 DEBUG] decodeObj success:", decodedObj);
      } catch (err) {
        console.log("[X402 DEBUG] decodeObj failed:", err.message);
      }

      try {
        const decodedStxn = algosdk.decodeSignedTransaction(rawPayTxn);
        console.log("[X402 DEBUG] decodeSignedTransaction success:", decodedStxn);
        if (decodedStxn?.txn) {
          console.log("[X402 DEBUG] Decoded Txn details:");
          console.log("  sender:", decodedStxn.txn.sender ? algosdk.encodeAddress(decodedStxn.txn.sender.publicKey) : undefined);
          console.log("  receiver:", decodedStxn.txn.payment?.receiver ? algosdk.encodeAddress(decodedStxn.txn.payment.receiver.publicKey) : undefined);
          console.log("  amount:", decodedStxn.txn.payment?.amount?.toString());
          console.log("  fee:", decodedStxn.txn.fee?.toString());
          console.log("  firstValid:", decodedStxn.txn.firstValid?.toString());
          console.log("  lastValid:", decodedStxn.txn.lastValid?.toString());
          console.log("  genesisID:", decodedStxn.txn.genesisID);
          console.log("  genesisHash:", decodedStxn.txn.genesisHash ? (decodedStxn.txn.genesisHash instanceof Uint8Array ? Array.from(decodedStxn.txn.genesisHash) : decodedStxn.txn.genesisHash) : undefined);
          console.log("  group:", decodedStxn.txn.group);
          console.log("  note:", decodedStxn.txn.note ? new TextDecoder().decode(decodedStxn.txn.note) : undefined);
        }
      } catch (err) {
        console.log("[X402 DEBUG] decodeSignedTransaction failed:", err.message);
      }

      if (!rawPayTxn || !(rawPayTxn instanceof Uint8Array)) {
        throw new Error("Argument must be byte array: x402 signed transaction is not a valid Uint8Array");
      }

      console.log("[X402 DEBUG] Calling sendRawTransaction with byteLength:", rawPayTxn.byteLength);
      const sendRes = await algodClient.sendRawTransaction(rawPayTxn).do();
      const paymentTxId = sendRes.txId || sendRes.txid;
      await algosdk.waitForConfirmation(algodClient, paymentTxId, 3);

      // STEP 4: Submit Payment Proof back to x402 endpoint
      if (onStepChange) {
        onStepChange({
          step: 4,
          title: 'Verifying x402 Settlement',
          status: 'VERIFYING',
          details: `Authorization Header: x402 txid="${paymentTxId.substring(0, 12)}..."`
        });
      }

      const verifyRes = await fetch(X402_SERVER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `x402 txid="${paymentTxId}", nonce="${nonce}"`
        },
        body: JSON.stringify({ diffId, diffHash })
      });

      if (verifyRes.status === 200) {
        const result = await verifyRes.json();
        if (onStepChange) {
          onStepChange({
            step: 5,
            title: 'x402 Payment Verified (HTTP 200 OK)',
            status: 'SUCCESS',
            details: `Receipt Token: ${result.receiptToken}`,
            receipt: result
          });
        }
        return {
          success: true,
          paymentTxId: result.paymentTxId || paymentTxId,
          receiptToken: result.receiptToken,
        };
      }
    }

    if (initialRes.status === 200) {
      const data = await initialRes.json();
      return { success: true, paymentTxId: data.paymentTxId, receiptToken: data.receiptToken };
    }

    throw new Error(`x402 payment flow error: HTTP ${initialRes.status}`);
  } catch (error) {
    console.error("x402 error:", error);
    if (onStepChange) {
      onStepChange({ step: 99, title: 'Payment Exception', status: 'ERROR', details: error.message });
    }
    throw error;
  }
}
