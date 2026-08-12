import React, { useState } from 'react';
import { getDiffFromChain } from '../services/algorandClient';
import { SAMPLE_REPOSITORIES, generateGitDiff } from '../services/gitEngine';
import { generateContributionHash, generateDiffId } from '../services/canonicalHash';
import { ShieldCheck, ShieldAlert, Search, CheckCircle2, XCircle, Database, GitCommit, FileCode, RefreshCw } from 'lucide-react';

export default function VerifyPage({ initialDiffId }) {
  const [searchDiffId, setSearchDiffId] = useState(initialDiffId || '');
  const [selectedRepoId, setSelectedRepoId] = useState('TechMart');
  const [fromCommitId, setFromCommitId] = useState('abc1234567890abcdef1234567890abcdef12345');
  const [toCommitId, setToCommitId] = useState('def567890abcdef1234567890abcdef12345678');

  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleVerify = async () => {
    setIsLoading(true);
    setVerificationResult(null);

    try {
      // 1. Generate local diff & local hash from selected commits
      const gitDiff = generateGitDiff(selectedRepoId, fromCommitId, toCommitId);
      const { diffHash: localHash } = await generateContributionHash({
        repositoryIdentifier: selectedRepoId,
        fromCommit: fromCommitId,
        toCommit: toCommitId,
        diff: gitDiff.unifiedDiff,
      });

      const computedDiffId = searchDiffId.trim() || (await generateDiffId(selectedRepoId, fromCommitId, toCommitId, localHash));

      // 2. Fetch recorded proof from Algorand TestNet Box Storage
      const onChainRecord = await getDiffFromChain(computedDiffId);

      if (!onChainRecord) {
        setVerificationResult({
          status: 'NOT_FOUND',
          computedDiffId,
          localHash,
          onChainHash: null,
          isMatch: false,
          message: 'No contribution proof recorded on Algorand for this diffId.'
        });
      } else {
        const isMatch = onChainRecord.diffHash.toLowerCase() === localHash.toLowerCase();
        setVerificationResult({
          status: isMatch ? 'VERIFIED' : 'MISMATCH',
          computedDiffId,
          localHash,
          onChainHash: onChainRecord.diffHash,
          isMatch,
          onChainRecord,
          message: isMatch
            ? 'The local contribution diff matches the immutable blockchain commitment.'
            : 'Verification Failed: Local diff hash does not match the on-chain recorded fingerprint!'
        });
      }
    } catch (err) {
      console.error("Verification error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="glass-panel p-6 border-l-4 border-l-emerald-500">
        <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          2. Independent On-Chain Verification
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Query proof metadata stored in Algorand Box Storage and re-evaluate cryptographic SHA-256 fingerprint against the blockchain.
        </p>
      </div>

      {/* Input Parameters */}
      <div className="glass-panel p-6 space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-400 mb-2">
            On-Chain Box Key (diffId) [Optional / Search]
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchDiffId}
              onChange={(e) => setSearchDiffId(e.target.value)}
              placeholder="Paste 64-char hex diffId or select commits below..."
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs rounded-xl p-3 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Repository</label>
            <select
              value={selectedRepoId}
              onChange={(e) => setSelectedRepoId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-mono"
            >
              {Object.values(SAMPLE_REPOSITORIES).map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">From Commit</label>
            <select
              value={fromCommitId}
              onChange={(e) => setFromCommitId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-mono"
            >
              {SAMPLE_REPOSITORIES[selectedRepoId]?.commits.map((c) => (
                <option key={c.id} value={c.id}>{c.shortId} — {c.message}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">To Commit</label>
            <select
              value={toCommitId}
              onChange={(e) => setToCommitId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5 font-mono"
            >
              {SAMPLE_REPOSITORIES[selectedRepoId]?.commits.map((c) => (
                <option key={c.id} value={c.id}>{c.shortId} — {c.message}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="glow-btn-algo px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify Contribution On-Chain
          </button>
        </div>
      </div>

      {/* Verification Result Section */}
      {verificationResult && (
        <div className="space-y-6">
          
          {/* Main Status Banner */}
          {verificationResult.isMatch ? (
            <div className="glass-panel p-6 border-2 border-emerald-500 bg-emerald-950/40 text-emerald-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3 text-emerald-400 font-mono font-bold text-xl">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                ✓ VERIFIED: PROOF MATCHES ALGORAND COMMITMENT
              </div>
              <p className="text-xs font-mono text-emerald-300/90 pl-11">
                {verificationResult.message}
              </p>
            </div>
          ) : (
            <div className="glass-panel p-6 border-2 border-rose-500 bg-rose-950/40 text-rose-200 rounded-xl space-y-2">
              <div className="flex items-center gap-3 text-rose-400 font-mono font-bold text-xl">
                <XCircle className="w-8 h-8 text-rose-500" />
                ✗ HASH MISMATCH / VERIFICATION FAILED
              </div>
              <p className="text-xs font-mono text-rose-300/90 pl-11">
                {verificationResult.message}
              </p>
            </div>
          )}

          {/* Detailed Hash Comparison Table */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Cryptographic Fingerprint Comparison
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Local SHA-256 Hash</div>
                <div className="text-cyan-400 font-bold break-all">{verificationResult.localHash}</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">On-Chain Algorand Box Hash</div>
                <div className="text-emerald-400 font-bold break-all">
                  {verificationResult.onChainHash || 'NOT RECORDED ON ALGORAND BOX STORAGE'}
                </div>
              </div>
            </div>

            {verificationResult.onChainRecord && (
              <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500">Repository: </span>
                  <span className="text-slate-200 font-bold">{verificationResult.onChainRecord.repoId}</span>
                </div>
                <div>
                  <span className="text-slate-500">Submitter: </span>
                  <span className="text-slate-200 font-bold truncate block">{verificationResult.onChainRecord.submitter}</span>
                </div>
                <div>
                  <span className="text-slate-500">Registered: </span>
                  <span className="text-slate-200 font-bold">
                    {new Date((verificationResult.onChainRecord.timestamp || Date.now() / 1000) * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
