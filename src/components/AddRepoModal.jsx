import React, { useState } from 'react';
import { X, GitBranch, AlertCircle, Loader2 } from 'lucide-react';

export default function AddRepoModal({ isOpen, onClose, onAddRepo }) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setError(null);
    setLoading(true);

    try {
      await onAddRepo(urlInput.trim());
      setUrlInput('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add repository.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Add Repository to Watch</h3>
              <p className="text-xs text-slate-500">Monitor GitHub commits and detect verifiable diffs</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              GitHub Repository URL or Slug
            </label>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://github.com/owner/repository or owner/repository"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-slate-500 mt-2">
              Supports public repositories (e.g. <span className="font-mono text-slate-700">facebook/react</span> or <span className="font-mono text-slate-700">vercel/next.js</span>).
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Could not add repository</span>
                <p className="mt-0.5 text-rose-600">{error}</p>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-4 py-2 rounded-xl text-xs"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="btn-primary px-4 py-2 rounded-xl text-xs flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding & Fetching...
                </>
              ) : (
                'Start Watching'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
