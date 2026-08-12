import React, { useState } from 'react';
import { ArrowLeft, GitCommit, ShieldCheck, CheckCircle2, Copy, Check, FileText, AlertTriangle, Cpu, Tag, Clock, ExternalLink, Info, FileCode, PlusCircle, MinusCircle, ChevronDown, ChevronRight, XCircle } from 'lucide-react';
import DiffViewer from '../components/DiffViewer';

export default function RepoDetailPage({ repo, updates = [], onBack, onRegisterProof, onNavigateToVerify, wallet }) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedDiffId, setCopiedDiffId] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState(updates[0] || null);
  const [isDiffExpanded, setIsDiffExpanded] = useState(true);

  const activeUpdate = selectedUpdate || updates[0] || null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedDiffId(true);
      setTimeout(() => setCopiedDiffId(false), 2000);
    }
  };

  if (!repo) return null;

  // Extract file impact details if available
  const filesList = activeUpdate?.filesDetails || (activeUpdate?.summary?.files || activeUpdate?.files || []).map(f => (
    typeof f === 'string' ? { filename: f, status: 'modified', additions: 0, deletions: 0 } : f
  ));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Navigation & Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="btn-secondary px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Repo Watch
        </button>

        <a
          href={repo.htmlUrl || `https://github.com/${repo.fullName}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 hover:underline"
        >
          View on GitHub
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Repo Banner Card */}
      <div className="saas-card p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              Watched Repository
            </span>
            <h1 className="text-2xl font-extrabold font-mono tracking-tight text-white">{repo.fullName}</h1>
            <p className="text-xs text-slate-300 max-w-xl">{repo.description || 'Public GitHub repository'}</p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono bg-white/10 p-3 rounded-xl border border-white/10 shrink-0">
            <div>
              <div className="text-slate-400 text-[10px]">Detected Updates</div>
              <div className="text-lg font-bold text-white">{updates.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      {activeUpdate ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Change Intelligence Report (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Change Intelligence Primary Card */}
            <div className="saas-card p-6 space-y-6">
              
              {/* Header Info & Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider font-mono">
                    Change Intelligence Report
                  </div>
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-slate-900 mt-1">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{activeUpdate.fromShortSha || activeUpdate.fromCommit?.substring(0,7)}</span>
                    <span className="text-slate-400">→</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">{activeUpdate.toShortSha || activeUpdate.toCommit?.substring(0,7)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeUpdate.summary?.categories?.map((cat) => (
                    <span key={cat} className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 uppercase tracking-wider">
                      {cat}
                    </span>
                  ))}
                  {activeUpdate.summary?.riskLevel && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      activeUpdate.summary.riskLevel === 'Critical' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      activeUpdate.summary.riskLevel === 'High' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      activeUpdate.summary.riskLevel === 'Medium' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {activeUpdate.summary.riskLevel} Risk
                    </span>
                  )}
                </div>
              </div>

              {/* 1. WHAT CHANGED? */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  What Changed?
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {activeUpdate.summary?.overview || activeUpdate.commitMessage}
                  </p>

                  {activeUpdate.summary?.whatChanged && activeUpdate.summary.whatChanged.length > 0 && (
                    <ul className="space-y-1.5 text-xs text-slate-700 font-mono pt-1">
                      {activeUpdate.summary.whatChanged.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-indigo-600 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* 2. WHY DOES IT MATTER? */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Why Does It Matter?
                </h3>
                <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-xs text-slate-800 leading-relaxed font-sans font-medium">
                  {activeUpdate.summary?.whyItMatters || 'Updates codebase logic across the modified files based on diff evidence.'}
                </div>
              </div>

              {/* 3. IMPACT METRICS ROW & RISK EXPLANATION */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Files Changed</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono">{activeUpdate.stats?.filesChanged || filesList.length || 1}</div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                  <div className="text-[10px] text-emerald-700 uppercase font-semibold">Additions</div>
                  <div className="text-base font-extrabold text-emerald-700 font-mono">+{activeUpdate.stats?.additions || 0}</div>
                </div>

                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
                  <div className="text-[10px] text-rose-700 uppercase font-semibold">Deletions</div>
                  <div className="text-base font-extrabold text-rose-700 font-mono">-{activeUpdate.stats?.deletions || 0}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Commit SHA</div>
                  <div className="text-sm font-bold text-slate-800 font-mono">{activeUpdate.toShortSha || activeUpdate.toCommit?.substring(0, 7)}</div>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                * Risk is inferred from changed files, code patterns, and change type.
              </p>

              {/* 4. FILES AFFECTED */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  Files Affected ({filesList.length})
                </h3>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs font-mono">
                  {filesList.map((fileObj, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          fileObj.status === 'added' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          fileObj.status === 'removed' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {fileObj.status || 'modified'}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">{fileObj.filename || fileObj}</span>
                      </div>

                      {(fileObj.additions !== undefined || fileObj.deletions !== undefined) && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-emerald-700 font-bold">+{fileObj.additions || 0}</span>
                          <span className="text-rose-700 font-bold">-{fileObj.deletions || 0}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 5. CRYPTOGRAPHIC IDENTITY */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Change Fingerprint
                </h3>

                <div className="p-4 bg-slate-900 rounded-xl text-slate-200 space-y-3 font-mono text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-indigo-400 font-semibold text-[10px] uppercase tracking-wider">Canonical SHA-256</span>
                      <button 
                        onClick={() => handleCopy(activeUpdate.diffHash, 'hash')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedHash ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded text-[11px] text-emerald-400 break-all select-all">
                      {activeUpdate.diffHash}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Diff ID (Algorand Box Key)</span>
                      <button 
                        onClick={() => handleCopy(activeUpdate.diffId, 'diffId')}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedDiffId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedDiffId ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded text-[11px] text-indigo-300 break-all select-all">
                      {activeUpdate.diffId}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 pt-1 font-sans">
                    This fingerprint uniquely identifies the canonicalized repository change used by AlgoDiff.
                  </p>
                </div>
              </div>

              {/* 6. ON-CHAIN STATUS CARD */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Algorand Proof Status
                </h3>

                {activeUpdate.verifiedOnChain ? (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold font-mono text-sm">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ✓ REGISTERED ON ALGORAND
                      </div>
                      <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-semibold">
                        App ID: 769036041
                      </span>
                    </div>

                    <p className="text-xs text-emerald-800 font-mono">
                      Computed fingerprint matches the fingerprint stored in Algorand Box Storage.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 bg-white p-3 rounded-lg border border-emerald-200">
                      <div>
                        <span className="text-slate-500">Transaction ID: </span>
                        <span className="font-bold text-slate-900 select-all">{activeUpdate.txId || 'Confirmed'}</span>
                      </div>
                      {activeUpdate.confirmedRound && (
                        <div>
                          <span className="text-slate-500">Block Round: </span>
                          <span className="font-bold text-emerald-700">#{activeUpdate.confirmedRound}</span>
                        </div>
                      )}
                    </div>

                    {onNavigateToVerify && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => onNavigateToVerify(activeUpdate)}
                          className="btn-primary px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Verify Proof
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center gap-2 text-slate-800 font-bold font-mono text-sm">
                      <span className="w-3 h-3 rounded-full border-2 border-slate-400 inline-block" />
                      ○ NOT REGISTERED
                    </div>
                    <p className="text-xs text-slate-600 font-mono">
                      This change has been detected and fingerprinted, but no Algorand proof has been registered yet.
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onRegisterProof(activeUpdate)}
                        className="btn-algo px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Register Proof on Algorand
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Collapsible Actual Diff Evidence Section */}
            <div className="saas-card overflow-hidden">
              <button
                onClick={() => setIsDiffExpanded(!isDiffExpanded)}
                className="w-full bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold font-mono text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Actual Unified Diff Evidence
                </div>
                {isDiffExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {isDiffExpanded && (
                <DiffViewer
                  diffText={activeUpdate.diffText}
                  stats={activeUpdate.stats}
                  fromCommit={activeUpdate.fromShortSha || activeUpdate.fromCommit}
                  toCommit={activeUpdate.toShortSha || activeUpdate.toCommit}
                />
              )}
            </div>

          </div>

          {/* Right Column: Update Timeline List (1 col) */}
          <div className="space-y-4">
            <div className="saas-card p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
                Commit Updates Timeline ({updates.length})
              </h3>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {updates.map((upd) => {
                  const isSelected = activeUpdate.updateId === upd.updateId;
                  return (
                    <div
                      key={upd.updateId}
                      onClick={() => setSelectedUpdate(upd)}
                      className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                        <span className="text-indigo-600 font-bold">{upd.toShortSha || upd.toCommit?.substring(0, 7)}</span>
                        <span className="text-slate-400">
                          {new Date(upd.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="line-clamp-2 font-sans leading-snug">{upd.summary?.overview || upd.commitMessage}</p>
                      
                      <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="font-mono text-slate-500">{upd.stats?.filesChanged || 1} files</span>
                        {upd.verifiedOnChain ? (
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Registered
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">Detected</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div className="saas-card p-12 text-center text-slate-400">
          <p className="text-sm">No updates detected yet for this repository.</p>
        </div>
      )}

    </div>
  );
}
