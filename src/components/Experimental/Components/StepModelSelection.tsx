import { TierSelection } from '../types';
import { MESH_TIER_CONFIG } from '../data/families';

interface StepModelSelectionProps {
  selections: TierSelection[];
}

const TIER_COLORS = {
  fine: { header: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
  medium: { header: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' },
  large: { header: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-500/5' },
} as const;

export default function StepModelSelection({ selections }: StepModelSelectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 3 — Sélection par maille
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {selections.map((sel) => {
          const colors = TIER_COLORS[sel.meshTier];
          const config = MESH_TIER_CONFIG[sel.meshTier];
          return (
            <div
              key={sel.meshTier}
              className={`rounded-lg border ${colors.border} ${colors.bg} p-3 space-y-2`}
            >
              {/* Tier header */}
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold ${colors.header}`}>
                  {config.label} ({config.range})
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {sel.independentFamilies} fam.
                </span>
              </div>

              {/* Selected models */}
              <div className="space-y-0.5">
                {sel.models.length === 0 && (
                  <span className="text-[10px] text-slate-600 italic">Aucun modèle</span>
                )}
                {sel.models.map((m) => (
                  <div key={m.id} className="flex items-center gap-1.5 text-[10px]">
                    <span>{m.providerFlag}</span>
                    <span className="text-slate-200 flex-1 truncate">{m.name}</span>
                    <span className="text-slate-500 font-mono">{m.resolution_km}km</span>
                    <span className="text-slate-600 font-mono">{m.forecast_hours}h</span>
                  </div>
                ))}
              </div>

              {/* Region-filtered models */}
              {sel.regionFiltered.length > 0 && (
                <div className="pt-1 border-t border-slate-700/30">
                  <div className="text-[9px] text-slate-500 mb-0.5">
                    Filtrés (hors région) : {sel.regionFiltered.length}
                  </div>
                  {sel.regionFiltered.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-center gap-1.5 text-[10px] opacity-40 line-through">
                      <span>{m.providerFlag}</span>
                      <span className="text-slate-400 truncate">{m.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Capped models */}
              {sel.dropped.length > 0 && (
                <div className="pt-1 border-t border-slate-700/30">
                  <div className="text-[9px] text-slate-500 mb-0.5">
                    Cap 5 modèles : {sel.dropped.length} écarté{sel.dropped.length > 1 ? 's' : ''}
                  </div>
                  {sel.dropped.map((m) => (
                    <div key={m.id} className="flex items-center gap-1.5 text-[10px] opacity-40 italic">
                      <span>{m.providerFlag}</span>
                      <span className="text-slate-400 truncate">{m.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
