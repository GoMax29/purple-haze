import { OutlierResult } from '../types';
import StatusBadge from './StatusBadge';

interface StepOutlierFilterProps {
  results: OutlierResult[];
}

export default function StepOutlierFilter({ results }: StepOutlierFilterProps) {
  const kept = results.filter((r) => r.kept);
  const rejected = results.filter((r) => !r.kept);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 6 — Filtre des modèles incohérents
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {kept.length} conservés · {rejected.length} rejetés
        </span>
      </div>

      <div className="rounded border border-slate-700/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_70px_80px_60px_1fr] gap-2 px-3 py-1.5 bg-slate-800/60 text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
          <span>Modèle</span>
          <span className="text-right">Moy. 48h</span>
          <span className="text-right">Spread 48h</span>
          <span className="text-center">Statut</span>
          <span>Raison</span>
        </div>

        {/* Rows */}
        {results.map((r) => (
          <div
            key={r.endpoint.id}
            className={`grid grid-cols-[1fr_70px_80px_60px_1fr] gap-2 px-3 py-1.5 border-t border-slate-800/50 items-center ${
              !r.kept ? 'bg-red-500/5' : ''
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{r.endpoint.providerFlag}</span>
              <span className={`text-[11px] ${r.kept ? 'text-slate-200' : 'text-red-300 line-through'}`}>
                {r.endpoint.name}
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-mono text-right">
              {isNaN(r.meanTemp) ? '—' : `${r.meanTemp.toFixed(1)}°`}
            </span>
            <span className={`text-[10px] font-mono text-right ${
              r.spreadFromConsensus > 3 ? 'text-red-400' : 'text-slate-400'
            }`}>
              {r.spreadFromConsensus.toFixed(1)}°
            </span>
            <div className="flex justify-center">
              <StatusBadge status={r.kept ? 'ok' : 'error'} />
            </div>
            <span className="text-[9px] text-slate-500 truncate">
              {r.reason || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
