import React, { useState } from 'react';
import { Plus, RefreshCw, Trash2, Eye, GitBranch, Clock, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import AddRepoModal from '../components/AddRepoModal';

export default function RepoWatchPage({ repos, onAddRepo, onRemoveRepo, onCheckUpdates, onSelectRepo, onSelectUpdate }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [checkingId, setCheckingId] = useState(null);
  const [globalChecking, setGlobalChecking] = useState(false);

  const handleSingleCheck = async (repoId) => {
    setCheckingId(repoId);
    try {
      await onCheckUpdates(repoId);
    } finally {
      setCheckingId(null);
    }
  };

  const handleGlobalCheck = async () => {
    setGlobalChecking(true);
    try {
      await onCheckUpdates();
    } finally {
      setGlobalChecking(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 font-mono">Repo Watch</h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700">
              Polling every 5 min
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitored GitHub repositories with automatic commit diff detection & SHA-256 fingerprinting
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGlobalCheck}
            disabled={globalChecking}
            className="btn-secondary px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 disabled:opacity-50"
            title="Check all watched repositories for new commits"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${globalChecking ? 'animate-spin' : ''}`} />
            {globalChecking ? 'Checking...' : 'Check All'}
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Repository
          </button>
        </div>
      </div>

      {/* Repositories Grid */}
      {repos && repos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {repos.map((repo) => {
            const isCheckingThis = checkingId === repo.id;
            const lastCheckedText = repo.lastChecked
              ? `Checked ${new Date(repo.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Monitoring active';

            return (
              <div key={repo.id} className="saas-card p-6 flex flex-col justify-between space-y-4 hover:border-slate-300">
                
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
                        <GitBranch className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h3 
                          onClick={() => onSelectRepo(repo)}
                          className="font-mono text-sm font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                        >
                          {repo.fullName || repo.id}
                        </h3>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{lastCheckedText}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveRepo(repo.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove repository"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {repo.description || 'Monitored public GitHub repository'}
                  </p>
                </div>

                {/* Latest Commit Summary Box */}
                {repo.lastCommitSha ? (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Latest: {repo.lastCommitSha.substring(0, 7)}
                      </span>
                      <span className="text-slate-500 font-medium">Auto-Fingerprinted</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                      "{repo.latestSummary || 'Repository commit updated'}"
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-500 italic">
                    Initializing baseline check...
                  </div>
                )}

                {/* Card Footer Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleSingleCheck(repo.id)}
                    disabled={isCheckingThis}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingThis ? 'animate-spin text-indigo-600' : ''}`} />
                    {isCheckingThis ? 'Checking...' : 'Check Updates'}
                  </button>

                  <button
                    onClick={() => onSelectRepo(repo)}
                    className="btn-primary px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-semibold"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Details
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="saas-card p-12 text-center text-slate-400 space-y-4">
          <GitBranch className="w-12 h-12 mx-auto opacity-30 text-indigo-600" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-slate-800">No watched repositories yet</h3>
            <p className="text-xs text-slate-500">
              Add a GitHub repository URL or slug (e.g. facebook/react) to begin monitoring commit diffs and generating proofs.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary px-4 py-2 rounded-xl text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add First Repository
          </button>
        </div>
      )}

      {/* Add Repository Modal */}
      <AddRepoModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRepo={onAddRepo}
      />

    </div>
  );
}
