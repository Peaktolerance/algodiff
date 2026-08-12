import React, { useState, useEffect } from 'react';
import { getDiffFromChain } from '../services/algorandClient';
import { generateDiffId } from '../services/canonicalHash';
import { ShieldCheck, Search, CheckCircle2, XCircle, Database, Clock, RefreshCw, AlertCircle, GitBranch, ArrowRight, Tag, AlertTriangle } from 'lucide-react';

export default function VerifyPage({ initialDiffId, initialUpdate, repos = [], activity = [] }) {
  // Verification mode: 'search' (Path A) or 'select' (Path B)
  const [activePath, setActivePath] = useState(initialDiffId && !initialUpdate ? 'search' : 'select');

  // Path A: Search State
  const [searchQuery, setSearchQuery] = useState(initialDiffId || '');
  const [searchError, setSearchError] = useState(null);

  // Path B: Repo & Update Selection State
  const [selectedRepoId, setSelectedRepoId] = useState(initialUpdate?.repoId || repos[0]?.id || '');
  const [selectedUpdateId, setSelectedUpdateId] = useState(initialUpdate?.updateId || '');

  // Derived available updates for selected repo
  const availableUpdates = activity.filter(
    a => a.repoId.toLowerCase() === selectedRepoId.toLowerCase()
  );

  // Active Update Preview object
  const [previewUpdate, setPreviewUpdate] = useState(initialUpdate || availableUpdates[0] || null);

  // Verification Results State
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  // Auto-sync selected repo when repos array loads
  useEffect(() => {
    if (!selectedRepoId && repos.length > 0) {
      setSelectedRepoId(repos[0].id);
    }
  }, [repos]);

  // Sync available updates when selected repo changes
  useEffect(() => {
    if (selectedRepoId) {
      const updatesForRepo = activity.filter(
        a => a.repoId.toLowerCase() === selectedRepoId.toLowerCase()
      );
      if (updatesForRepo.length > 0) {
        // If current selected update belongs to repo, keep it; otherwise set to first
        if (!updatesForRepo.some(u => u.updateId === selectedUpdateId)) {
          setSelectedUpdateId(updatesForRepo[0].updateId);
          setPreviewUpdate(updatesForRepo[0]);
        }
      } else {
        setSelectedUpdateId('');
        setPreviewUpdate(null);
      }
    }
  }, [selectedRepoId, activity]);

  // Sync preview update when selectedUpdateId changes
  useEffect(() => {
    if (selectedUpdateId) {
      const found = activity.find(a => a.updateId === selectedUpdateId);
      if (found) {
        setPreviewUpdate(found);
      }
    }
  }, [selectedUpdateId, activity]);

  // Handle Path Selection change
  const handleSelectRepoChange = (e) => {
    const rId = e.target.value;
    setSelectedRepoId(rId);
    setVerificationResult(null);
  };

  const handleSelectUpdateChange = (e) => {
    const uId = e.target.value;
    setSelectedUpdateId(uId);
    setVerificationResult(null);
  };

  // Execute Verification
  const handleVerify = async () => {
    setSearchError(null);
    setIsLoading(true);
    setVerificationResult(null);

    try {
      let targetDiffId = '';
      let targetDiffHash = '';
      let targetUpdateContext = null;

      if (activePath === 'search') {
        const cleaned = searchQuery.trim().toLowerCase();
        if (!cleaned || !/^[0-9a-fA-F]{64}$/.test(cleaned)) {
          setSearchError('Enter a valid Diff ID or 64-character SHA-256 fingerprint.');
          setIsLoading(false);
          return;
        }

        // Check if matching update exists in local activity store
        const matchedActivity = activity.find(
          a => a.diffId?.toLowerCase() === cleaned || a.diffHash?.toLowerCase() === cleaned
        );

        if (matchedActivity) {
          targetDiffId = matchedActivity.diffId;
          targetDiffHash = matchedActivity.diffHash;
          targetUpdateContext = matchedActivity;
          setPreviewUpdate(matchedActivity);
        } else {
          // If pure hash/diffId entered without local update match
          targetDiffId = cleaned;
          targetDiffHash = cleaned;
        }
      } else {
        // Path B: From selected update preview
        if (!previewUpdate) {
          setSearchError('Please select a valid repository update to verify.');
          setIsLoading(false);
          return;
        }
        targetDiffId = previewUpdate.diffId;
        targetDiffHash = previewUpdate.diffHash;
        targetUpdateContext = previewUpdate;
      }

      // Query live Algorand TestNet Box Storage
      const queryResult = await getDiffFromChain(targetDiffId);
      const onChainRecord = queryResult?.record || null;

      if (!onChainRecord) {
        if (queryResult.status === 'BOX_DECODE_ERROR') {
          setVerificationResult({
            status: 'DECODE_ERROR',
            computedDiffId: targetDiffId,
            computedDiffHash: targetDiffHash,
            updateContext: targetUpdateContext,
            onChainRecord: null,
            title: 'BOX DECODE ERROR',
            message: queryResult.message || 'On-chain box exists but payload structure could not be parsed.',
          });
        } else if (queryResult.status === 'NETWORK_ERROR') {
          setVerificationResult({
            status: 'NETWORK_ERROR',
            computedDiffId: targetDiffId,
            computedDiffHash: targetDiffHash,
            updateContext: targetUpdateContext,
            onChainRecord: null,
            title: 'ALGORAND NETWORK ERROR',
            message: queryResult.message || 'Unable to reach Algorand TestNet node.',
          });
        } else {
          setVerificationResult({
            status: 'NOT_REGISTERED',
            computedDiffId: targetDiffId,
            computedDiffHash: targetDiffHash,
            updateContext: targetUpdateContext,
            onChainRecord: null,
            title: 'NO ON-CHAIN PROOF FOUND',
            message: queryResult.message || 'This repository change has not been registered on Algorand yet.',
          });
        }
      } else {
        const isMatch = onChainRecord.diffHash.toLowerCase() === targetDiffHash.toLowerCase();
        if (isMatch) {
          setVerificationResult({
            status: 'VERIFIED',
            computedDiffId: targetDiffId,
            computedDiffHash: targetDiffHash,
            updateContext: targetUpdateContext,
            onChainRecord,
            title: '✓ VERIFIED ON ALGORAND',
            message: 'Fingerprint matches on-chain record.',
          });
        } else {
          setVerificationResult({
            status: 'MISMATCH',
            computedDiffId: targetDiffId,
            computedDiffHash: targetDiffHash,
            updateContext: targetUpdateContext,
            onChainRecord,
            title: 'VERIFICATION FAILED',
            message: 'The computed fingerprint does not match the fingerprint stored on Algorand.',
          });
        }
      }
    } catch (err) {
      console.error("Verification execution error:", err);
      setVerificationResult({
        status: 'ERROR',
        title: 'VERIFICATION EXCEPTION',
        message: err.message || 'Could not reach Algorand node for verification.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="saas-card p-6 bg-white border-l-4 border-l-indigo-600">
        <h2 className="text-xl font-bold text-slate-900 font-mono flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-indigo-600" />
          Verify a Repository Change
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Independently verify that an exact repository change matches the fingerprint registered on Algorand.
        </p>
      </div>

      {/* Main Verification Control Card */}
      <div className="saas-card p-6 space-y-6">
        
        {/* Verification Path Selector Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <button
            onClick={() => { setActivePath('select'); setVerificationResult(null); setSearchError(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
              activePath === 'select'
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                : 'btn-secondary'
            }`}
          >
            <GitBranch className="w-4 h-4 text-indigo-600" />
            Select Repo Watch Update
          </button>

          <button
            onClick={() => { setActivePath('search'); setVerificationResult(null); setSearchError(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2 transition-all ${
              activePath === 'search'
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                : 'btn-secondary'
            }`}
          >
            <Search className="w-4 h-4 text-slate-700" />
            Search by Diff ID / SHA-256
          </button>
        </div>

        {/* PATH A: Direct Search Input */}
        {activePath === 'search' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Diff ID or 64-Character SHA-256 Fingerprint
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setSearchError(null); }}
                placeholder="Paste 64-character hex string (e.g. 5b9154639df85e5cfdba6064...)"
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            {searchError && (
              <p className="text-xs text-rose-700 font-mono bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                ⚠️ {searchError}
              </p>
            )}
          </div>
        )}

        {/* PATH B: Select Repo & Update Dropdowns */}
        {activePath === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Watched Repository</label>
              <select
                value={selectedRepoId}
                onChange={handleSelectRepoChange}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                {repos.map((r) => (
                  <option key={r.id} value={r.id}>{r.fullName || r.id}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Detected Update / Commit</label>
              <select
                value={selectedUpdateId}
                onChange={handleSelectUpdateChange}
                disabled={availableUpdates.length === 0}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl p-3 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-50"
              >
                {availableUpdates.length > 0 ? (
                  availableUpdates.map((u) => (
                    <option key={u.updateId} value={u.updateId}>
                      {u.toShortSha || u.toCommit?.substring(0, 7)} — {u.summary?.overview || u.commitMessage}
                    </option>
                  ))
                ) : (
                  <option value="">No updates logged for this repository</option>
                )}
              </select>
            </div>
          </div>
        )}

        {/* Compact Verification Preview Card */}
        {previewUpdate && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {previewUpdate.repoId}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-800 font-bold">
                  {previewUpdate.fromShortSha || previewUpdate.fromCommit?.substring(0, 7)} → {previewUpdate.toShortSha || previewUpdate.toCommit?.substring(0, 7)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewUpdate.summary?.categories?.map(c => (
                  <span key={c} className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                    {c}
                  </span>
                ))}
                {previewUpdate.summary?.riskLevel && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                    {previewUpdate.summary.riskLevel} Risk
                  </span>
                )}
              </div>
            </div>

            <p className="font-sans font-semibold text-slate-900 leading-snug">
              "{previewUpdate.summary?.overview || previewUpdate.commitMessage}"
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500">Canonical SHA-256: </span>
                <span className="text-indigo-600 font-bold select-all">{previewUpdate.diffHash}</span>
              </div>
              <div>
                <span className="text-slate-500">Diff ID: </span>
                <span className="text-slate-800 font-bold select-all">{previewUpdate.diffId?.substring(0, 20)}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={handleVerify}
            disabled={isLoading || (activePath === 'select' && !previewUpdate)}
            className="btn-algo px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Verify On-Chain
          </button>
        </div>

      </div>

      {/* Verification Result Section (3 Explicit States) */}
      {verificationResult && (
        <div className="space-y-6">
          
          {/* STATE 1: VERIFIED */}
          {verificationResult.status === 'VERIFIED' && (
            <div className="saas-card p-6 border-2 border-emerald-500 bg-emerald-50 text-emerald-900 rounded-xl space-y-4">
              <div className="flex items-center gap-3 text-emerald-700 font-mono font-bold text-lg">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0" />
                <span>{verificationResult.title}</span>
              </div>

              <p className="text-xs font-mono text-emerald-800 pl-10 font-semibold">
                {verificationResult.message}
              </p>

              <div className="bg-white p-4 rounded-xl border border-emerald-200 font-mono text-xs space-y-2 text-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <span className="text-slate-500">Repository: </span>
                    <span className="font-bold text-slate-900">{verificationResult.onChainRecord?.repoId || verificationResult.updateContext?.repoId || 'GitHub Repo'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Change: </span>
                    <span className="font-bold text-indigo-600">
                      {verificationResult.onChainRecord?.fromCommit?.substring(0, 7)} → {verificationResult.onChainRecord?.toCommit?.substring(0, 7)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Algorand App ID: </span>
                    <span className="font-bold text-slate-900">769036041</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Verification Status: </span>
                    <span className="font-bold text-emerald-600">Fingerprint matches on-chain record</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <div>
                    <span className="text-slate-500">Canonical SHA-256: </span>
                    <span className="text-emerald-700 font-bold break-all select-all">{verificationResult.computedDiffHash}</span>
                  </div>
                  {verificationResult.onChainRecord?.txId && (
                    <div>
                      <span className="text-slate-500">Algorand Tx ID: </span>
                      <span className="text-slate-900 font-bold select-all">{verificationResult.onChainRecord.txId}</span>
                    </div>
                  )}
                  {verificationResult.onChainRecord?.submitter && (
                    <div>
                      <span className="text-slate-500">Submitter: </span>
                      <span className="text-slate-900 font-bold select-all">{verificationResult.onChainRecord.submitter}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STATE 2: NOT REGISTERED */}
          {verificationResult.status === 'NOT_REGISTERED' && (
            <div className="saas-card p-6 border-2 border-amber-400 bg-amber-50 text-amber-900 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-amber-800 font-mono font-bold text-lg">
                <AlertCircle className="w-7 h-7 text-amber-600 shrink-0" />
                <span>{verificationResult.title}</span>
              </div>

              <p className="text-xs font-mono text-amber-900 pl-10 font-semibold">
                {verificationResult.message}
              </p>

              <div className="bg-white p-4 rounded-xl border border-amber-200 font-mono text-xs space-y-2 text-slate-800">
                <p className="text-xs font-sans text-slate-600">
                  The SHA-256 fingerprint <span className="font-mono text-indigo-600 font-bold">{verificationResult.computedDiffHash?.substring(0, 16)}...</span> was generated locally, but no Box Storage record exists on Algorand TestNet App ID 769036041 for this diffId key.
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: MISMATCH / INVALID */}
          {verificationResult.status === 'MISMATCH' && (
            <div className="saas-card p-6 border-2 border-rose-500 bg-rose-50 text-rose-900 rounded-xl space-y-4">
              <div className="flex items-center gap-3 text-rose-700 font-mono font-bold text-lg">
                <XCircle className="w-7 h-7 text-rose-600 shrink-0" />
                <span>{verificationResult.title}</span>
              </div>

              <p className="text-xs font-mono text-rose-800 pl-10 font-semibold">
                {verificationResult.message}
              </p>

              <div className="bg-white p-4 rounded-xl border border-rose-200 font-mono text-xs space-y-3 text-slate-800">
                <div className="space-y-2">
                  <div className="bg-slate-900 p-3 rounded-xl text-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Computed Local Fingerprint</div>
                    <div className="text-indigo-400 font-bold break-all">{verificationResult.computedDiffHash}</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl text-slate-200">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">On-Chain Algorand Box Record</div>
                    <div className="text-rose-400 font-bold break-all">{verificationResult.onChainRecord?.diffHash || 'Mismatched'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATE 4: DECODE_ERROR */}
          {verificationResult.status === 'DECODE_ERROR' && (
            <div className="saas-card p-6 border-2 border-orange-500 bg-orange-50 text-orange-950 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-orange-800 font-mono font-bold text-lg">
                <AlertTriangle className="w-7 h-7 text-orange-600 shrink-0" />
                <span>{verificationResult.title}</span>
              </div>

              <p className="text-xs font-mono text-orange-900 pl-10 font-semibold">
                {verificationResult.message}
              </p>
            </div>
          )}

          {/* STATE 5: NETWORK_ERROR & ERROR */}
          {(verificationResult.status === 'NETWORK_ERROR' || verificationResult.status === 'ERROR') && (
            <div className="saas-card p-6 border-2 border-rose-400 bg-rose-50 text-rose-900 rounded-xl space-y-3">
              <div className="flex items-center gap-3 text-rose-800 font-mono font-bold text-lg">
                <AlertCircle className="w-7 h-7 text-rose-600 shrink-0" />
                <span>{verificationResult.title}</span>
              </div>

              <p className="text-xs font-mono text-rose-900 pl-10 font-semibold">
                {verificationResult.message}
              </p>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
