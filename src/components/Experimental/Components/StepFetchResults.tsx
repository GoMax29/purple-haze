import { FetchResult } from '../types';
import StatusBadge from './StatusBadge';

interface StepFetchResultsProps {
  results: FetchResult[];
  loading: boolean;
}

export default function StepFetchResults({ results, loading }: StepFetchResultsProps) {
  const successCount = results.filter((r) => r.status === 'success').length;
  const totalDuration = results.reduce((sum, r) => sum + (r.fetchDurationMs || 0), 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 5 — Fetch individuel
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {loading ? 'Chargement...' : `${successCount}/${results.length} OK · ${totalDuration}ms`}
        </span>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="animate-spin">&#x27F3;</span>
          <span>Fetching individual models...</span>
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="rounded border border-slate-700/50 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[auto_1fr_70px_60px_50px_60px] gap-2 px-3 py-1.5 bg-slate-800/60 text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
            <span></span>
            <span>Modèle</span>
            <span>Famille</span>
            <span>Statut</span>
            <span>Pts</span>
            <span>Durée</span>
          </div>

          {/* Rows */}
          {results.map((r) => (
            <div
              key={r.model.id}
              className={`grid grid-cols-[auto_1fr_70px_60px_50px_60px] gap-2 px-3 py-1.5 border-t border-slate-800/50 items-center ${
                r.status !== 'success' ? 'opacity-50' : ''
              }`}
            >
              <span className="text-sm">{r.model.providerFlag}</span>
              <span className="text-[11px] text-slate-200 truncate">{r.model.name}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-center truncate">
                {r.model.family}
              </span>
              <StatusBadge
                status={r.status === 'success' ? 'ok' : r.status === 'no_data' ? 'warning' : 'error'}
                label={r.status === 'success' ? 'OK' : r.status === 'no_data' ? 'null' : 'err'}
              />
              <span className="text-[10px] text-slate-400 font-mono text-right">
                {r.dataPoints > 0 ? r.dataPoints : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono text-right">
                {r.fetchDurationMs ? `${r.fetchDurationMs}ms` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Error details */}
      {results.filter((r) => r.error).length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wider">
            Erreurs détaillées
          </div>
          {results
            .filter((r) => r.error)
            .map((r) => (
              <div key={r.model.id} className="text-[10px] text-slate-500 font-mono pl-2 border-l border-red-500/30">
                <span className="text-red-400">{r.model.name}</span>: {r.error}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
