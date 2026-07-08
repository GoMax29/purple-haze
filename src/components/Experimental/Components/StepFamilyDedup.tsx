import { DedupExclusion, CascadeGroup } from '../types';
import { FAMILY_LABELS } from '../data/models';
import StatusBadge from './StatusBadge';

interface StepDedupCascadeProps {
  exclusions: DedupExclusion[];
  cascades: CascadeGroup[];
}

/**
 * Step 4 display: targeted dedup exclusions + intra-provider cascades
 * ("seamless maison": within family+provider, the finest model runs first,
 * then the coarser one takes over when it expires).
 */
export default function StepDedupCascade({ exclusions, cascades }: StepDedupCascadeProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 4 — Dédup ciblée &amp; cascades
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {exclusions.length} exclu{exclusions.length > 1 ? 's' : ''} · {cascades.length} cascade{cascades.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Explicit exclusions */}
      {exclusions.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
            Exclusions
          </div>
          {exclusions.map((e) => (
            <div
              key={e.excluded.id}
              className="flex items-center gap-2 py-1.5 px-3 rounded bg-slate-800/30 border border-slate-700/30"
            >
              <StatusBadge status="warning" />
              <span className="text-[11px] text-slate-300 line-through">
                {e.excluded.providerFlag} {e.excluded.name}
              </span>
              <span className="text-[9px] text-slate-500 flex-1">{e.reason}</span>
              {e.fallbackFor && (
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                  fallback
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cascades */}
      {cascades.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
            Cascades intra-provider (1 slot chacune)
          </div>
          {cascades.map((c) => (
            <div
              key={`${c.provider}-${c.family}-${c.meshTier}`}
              className="py-1.5 px-3 rounded bg-slate-800/30 border border-slate-700/30 space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {FAMILY_LABELS[c.family] || c.family}
                </span>
                <span className="text-[9px] text-slate-500">{c.provider.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-300">
                {c.models.map((m, i) => {
                  const range = c.activeRanges[m.id];
                  const inactive = range && range.startH === range.endH;
                  return (
                    <span key={m.id} className="flex items-center gap-1">
                      {i > 0 && <span className="text-slate-600">→</span>}
                      <span className={inactive ? 'line-through opacity-40' : ''}>
                        {m.providerFlag} {m.name}
                        {range && !inactive && (
                          <span className="text-slate-500 font-mono ml-1">
                            H{range.startH}–{range.endH}
                          </span>
                        )}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {exclusions.length === 0 && cascades.length === 0 && (
        <span className="text-[10px] text-slate-600 italic">
          Aucune dédup ni cascade nécessaire pour ce point
        </span>
      )}
    </div>
  );
}
