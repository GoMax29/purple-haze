import { TierSelection } from '../types';
import { describeAlgorithm } from '../Algorithms/AlgorithmPicker';
import { MESH_TIER_CONFIG } from '../data/families';

interface StepAlgorithmChoiceProps {
  selections: TierSelection[];
}

const ALGO_STYLES: Record<string, string> = {
  winsorized_mean: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  gaussian_mean: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  single_model: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
};

/**
 * Informational display: which aggregation method applies at each tier's
 * typical pool size. The real choice is made per-hour by Aggregation.ts
 * (winsorized N>=4, robust gaussian N=2-3, raw N=1).
 */
export default function StepAlgorithmChoice({ selections }: StepAlgorithmChoiceProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 6 — Algorithme d&apos;agrégation
        </h3>
        <span className="text-[9px] text-slate-600">
          Winsorisée (N≥4) · Gaussienne robuste (N=2-3) · Brut (N=1)
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {selections.map((sel) => {
          const algo = describeAlgorithm(sel.models.length);
          return (
            <div
              key={sel.meshTier}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                ALGO_STYLES[algo.name] || ALGO_STYLES.single_model
              }`}
            >
              <span className="text-sm">{algo.icon}</span>
              <div>
                <div className="text-[11px] font-semibold">{algo.description}</div>
                <div className="text-[9px] text-slate-500">{MESH_TIER_CONFIG[sel.meshTier].label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
