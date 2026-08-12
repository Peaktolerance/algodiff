import React from 'react';
import { FileCode, PlusCircle, MinusCircle, FileText } from 'lucide-react';

export default function DiffViewer({ diffText, stats, fromCommit, toCommit, isEditable = false, onChange }) {
  if (!diffText && !isEditable) {
    return (
      <div className="glass-panel p-8 text-center text-slate-500">
        <FileCode className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No diff generated yet. Select two commits above to view changes.</p>
      </div>
    );
  }

  const lines = (diffText || '').split('\n');

  return (
    <div className="glass-panel overflow-hidden border border-slate-800 rounded-xl">
      {/* Header Bar */}
      <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <FileText className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">
            Unified Git Diff ({fromCommit?.shortId || 'Commit A'} → {toCommit?.shortId || 'Commit B'})
          </span>
        </div>

        {/* Diff Statistics */}
        {stats && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              {stats.filesChanged} file{stats.filesChanged !== 1 ? 's' : ''} changed
            </span>
            <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 flex items-center gap-1">
              <PlusCircle className="w-3 h-3" /> +{stats.additions}
            </span>
            <span className="text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40 flex items-center gap-1">
              <MinusCircle className="w-3 h-3" /> -{stats.deletions}
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
          className="w-full bg-slate-950 text-slate-200 p-4 font-mono-code text-xs leading-relaxed focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-y"
          placeholder="Edit diff lines here to test tamper detection..."
        />
      ) : (
        <div className="bg-slate-950 p-4 font-mono-code text-xs leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto">
          {lines.map((line, idx) => {
            let lineClass = 'text-slate-400 py-0.5 px-2';
            if (line.startsWith('+') && !line.startsWith('+++')) {
              lineClass = 'diff-line-add py-0.5 px-2 font-semibold';
            } else if (line.startsWith('-') && !line.startsWith('---')) {
              lineClass = 'diff-line-del py-0.5 px-2 font-semibold';
            } else if (line.startsWith('@@') || line.startsWith('index') || line.startsWith('diff')) {
              lineClass = 'diff-line-info py-0.5 px-2 font-mono text-cyan-300 font-bold';
            }

            return (
              <div key={idx} className={`flex items-start ${lineClass}`}>
                <span className="w-8 text-[10px] text-slate-600 select-none text-right pr-3 pt-0.5 font-mono">
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
