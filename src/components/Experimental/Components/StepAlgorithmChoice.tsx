import { TierSelection } from '../types';

interface StepAlgorithmChoiceProps {
  selections: TierSelection[];
}

const ALGO_STYLES: Record<string, string> = {
  winsorized_mean: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  weighted_mean: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  single_model: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  best_match: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

export default function StepAlgorithmChoice({ selections }: StepAlgorithmChoiceProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 5 — Algorithme d&apos;agrégation
        </h3>
      </div>

      <div className="flex flex-wrap gap-2">
        {selections.map((sel) => (
          <div
            key={sel.tier}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              ALGO_STYLES[sel.algorithm.name] || ALGO_STYLES.best_match
            }`}
          >
            <span className="text-sm">{sel.algorithm.icon}</span>
            <div>
              <div className="text-[11px] font-semibold">{sel.algorithm.description}</div>
              <div className="text-[9px] text-slate-500 capitalize">{sel.tier}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
