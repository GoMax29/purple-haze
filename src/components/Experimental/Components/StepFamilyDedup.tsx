import { FamilyGroup } from '../types';
import StatusBadge from './StatusBadge';

interface StepFamilyDedupProps {
  groups: FamilyGroup[];
}

export default function StepFamilyDedup({ groups }: StepFamilyDedupProps) {
  const totalKept = groups.length;
  const totalRemoved = groups.reduce((s, g) => s + g.removed.length, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 3 — Déduplication par famille
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {totalKept} familles · {totalRemoved} supprimés
        </span>
      </div>

      <div className="space-y-1">
        {groups.map((g) => (
          <div
            key={g.family}
            className="flex items-center gap-2 py-1.5 px-3 rounded bg-slate-800/30 border border-slate-700/30"
          >
            {/* Family label */}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 w-20 text-center truncate">
              {g.familyLabel}
            </span>

            {/* Kept model */}
            <StatusBadge status="ok" />
            <span className="text-[11px] text-slate-200 flex-1">
              {g.kept.endpoint.providerFlag} {g.kept.endpoint.name}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              {g.kept.endpoint.resolution_km} km
            </span>

            {/* Removed count */}
            {g.removed.length > 0 && (
              <span className="text-[9px] text-slate-600 ml-2">
                <StatusBadge status="error" label={`-${g.removed.length}`} />
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Detail of removed models */}
      {totalRemoved > 0 && (
        <details className="text-[10px] text-slate-500">
          <summary className="cursor-pointer hover:text-slate-300 transition-colors">
            Modèles supprimés ({totalRemoved})
          </summary>
          <div className="mt-1 pl-3 space-y-0.5 border-l border-slate-700">
            {groups
              .filter((g) => g.removed.length > 0)
              .map((g) =>
                g.removed.map((r) => (
                  <div key={r.endpoint.id} className="flex items-center gap-2 opacity-50">
                    <span className="w-16 text-slate-600">{g.familyLabel}</span>
                    <span className="line-through">
                      {r.endpoint.providerFlag} {r.endpoint.name}
                    </span>
                    <span className="text-slate-600">{r.endpoint.resolution_km} km</span>
                  </div>
                ))
              )}
          </div>
        </details>
      )}
    </div>
  );
}
