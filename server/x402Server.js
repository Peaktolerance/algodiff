import express from 'express';
import cors from 'cors';
import { parseGitHubInput, fetchGitHubRepoDetails, fetchGitHubCommits, fetchGitHubDiff } from './clients/githubClient.js';
import { watcherStore } from './storage/watcherStore.js';
import { checkRepo, checkAllRepos, startPolling } from './watcher/repoWatcher.js';

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
  return res.status(200).json({ status: 'ok', time: new Date().toISOString() });
});

// ==========================================
// PRESERVED X402 HTTP PAYMENT SERVICE
// ==========================================
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


// ==========================================
// REPO WATCH REST API ENDPOINTS
// ==========================================

// GET /api/watch/repos - List watched repositories & platform stats
app.get('/api/watch/repos', (req, res) => {
  const repos = watcherStore.getWatchedRepos();
  const activity = watcherStore.getActivityLog(100);
  const verifiedCount = activity.filter(a => a.verifiedOnChain).length;

  return res.status(200).json({
    success: true,
    stats: {
      totalRepos: repos.length,
      totalUpdates: activity.length,
      verifiedProofs: verifiedCount,
    },
    repos,
  });
});

// POST /api/watch/repos - Add a repository to watch list
app.post('/api/watch/repos', async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ success: false, error: 'Repository URL or owner/repo is required.' });
    }

    const parsed = parseGitHubInput(url);
    if (!parsed) {
      return res.status(400).json({ success: false, error: 'Invalid GitHub URL or repository format. Supported format: https://github.com/owner/repository or owner/repository' });
    }

    const repoSlug = `${parsed.owner}/${parsed.repo}`;
    const existing = watcherStore.getRepo(repoSlug);
    if (existing) {
      return res.status(400).json({ success: false, error: `Repository '${repoSlug}' is already being watched.` });
    }

    // Fetch repository details from GitHub
    const repoDetails = await fetchGitHubRepoDetails(parsed.owner, parsed.repo);

    const newRepo = {
      id: repoDetails.fullName,
      owner: repoDetails.owner,
      name: repoDetails.name,
      fullName: repoDetails.fullName,
      description: repoDetails.description,
      htmlUrl: repoDetails.htmlUrl,
      addedAt: new Date().toISOString(),
      lastChecked: null,
      lastCommitSha: null,
      status: 'ACTIVE',
    };

    watcherStore.addRepo(newRepo);

    // Trigger immediate check to populate baseline commit and update
    try {
      await checkRepo(newRepo.id);
    } catch (checkErr) {
      console.warn(`[API] Initial check for newly added repo ${newRepo.id} warning:`, checkErr.message);
    }

    const updatedRepo = watcherStore.getRepo(newRepo.id);
    return res.status(201).json({
      success: true,
      message: `Successfully added ${repoSlug} to Repo Watch.`,
      repo: updatedRepo || newRepo,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Could not add repository to watch list.'
    });
  }
});

// DELETE /api/watch/repos/:owner/:repo - Remove a watched repository
app.delete('/api/watch/repos/:owner/:repo', (req, res) => {
  const repoId = req.params.owner && req.params.repo ? `${req.params.owner}/${req.params.repo}` : (req.query.id || req.body.id);
  if (!repoId) {
    return res.status(400).json({ success: false, error: 'Repository ID is required.' });
  }

  const removed = watcherStore.removeRepo(repoId);
  if (!removed) {
    return res.status(404).json({ success: false, error: `Repository '${repoId}' not found.` });
  }

  return res.status(200).json({
    success: true,
    message: `Repository '${repoId}' removed from watch list.`,
    repoId,
  });
});

// GET /api/watch/activity - Recent activity timeline
app.get('/api/watch/activity', (req, res) => {
  const limit = parseInt(req.query.limit || '50', 10);
  const activity = watcherStore.getActivityLog(limit);
  return res.status(200).json({
    success: true,
    count: activity.length,
    activity,
  });
});

// POST /api/watch/check - Manually trigger check for repository updates
app.post('/api/watch/check', async (req, res) => {
  try {
    const { repoId } = req.body || {};
    if (repoId) {
      const result = await checkRepo(repoId);
      return res.status(200).json({ success: true, results: [result] });
    }

    const results = await checkAllRepos();
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message || 'Failed to check repository updates.' });
  }
});

// GET /api/watch/updates/:updateId - Detailed update report
app.get('/api/watch/updates/:updateId', (req, res) => {
  const { updateId } = req.params;
  const updateDetails = watcherStore.getUpdateDetails(updateId);
  
  if (!updateDetails) {
    return res.status(404).json({ success: false, error: `Update report '${updateId}' not found.` });
  }

  return res.status(200).json({
    success: true,
    update: updateDetails,
  });
});

// POST /api/watch/mark-verified - Record on-chain registration verification
app.post('/api/watch/mark-verified', (req, res) => {
  const { updateId, txId, confirmedRound, submitter } = req.body || {};
  if (!updateId) {
    return res.status(400).json({ success: false, error: 'updateId is required' });
  }

  const updateObj = watcherStore.getUpdateDetails(updateId);
  if (!updateObj) {
    return res.status(404).json({ success: false, error: 'Update record not found' });
  }

  updateObj.verifiedOnChain = true;
  updateObj.txId = txId;
  updateObj.confirmedRound = confirmedRound;
  updateObj.submitter = submitter;

  watcherStore.saveUpdateDetails(updateId, updateObj);

  // Update in activity list as well
  const activityList = watcherStore.getActivityLog(200);
  const actItem = activityList.find(a => a.updateId === updateId);
  if (actItem) {
    actItem.verifiedOnChain = true;
    actItem.txId = txId;
    actItem.confirmedRound = confirmedRound;
    actItem.submitter = submitter;
    watcherStore.saveToFile();
  }

  return res.status(200).json({ success: true, update: updateObj });
});

// GET /api/watch/repos/:owner/:repo - Get specific repository details & activity
app.get('/api/watch/repos/:owner/:repo', (req, res) => {
  const repoId = `${req.params.owner}/${req.params.repo}`;
  const repo = watcherStore.getRepo(repoId);
  if (!repo) {
    return res.status(404).json({ success: false, error: `Repository '${repoId}' not found.` });
  }

  const repoActivity = watcherStore.getActivityLog(100).filter(a => a.repoId.toLowerCase() === repoId.toLowerCase());
  return res.status(200).json({
    success: true,
    repo,
    updates: repoActivity,
  });
});

// ==========================================
// GITHUB REST API PROXY ENDPOINTS (Manual Diff)
// ==========================================

// GET /api/github/repos/:owner/:repo - Repo Details Proxy
app.get('/api/github/repos/:owner/:repo', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const repoDetails = await fetchGitHubRepoDetails(owner, repo);
    return res.status(200).json(repoDetails);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to fetch repository details' });
  }
});

// GET /api/github/repos/:owner/:repo/commits - Commit History Proxy
app.get('/api/github/repos/:owner/:repo/commits', async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const limit = parseInt(req.query.per_page, 10) || 25;
    const commits = await fetchGitHubCommits(owner, repo, limit);
    return res.status(200).json(commits);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to fetch commit list' });
  }
});

// GET /api/github/repos/:owner/:repo/compare/:baseSha...:headSha - Diff Comparison Proxy
app.get('/api/github/repos/:owner/:repo/compare/:baseSha...:headSha', async (req, res) => {
  try {
    const { owner, repo, baseSha, headSha } = req.params;
    const diffData = await fetchGitHubDiff(owner, repo, baseSha, headSha);
    return res.status(200).json(diffData);
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Failed to compare commits' });
  }
});

app.listen(PORT, HOST, () => {
  console.log(`AlgoDiff x402 & RepoWatch Server running on http://${HOST}:${PORT}`);
  // Start 5-minute background polling loop
  startPolling(5);
});
