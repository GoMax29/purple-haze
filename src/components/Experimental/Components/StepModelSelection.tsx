import { TierSelection } from '../types';
import StatusBadge from './StatusBadge';

interface StepModelSelectionProps {
  selections: TierSelection[];
}

const TIER_COLORS = {
  short: { header: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  mid: { header: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  long: { header: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5' },
} as const;

export default function StepModelSelection({ selections }: StepModelSelectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 4 — Sélection par horizon
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {selections.map((sel) => {
          const colors = TIER_COLORS[sel.tier];
          return (
            <div
              key={sel.tier}
              className={`rounded-lg border ${colors.border} ${colors.bg} p-3 space-y-2`}
            >
              {/* Tier header */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${colors.header}`}>
                  {sel.label}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sel.independentFamilies} indep.
                </span>
              </div>

              {/* Primary models */}
              <div className="space-y-0.5">
                {sel.models.map((m) => (
                  <div key={m.endpoint.id} className="flex items-center gap-1.5 text-[10px]">
                    <span>{m.endpoint.providerFlag}</span>
                    <span className="text-slate-200 flex-1 truncate">{m.endpoint.name}</span>
                    <span className="text-slate-500 font-mono">{m.endpoint.resolution_km}km</span>
                  </div>
                ))}
              </div>

              {/* Fallbacks */}
              {sel.fallbacks.length > 0 && (
                <div className="pt-1 border-t border-slate-700/30">
                  <div className="text-[9px] text-slate-500 mb-0.5 flex items-center gap-1">
                    <StatusBadge status="info" label={`+${sel.fallbacks.length}`} />
                    <span>Fallback</span>
                  </div>
                  {sel.fallbacks.slice(0, 3).map((m) => (
                    <div key={m.endpoint.id} className="flex items-center gap-1.5 text-[10px] opacity-60 italic">
                      <span>{m.endpoint.providerFlag}</span>
                      <span className="text-slate-300 truncate">{m.endpoint.name}</span>
                    </div>
                  ))}
                  {sel.fallbacks.length > 3 && (
                    <span className="text-[9px] text-slate-600">+{sel.fallbacks.length - 3} more</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
