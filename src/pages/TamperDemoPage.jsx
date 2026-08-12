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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 border-l-4 border-l-amber-500 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            3. Interactive Tamper Detection Demo
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Demonstrates how altering a single character in the contribution diff invalidates the SHA-256 fingerprint on Algorand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleApplyPresetTamper}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 shadow-lg shadow-amber-600/30"
          >
            <Zap className="w-4 h-4" />
            1-Click Tamper Diff (Add +1)
          </button>
          <button
            onClick={handleResetToOriginal}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold font-mono flex items-center gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Reset Original
          </button>
        </div>
      </div>

      {/* Main Status Indicator Banner */}
      {isMatch ? (
        <div className="glass-panel p-6 border-2 border-emerald-500 bg-emerald-950/40 text-emerald-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-400 font-mono font-bold text-xl">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ✓ VERIFIED: ORIGINAL CONTRIBUTION MATCHES ON-CHAIN PROOF
            </div>
            <span className="text-xs font-mono bg-emerald-900/80 px-3 py-1 rounded-lg text-emerald-300 border border-emerald-500/40">
              HASH A === HASH B
            </span>
          </div>
          <p className="text-xs font-mono text-emerald-300/90 pl-11">
            The canonical fingerprint generated from the diff matches the recorded Algorand TestNet commitment.
          </p>
        </div>
      ) : (
        <div className="glass-panel p-6 border-2 border-rose-500 bg-rose-950/50 text-rose-200 rounded-xl space-y-2 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-400 font-mono font-bold text-xl">
              <XCircle className="w-8 h-8 text-rose-500" />
              ✗ HASH MISMATCH / TAMPER DETECTED!
            </div>
            <span className="text-xs font-mono bg-rose-900/90 px-3 py-1 rounded-lg text-rose-200 border border-rose-500/50">
              HASH A ≠ HASH B
            </span>
          </div>
          <p className="text-xs font-mono text-rose-300/90 pl-11">
            Alert: The diff has been modified. The recalculated SHA-256 fingerprint differs from the on-chain recorded proof!
          </p>
        </div>
      )}

      {/* Side-by-Side Comparison Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Registered On-Chain Diff (Hash A) */}
        <div className="space-y-4">
          <div className="glass-panel p-4 border border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs">
              <FileCode2 className="w-4 h-4" />
              ORIGINAL CONTRIBUTION (HASH A)
            </div>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-mono border border-cyan-800">
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

          <div className="glass-panel p-4 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">On-Chain Fingerprint (Hash A)</div>
            <div className="font-mono text-xs text-cyan-300 break-all font-bold bg-slate-950 p-2.5 rounded border border-cyan-500/30">
              {originalHash}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Modifiable Diff (Hash B) */}
        <div className="space-y-4">
          <div className={`glass-panel p-4 flex items-center justify-between border ${
            isTampered ? 'border-amber-500/60 bg-amber-950/20' : 'border-slate-800'
          }`}>
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs">
              <FileCode2 className="w-4 h-4" />
              MODIFIED / EVALUATED DIFF (HASH B)
            </div>
            {isTampered ? (
              <span className="text-[10px] bg-amber-900 text-amber-300 px-2 py-0.5 rounded font-mono font-bold border border-amber-500/40">
                1-Char Modified
              </span>
            ) : (
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
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

          <div className="glass-panel p-4 space-y-1">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Recalculated Fingerprint (Hash B)</div>
            <div className={`font-mono text-xs break-all font-bold bg-slate-950 p-2.5 rounded border ${
              isMatch ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/50'
            }`}>
              {modifiedHash}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
