import React, { useState, useEffect } from 'react';
import { SAMPLE_REPOSITORIES, parseGitHubUrl, loadPublicGitHubRepo, generateGitDiffAsync } from '../services/gitEngine';
import { generateContributionHash, generateDiffId } from '../services/canonicalHash';
import { executeX402Payment } from '../services/x402Client';
import { registerDiffOnChain, resolveCanonicalAddress } from '../services/algorandClient';
import DiffViewer from '../components/DiffViewer';
import X402Modal from '../components/X402Modal';
import { GitBranch, GitCommit, Fingerprint, ShieldCheck, CreditCard, ArrowRight, CheckCircle, Copy, Check, Loader2, RefreshCw, Code2 } from 'lucide-react';

export default function RegisterPage({ wallet, onNavigateToVerify, onRefreshBalance }) {
  // Source Mode: 'sample' or 'github'
  const [repoMode, setRepoMode] = useState('sample');
  const [githubUrlInput, setGithubUrlInput] = useState('facebook/react');
  const [isLoadingRepo, setIsLoadingRepo] = useState(false);
  const [repoError, setRepoError] = useState(null);

  // Active Loaded Repository Data (Sample or GitHub)
  const [activeRepoData, setActiveRepoData] = useState(SAMPLE_REPOSITORIES.TechMart);
  const [fromCommitId, setFromCommitId] = useState('');
  const [toCommitId, setToCommitId] = useState('');

  const [isGeneratingDiff, setIsGeneratingDiff] = useState(false);
  const [diffData, setDiffData] = useState(null);
  const [hashResult, setHashResult] = useState(null);

  // x402 & Registration State
  const [isX402ModalOpen, setIsX402ModalOpen] = useState(false);
  const [x402State, setX402State] = useState(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState(null);

  const [isRegisteringOnChain, setIsRegisteringOnChain] = useState(false);
  const [chainResult, setChainResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Auto-initialize default commits on repo change
  useEffect(() => {
    if (activeRepoData && activeRepoData.commits && activeRepoData.commits.length >= 2) {
      setFromCommitId(activeRepoData.commits[0].id);
      setToCommitId(activeRepoData.commits[1].id);
    }
  }, [activeRepoData]);

  // Load Public GitHub Repository
  const handleLoadGitHubRepo = async () => {
    setRepoError(null);
    const parsed = parseGitHubUrl(githubUrlInput);
    if (!parsed) {
      setRepoError("Invalid GitHub format. Enter 'owner/repository' or full GitHub URL.");
      return;
    }

    setIsLoadingRepo(true);
    try {
      const repoData = await loadPublicGitHubRepo(parsed.owner, parsed.repo);
      setActiveRepoData(repoData);
      setDiffData(null);
      setHashResult(null);
      setChainResult(null);
    } catch (err) {
      console.error("GitHub repo loading error:", err);
      setRepoError(err.message || "Failed to load public GitHub repository");
    } finally {
      setIsLoadingRepo(false);
    }
  };

  // Switch back to Demo TechMart Repo
  const handleSelectSampleRepo = () => {
    setRepoMode('sample');
    setRepoError(null);
    setActiveRepoData(SAMPLE_REPOSITORIES.TechMart);
    setDiffData(null);
    setHashResult(null);
    setChainResult(null);
  };

  // Handle Diff Generation & Canonical Hashing
  const handleGenerateDiff = async () => {
    if (!fromCommitId || !toCommitId) return;
    setIsGeneratingDiff(true);
    setChainResult(null);
    setPaymentSuccessData(null);

    try {
      const result = await generateGitDiffAsync(
        activeRepoData.id,
        fromCommitId,
        toCommitId,
        activeRepoData
      );

      setDiffData(result);

      // Compute SHA-256 canonical contribution hash
      const { canonicalPayload, diffHash } = await generateContributionHash({
        repositoryIdentifier: activeRepoData.id,
        fromCommit: fromCommitId,
        toCommit: toCommitId,
        diff: result.unifiedDiff,
      });

      const diffId = await generateDiffId(activeRepoData.id, fromCommitId, toCommitId, diffHash);

      setHashResult({
        canonicalPayload,
        diffHash,
        diffId,
      });
    } catch (err) {
      console.error("Diff generation error:", err);
      setRepoError(err.message || "Failed to generate diff");
    } finally {
      setIsGeneratingDiff(false);
    }
  };

  // Trigger x402 Payment Flow
  const handleStartRegisterFlow = async () => {
    if (!hashResult) return;

    console.log("[AlgoDiff DEBUG] BEFORE executeX402Payment wallet =", wallet);
    console.log("[AlgoDiff DEBUG] wallet?.address =", wallet?.address);
    console.log("[AlgoDiff DEBUG] typeof wallet?.address =", typeof wallet?.address);

    const senderAddress = resolveCanonicalAddress(wallet);

    setIsX402ModalOpen(true);
    setX402State({ step: 1, title: 'Initiating x402 Payment', status: 'pending' });

    try {
      const x402Res = await executeX402Payment({
        diffId: hashResult.diffId,
        diffHash: hashResult.diffHash,
        walletAccount: wallet,
        walletAddress: senderAddress,
        onStepChange: (state) => setX402State(state),
      });

      setPaymentSuccessData(x402Res);
      if (onRefreshBalance) onRefreshBalance();
    } catch (e) {
      console.error("[AlgoDiff DEBUG] x402 flow exception:", e);
    }
  };

  // Submit to AlgoPy Smart Contract on Algorand TestNet
  const handleProceedToAlgorand = async () => {
    setIsX402ModalOpen(false);
    setIsRegisteringOnChain(true);

    const resolvedAddress = resolveCanonicalAddress(wallet);

    console.log("[AlgoDiff DEBUG] AFTER x402 200 wallet =", wallet);
    console.log("[AlgoDiff DEBUG] wallet?.address =", wallet?.address);
    console.log("[AlgoDiff DEBUG] resolved address =", resolvedAddress);
    console.log("[AlgoDiff DEBUG] typeof resolved address =", typeof resolvedAddress);

    try {
      const res = await registerDiffOnChain({
        diffId: hashResult.diffId,
        repoId: activeRepoData.id,
        fromCommit: fromCommitId,
        toCommit: toCommitId,
        diffHash: hashResult.diffHash,
        paymentTxId: paymentSuccessData?.paymentTxId,
        walletAddress: resolvedAddress,
      });

      setChainResult(res);
      if (onRefreshBalance) onRefreshBalance();
    } catch (err) {
      console.error("[AlgoDiff DEBUG] Smart contract registration error:", err);
      setRepoError(err.message || "Smart contract registration failed");
    } finally {
      setIsRegisteringOnChain(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Step Header */}
      <div className="glass-panel p-6 border-l-4 border-l-cyan-500">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-cyan-400" />
          1. Select Repository Commits & Generate Diff
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Compare commits from demo repositories or load any Public GitHub Repository directly in browser.
        </p>
      </div>

      {/* Mode Selector & Repository Inputs */}
      <div className="glass-panel p-6 space-y-6">
        
        {/* Repo Mode Buttons */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={handleSelectSampleRepo}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
              repoMode === 'sample'
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <GitCommit className="w-4 h-4 text-cyan-400" />
            TechMart Demo Repo
          </button>

          <button
            onClick={() => setRepoMode('github')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
              repoMode === 'github'
                ? 'bg-cyan-950 border border-cyan-500/50 text-cyan-300 shadow-md'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4 text-white" />
            Public GitHub Repository
          </button>
        </div>

        {/* GitHub Repository Loader Controls */}
        {repoMode === 'github' && (
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-mono text-slate-300 font-semibold">
              Public GitHub Repository URL or Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={githubUrlInput}
                onChange={(e) => setGithubUrlInput(e.target.value)}
                placeholder="e.g. facebook/react or https://github.com/algorand/algosdk"
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl p-3 focus:ring-1 focus:ring-cyan-500"
              />
              <button
                onClick={handleLoadGitHubRepo}
                disabled={isLoadingRepo}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-5 py-3 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shrink-0"
              >
                {isLoadingRepo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Code2 className="w-4 h-4" />}
                Load Repository
              </button>
            </div>
            {repoError && (
              <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2.5 rounded border border-rose-800/50">
                ⚠️ {repoError}
              </p>
            )}
          </div>
        )}

        {/* Selected Repository Card & Commit Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">Active Repository</label>
            <div className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl p-3 font-mono">
              <div className="font-bold text-cyan-300">{activeRepoData?.name}</div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">{activeRepoData?.id}</div>
            </div>
          </div>

          {/* FROM COMMIT Dropdown */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">FROM COMMIT (Base)</label>
            <select
              value={fromCommitId}
              onChange={(e) => setFromCommitId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 font-mono focus:ring-1 focus:ring-cyan-500"
            >
              {activeRepoData?.commits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortId} — {c.message.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          {/* TO COMMIT Dropdown */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-2">TO COMMIT (Target)</label>
            <select
              value={toCommitId}
              onChange={(e) => setToCommitId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-3 font-mono focus:ring-1 focus:ring-cyan-500"
            >
              {activeRepoData?.commits.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.shortId} — {c.message.substring(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              onClick={handleGenerateDiff}
              disabled={isGeneratingDiff}
              className="glow-btn-primary px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
            >
              {isGeneratingDiff ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCommit className="w-4 h-4" />}
              Generate Diff & Compute Fingerprint
            </button>
          </div>
        </div>
      </div>

      {/* Diff Viewer Component */}
      {diffData && (
        <div className="space-y-6">
          <DiffViewer
            diffText={diffData.unifiedDiff}
            stats={diffData.stats}
            fromCommit={diffData.fromCommit}
            toCommit={diffData.toCommit}
          />

          {/* Canonical Hash Card */}
          {hashResult && (
            <div className="glass-panel-glow p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-sm">
                  <Fingerprint className="w-5 h-5" />
                  Canonical SHA-256 Contribution Fingerprint
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  Web Crypto API
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    SHA-256 Diff Hash (64 Hex Characters)
                  </label>
                  <div className="bg-slate-950 p-3 rounded-xl border border-cyan-500/30 flex items-center justify-between">
                    <span className="font-mono text-xs text-cyan-300 break-all">{hashResult.diffHash}</span>
                    <button
                      onClick={() => copyToClipboard(hashResult.diffHash)}
                      className="p-1.5 hover:bg-slate-800 rounded text-slate-400"
                    >
                      {copiedHash ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Deterministic On-Chain Box Key (diffId)
                  </label>
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="font-mono text-xs text-emerald-400 break-all">{hashResult.diffId}</span>
                  </div>
                </div>
              </div>

              {/* Action: Pay x402 & Register on Algorand */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80">
                <div className="text-xs text-slate-400 font-mono space-y-1">
                  <div className="flex items-center gap-2 text-amber-400">
                    <CreditCard className="w-4 h-4" />
                    <span>1. x402 Service Fee: <strong>0.001 ALGO</strong> (HTTP Pay-Per-Use Protocol)</span>
                  </div>
                  <div className="flex items-center gap-2 text-cyan-400 pl-6">
                    <span>2. Algorand Network Fee: <strong>0.001 ALGO</strong> (On-Chain Box Storage Transaction)</span>
                  </div>
                </div>

                <button
                  onClick={handleStartRegisterFlow}
                  className="glow-btn-algo px-6 py-3 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-lg"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Pay Service Fee (x402) & Register Proof on Algorand
                </button>
              </div>
            </div>
          )}

          {/* On-Chain Success Result Card */}
          {chainResult && (
            <div className="glass-panel p-6 border border-emerald-500/50 bg-emerald-950/20 space-y-4">
              <div className="flex items-center gap-3 text-emerald-400 font-mono font-bold text-base">
                <CheckCircle className="w-6 h-6" />
                ✓ Contribution Proof Registered on Algorand TestNet!
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Algorand App ID</div>
                  <div className="text-cyan-300 font-bold mt-1">{chainResult.appId}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Block Round</div>
                  <div className="text-emerald-400 font-bold mt-1">#{chainResult.confirmedRound}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Algorand Transaction ID</div>
                  <div className="text-slate-200 font-bold mt-1 truncate">{chainResult.txId}</div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onNavigateToVerify(hashResult.diffId)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 font-mono"
                >
                  Verify Proof On-Chain <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* x402 Interactive Modal */}
      <X402Modal
        isOpen={isX402ModalOpen}
        onClose={() => setIsX402ModalOpen(false)}
        paymentState={x402State}
        onProceedToRegistration={handleProceedToAlgorand}
      />
    </div>
  );
}
