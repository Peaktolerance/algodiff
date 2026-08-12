import React from 'react';
import { FileCode, PlusCircle, MinusCircle, FileText } from 'lucide-react';

export default function DiffViewer({ diffText, stats, fromCommit, toCommit, isEditable = false, onChange }) {
  if (!diffText && !isEditable) {
    return (
      <div className="saas-card p-8 text-center text-slate-400">
        <FileCode className="w-10 h-10 mx-auto mb-2 opacity-40 text-slate-400" />
        <p className="text-xs">No diff generated yet.</p>
      </div>
    );
  }

  const lines = (diffText || '').split('\n');

  return (
    <div className="saas-card overflow-hidden">
      {/* Header Bar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileText className="w-4 h-4 text-indigo-600" />
          <span className="font-mono text-xs font-semibold text-slate-800">
            Unified Git Diff ({fromCommit?.shortId || fromCommit?.substring?.(0,7) || 'Base'} → {toCommit?.shortId || toCommit?.substring?.(0,7) || 'Head'})
          </span>
        </div>

        {/* Diff Statistics */}
        {stats && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
              {stats.filesChanged || stats.totalFiles || 0} file{(stats.filesChanged || stats.totalFiles) !== 1 ? 's' : ''}
            </span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] font-semibold flex items-center gap-1">
              <PlusCircle className="w-3 h-3 text-emerald-600" /> +{stats.additions || 0}
            </span>
            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 text-[11px] font-semibold flex items-center gap-1">
              <MinusCircle className="w-3 h-3 text-rose-600" /> -{stats.deletions || 0}
            </span>
          </div>
        )}
      </div>

      {/* Code Diff Display */}
      {isEditable ? (
        <textarea
          value={diffText}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          className="w-full bg-slate-900 text-slate-100 p-4 font-mono-code text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-y"
          placeholder="Edit diff lines here to test tamper detection..."
        />
      ) : (
        <div className="bg-slate-900 p-4 font-mono-code text-xs leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto">
          {lines.map((line, idx) => {
            let lineClass = 'text-slate-300 py-0.5 px-2';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              lineClass = 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500 py-0.5 px-2 font-medium';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              lineClass = 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500 py-0.5 px-2 font-medium';
            } else if (line.startsWith('@@') || line.startsWith('index') || line.startsWith('diff')) {
              lineClass = 'bg-indigo-950/60 text-indigo-300 border-l-2 border-indigo-400 py-0.5 px-2 font-mono font-semibold';
            }

            return (
              <div key={idx} className={`flex items-start ${lineClass}`}>
                <span className="w-8 text-[10px] text-slate-500 select-none text-right pr-3 pt-0.5 font-mono">
                  {idx + 1}
                </span>
                <span className="whitespace-pre-wrap break-all">{line || ' '}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
