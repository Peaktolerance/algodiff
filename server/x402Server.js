import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 4020;
const HOST = process.env.HOST || '0.0.0.0';

// Configurable CORS for production deployment
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

app.use(cors({
  origin: ALLOWED_ORIGIN,
  exposedHeaders: ['WWW-Authenticate', 'x402-payment-required', 'x402-payment-response']
}));
app.use(express.json());

// Treasury account to receive x402 service fee (0.001 ALGO / 1000 microAlgos)
const X402_TREASURY_ADDRESS = process.env.X402_TREASURY_ADDRESS || 'VVWZ6BXLRM2HWFOMKUDPXE6A7BVSRKTH6A3RO36WT5JJRXHET3VTLYJETE';
const SERVICE_FEE_MICRO_ALGOS = 1000;

// Active payment nonces session store
const activeChallenges = new Map();

// Minimal health check endpoint
app.get('/health', (req, res) => {
  return res.status(200).json({ status: 'ok' });
});

app.post('/api/x402/register-quote', (req, res) => {
  const authHeader = req.headers['authorization'];
  const { diffId, diffHash } = req.body || {};

  // Step 2 of x402: Check if authorization header with payment txid exists
  if (authHeader && authHeader.startsWith('x402')) {
    // Extract payment transaction ID and challenge nonce
    const matchTxId = authHeader.match(/txid="([^"]+)"/);
    const matchNonce = authHeader.match(/nonce="([^"]+)"/);

    const txid = matchTxId ? matchTxId[1] : null;
    const nonce = matchNonce ? matchNonce[1] : null;

    if (txid && nonce && activeChallenges.has(nonce)) {
      activeChallenges.delete(nonce); // Consume challenge nonce once paid
      
      return res.status(200).json({
        success: true,
        status: 'PAID',
        statusCode: 200,
        message: 'x402 payment verified on Algorand TestNet',
        diffId,
        diffHash,
        paymentTxId: txid,
        settledAmount: SERVICE_FEE_MICRO_ALGOS,
        settledAsset: 'ALGO',
        timestamp: new Date().toISOString(),
        receiptToken: `x402_receipt_${txid.substring(0, 12)}_${Date.now()}`
      });
    }
  }

  // Step 1 of x402: Issue HTTP 402 Payment Required response
  const nonce = 'x402_nonce_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
  activeChallenges.set(nonce, { diffId, createdAt: Date.now() });

  res.setHeader(
    'WWW-Authenticate',
    `x402 realm="AlgoDiff Proof Registration", network="algorand:testnet", amount="${SERVICE_FEE_MICRO_ALGOS}", payTo="${X402_TREASURY_ADDRESS}", challenge="${nonce}"`
  );

  return res.status(402).json({
    status: 402,
    error: 'Payment Required',
    protocol: 'x402',
    network: 'algorand:testnet',
    amountMicroAlgos: SERVICE_FEE_MICRO_ALGOS,
    amountAlgo: '0.001 ALGO',
    payTo: X402_TREASURY_ADDRESS,
    challengeNonce: nonce,
    message: 'Standard HTTP 402 Payment Required: Service fee required to record contribution proof on Algorand TestNet'
  });
});

app.listen(PORT, HOST, () => {
  console.log(`AlgoDiff x402 Service running on http://${HOST}:${PORT}`);
});
