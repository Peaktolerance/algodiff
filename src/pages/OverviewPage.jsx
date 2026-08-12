import React from 'react';
import { Eye, ShieldCheck, Activity, Plus, GitBranch, GitCommit, ArrowRight, CheckCircle2, Clock, FileText } from 'lucide-react';

export default function OverviewPage({ stats, activity, repos, onOpenAddModal, onSelectRepo, onSelectUpdate, onNavigateToTab }) {
  const totalRepos = stats?.totalRepos || repos?.length || 0;
  const totalUpdates = stats?.totalUpdates || activity?.length || 0;
  const verifiedProofs = stats?.verifiedProofs || activity?.filter(a => a.verifiedOnChain).length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Algorand Verified Change Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Understand every change.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-sky-300 to-emerald-300">
              Prove what happened.
            </span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Repo Watch continuously monitors GitHub repositories, calculates canonical SHA-256 diff fingerprints, generates structured Change Intelligence summaries, and anchors proofs to Algorand TestNet.
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              Add Repository
            </button>
            <button
              onClick={() => onNavigateToTab('watch')}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-colors border border-white/10"
            >
              <Eye className="w-4 h-4 text-indigo-300" />
              Explore Repo Watch
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Metric 1: Watched Repos */}
        <div className="saas-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Watched Repositories</p>
            <h2 className="text-3xl font-extrabold text-slate-900 font-mono">{totalRepos}</h2>
            <p className="text-xs text-slate-500">Active monitoring</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <GitBranch className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Updates Detected */}
        <div className="saas-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Updates Detected</p>
            <h2 className="text-3xl font-extrabold text-slate-900 font-mono">{totalUpdates}</h2>
            <p className="text-xs text-slate-500">Diffs fingerprinted</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Verified Proofs */}
        <div className="saas-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Proofs</p>
            <h2 className="text-3xl font-extrabold text-slate-900 font-mono">{verifiedProofs}</h2>
            <p className="text-xs text-slate-500">Anchored on Algorand</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Recent Activity List */}
      <div className="saas-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Recent Repository Activity
            </h3>
            <p className="text-xs text-slate-500">Latest commit updates and verifiable SHA-256 diff fingerprints</p>
          </div>
          <button
            onClick={() => onNavigateToTab('activity')}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
          >
            View all activity
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activity && activity.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {activity.slice(0, 6).map((item) => (
              <div
                key={item.updateId}
                onClick={() => onSelectUpdate(item)}
                className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap font-mono text-xs">
                    <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-md">
                      {item.repoId}
                    </span>
                    <span className="text-slate-500">
                      commit {item.toShortSha || item.toCommit?.substring(0, 7)}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900 leading-snug">
                    {item.summary?.overview || item.commitMessage}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                    {item.summary?.categories && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
                        {item.summary.categories[0] || 'Feature'}
                      </span>
                    )}
                    {item.summary?.riskLevel && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-sans">
                        {item.summary.riskLevel} Risk
                      </span>
                    )}
                    <span>{item.stats?.filesChanged || 1} files</span>
                    <span className="text-emerald-600 font-medium">+{item.stats?.additions || 0}</span>
                    <span className="text-rose-600 font-medium">-{item.stats?.deletions || 0}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {item.verifiedOnChain ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Registered on Algorand
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                      ○ Detected
                    </span>
                  )}
                  <button className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1">
                    View Change
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <FileText className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">No activity logged yet.</p>
            <button
              onClick={onOpenAddModal}
              className="btn-primary text-xs px-4 py-2 rounded-xl inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add a Repository to Watch
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
