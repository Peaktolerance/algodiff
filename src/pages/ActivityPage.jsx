import React, { useState } from 'react';
import { Activity, Clock, CheckCircle2, ShieldCheck, ArrowRight, Filter, Tag, AlertTriangle } from 'lucide-react';

export default function ActivityPage({ activity = [], onSelectUpdate, onNavigateToVerify }) {
  const [selectedRepoFilter, setSelectedRepoFilter] = useState('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Extract unique filter options
  const repoOptions = Array.from(new Set(activity.map(a => a.repoId)));
  const categoryOptions = ['feature', 'bug fix', 'security', 'API', 'UI', 'database', 'payments', 'tests', 'documentation'];
  const riskOptions = ['Low', 'Medium', 'High', 'Critical'];
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'detected', label: 'Detected' },
    { value: 'registered', label: 'Registered' },
    { value: 'verified', label: 'Verified' },
  ];

  const filteredActivity = activity.filter(item => {
    if (selectedRepoFilter !== 'ALL' && item.repoId !== selectedRepoFilter) return false;
    
    if (selectedCategoryFilter !== 'ALL') {
      const cats = item.summary?.categories || [];
      if (!cats.includes(selectedCategoryFilter)) return false;
    }

    if (selectedRiskFilter !== 'ALL') {
      if ((item.summary?.riskLevel || 'Low') !== selectedRiskFilter) return false;
    }

    if (selectedStatusFilter !== 'ALL') {
      if (selectedStatusFilter === 'verified' && !item.verifiedOnChain) return false;
      if (selectedStatusFilter === 'registered' && !item.verifiedOnChain) return false;
      if (selectedStatusFilter === 'detected' && item.verifiedOnChain) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-mono flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Repository Activity Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chronological Change Intelligence audit feed of detected commits, fingerprints, and Algorand proofs
          </p>
        </div>

        {/* Multi-Column Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Repo Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Repo:</span>
            <select
              value={selectedRepoFilter}
              onChange={(e) => setSelectedRepoFilter(e.target.value)}
              className="bg-transparent font-mono text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Repos</option>
              {repoOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Risk:</span>
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Risks</option>
              {riskOptions.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Verification Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent font-mono text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              {statusOptions.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Activity Timeline List */}
      {filteredActivity && filteredActivity.length > 0 ? (
        <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6">
          {filteredActivity.map((item) => {
            const dateStr = new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div key={item.updateId} className="relative group">
                
                {/* Timeline Dot Indicator */}
                <div className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  item.verifiedOnChain
                    ? 'bg-emerald-500 border-white ring-4 ring-emerald-100'
                    : 'bg-indigo-600 border-white ring-4 ring-indigo-100'
                }`} />

                {/* Activity Card */}
                <div 
                  onClick={() => onSelectUpdate(item)}
                  className="saas-card-interactive p-5 space-y-3 cursor-pointer"
                >
                  
                  {/* Top Bar info */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-md">
                        {item.repoId}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600 font-semibold">
                        commit {item.toShortSha || item.toCommit?.substring(0, 7)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {dateStr} at {timeStr}
                      </span>
                      {item.verifiedOnChain ? (
                        <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Algorand Registered
                        </span>
                      ) : (
                        <span className="text-slate-600 bg-slate-100 border border-slate-200 font-medium px-2.5 py-0.5 rounded-full text-[11px]">
                          ○ Detected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Change Intelligence Title & Badges */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">
                      {item.summary?.overview || item.commitMessage}
                    </h3>

                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {item.summary?.categories?.map(c => (
                        <span key={c} className="font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                          {c}
                        </span>
                      ))}
                      {item.summary?.riskLevel && (
                        <span className="font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                          {item.summary.riskLevel} Risk
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Stats & SHA-256 fingerprint preview */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs font-mono border-t border-slate-100">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span>{item.stats?.filesChanged || 1} file{(item.stats?.filesChanged || 1) !== 1 ? 's' : ''}</span>
                      <span className="text-emerald-600 font-medium">+{item.stats?.additions || 0}</span>
                      <span className="text-rose-600 font-medium">-{item.stats?.deletions || 0}</span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>SHA-256: <span className="text-slate-700 font-bold">{item.diffHash?.substring(0, 14)}...</span></span>
                      
                      {item.verifiedOnChain && onNavigateToVerify && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onNavigateToVerify(item); }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-sans font-semibold transition-colors flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verify Proof
                        </button>
                      )}

                      <button
                        onClick={(e) => { e.stopPropagation(); onSelectUpdate(item); }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 font-sans font-semibold transition-colors flex items-center gap-1"
                      >
                        View Change
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="saas-card p-12 text-center text-slate-400 space-y-2">
          <Activity className="w-10 h-10 mx-auto opacity-30 text-indigo-600" />
          <p className="text-sm font-medium text-slate-600">No activity items match the selected filters.</p>
        </div>
      )}

    </div>
  );
}
