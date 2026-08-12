import React, { useState, useEffect } from 'react';
import { SAMPLE_REPOSITORIES, generateGitDiff } from '../services/gitEngine';
import { generateContributionHash } from '../services/canonicalHash';
import DiffViewer from '../components/DiffViewer';
import { Cpu, ShieldCheck, ShieldAlert, Zap, RefreshCcw, CheckCircle2, XCircle, FileCode2, ArrowRight } from 'lucide-react';

export default function TamperDemoPage() {
  const repoId = 'TechMart';
  const fromCommit = SAMPLE_REPOSITORIES.TechMart.commits[0];
  const toCommit = SAMPLE_REPOSITORIES.TechMart.commits[1];

  // Base Original Diff
  const originalDiffResult = generateGitDiff(repoId, fromCommit.id, toCommit.id);
  const [originalHash, setOriginalHash] = useState('');
  
  // Interactive Tampered Diff
  const [modifiedDiffText, setModifiedDiffText] = useState('');
  const [modifiedHash, setModifiedHash] = useState('');
  const [isTampered, setIsTampered] = useState(false);

  useEffect(() => {
    async function initHashes() {
      const { diffHash } = await generateContributionHash({
        repositoryIdentifier: repoId,
        fromCommit: fromCommit.id,
        toCommit: toCommit.id,
        diff: originalDiffResult.unifiedDiff,
      });
      setOriginalHash(diffHash);
      setModifiedDiffText(originalDiffResult.unifiedDiff);
      setModifiedHash(diffHash);
    }
    initHashes();
  }, []);

  // Update Hash when user modifies text in textarea
  const handleDiffTextChange = async (newText) => {
    setModifiedDiffText(newText);
    const { diffHash } = await generateContributionHash({
      repositoryIdentifier: repoId,
      fromCommit: fromCommit.id,
      toCommit: toCommit.id,
      diff: newText,
    });
    setModifiedHash(diffHash);
    setIsTampered(newText !== originalDiffResult.unifiedDiff);
  };

  // 1-Click Preset Tamper Trigger: Add `+ 1` to payment return line
  const handleApplyPresetTamper = () => {
    const tampered = originalDiffResult.unifiedDiff.replace(
      'return amount;',
      'return amount + 1;'
    );
    handleDiffTextChange(tampered);
  };

  // Reset back to original untampered diff
  const handleResetToOriginal = () => {
    handleDiffTextChange(originalDiffResult.unifiedDiff);
  };

  const isMatch = originalHash.toLowerCase() === modifiedHash.toLowerCase();

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="saas-card p-6 border-l-4 border-l-amber-500 bg-white flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-600" />
            Interactive Tamper Detection Demo
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Demonstrates how altering a single character in the contribution diff invalidates the SHA-256 fingerprint on Algorand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyPresetTamper}
            className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-xs transition-colors"
          >
            <Zap className="w-4 h-4" />
            1-Click Tamper Diff (Add +1)
          </button>
          <button
            onClick={handleResetToOriginal}
            className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset Original
          </button>
        </div>
      </div>

      {/* Main Status Indicator Banner */}
      {isMatch ? (
        <div className="saas-card p-6 border-2 border-emerald-500 bg-emerald-50 text-emerald-900 rounded-xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-emerald-700 font-mono font-bold text-lg">
              <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              ✓ VERIFIED: ORIGINAL CONTRIBUTION MATCHES ON-CHAIN PROOF
            </div>
            <span className="text-xs font-mono bg-emerald-100 px-3 py-1 rounded-lg text-emerald-800 border border-emerald-300 font-bold">
              HASH A === HASH B
            </span>
          </div>
          <p className="text-xs font-mono text-emerald-800 pl-10">
            The canonical fingerprint generated from the diff matches the recorded Algorand TestNet commitment.
          </p>
        </div>
      ) : (
        <div className="saas-card p-6 border-2 border-rose-500 bg-rose-50 text-rose-900 rounded-xl space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-rose-700 font-mono font-bold text-lg">
              <XCircle className="w-7 h-7 text-rose-600" />
              ✗ HASH MISMATCH / TAMPER DETECTED!
            </div>
            <span className="text-xs font-mono bg-rose-100 px-3 py-1 rounded-lg text-rose-800 border border-rose-300 font-bold">
              HASH A ≠ HASH B
            </span>
          </div>
          <p className="text-xs font-mono text-rose-800 pl-10">
            Alert: The diff has been modified. The recalculated SHA-256 fingerprint differs from the on-chain recorded proof!
          </p>
        </div>
      )}

      {/* Side-by-Side Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Registered On-Chain Diff (Hash A) */}
        <div className="space-y-4">
          <div className="saas-card p-4 border-l-4 border-l-indigo-600 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700 font-mono font-bold text-xs">
              <FileCode2 className="w-4 h-4" />
              ORIGINAL CONTRIBUTION (HASH A)
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-mono border border-indigo-200 font-semibold">
              Recorded on Algorand
            </span>
          </div>

          <DiffViewer
            diffText={originalDiffResult.unifiedDiff}
            stats={originalDiffResult.stats}
            fromCommit={fromCommit}
            toCommit={toCommit}
            isEditable={false}
          />

          <div className="saas-card p-4 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">On-Chain Fingerprint (Hash A)</div>
            <div className="font-mono text-xs text-indigo-400 font-bold bg-slate-900 p-3 rounded-xl break-all">
              {originalHash}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Modifiable Diff (Hash B) */}
        <div className="space-y-4">
          <div className={`saas-card p-4 flex items-center justify-between border-l-4 ${
            isTampered ? 'border-l-amber-500 bg-amber-50/50' : 'border-l-slate-400'
          }`}>
            <div className="flex items-center gap-2 text-slate-800 font-mono font-bold text-xs">
              <FileCode2 className="w-4 h-4 text-amber-600" />
              EVALUATED DIFF (HASH B)
            </div>
            {isTampered ? (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold border border-amber-300">
                1-Char Modified
              </span>
            ) : (
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium border border-slate-200">
                Untampered
              </span>
            )}
          </div>

          <DiffViewer
            diffText={modifiedDiffText}
            fromCommit={fromCommit}
            toCommit={toCommit}
            isEditable={true}
            onChange={handleDiffTextChange}
          />

          <div className="saas-card p-4 space-y-1">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">Recalculated Fingerprint (Hash B)</div>
            <div className={`font-mono text-xs break-all font-bold bg-slate-900 p-3 rounded-xl ${
              isMatch ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {modifiedHash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
