import { FetchResult, TierSelection } from '../types';

interface PipelineSummaryProps {
  fetchResults: FetchResult[];
  tierSelections: TierSelection[];
  cascadeCount: number;
}

export default function PipelineSummary({
  fetchResults,
  tierSelections,
  cascadeCount,
}: PipelineSummaryProps) {
  const successCount = fetchResults.filter((f) => f.status === 'success').length;
  const failedCount = fetchResults.length - successCount;
  const tierCounts = tierSelections.map((t) => `${t.models.length}`);

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
      <Chip icon="📡" label={`${successCount}/${fetchResults.length}`} sub="modèles" />
      <Sep />
      <Chip icon="🕸" label={tierCounts.join(' · ')} sub="F·M·L" />
      <Sep />
      <Chip icon="🔗" label={`${cascadeCount}`} sub="cascades" />
      <Sep />
      {failedCount === 0 ? (
        <Chip icon="✓" label="0 échec" color="text-emerald-400" />
      ) : (
        <Chip icon="⚠" label={`${failedCount} échec${failedCount > 1 ? 's' : ''}`} color="text-amber-400" />
      )}
    </div>
  );
}

function Chip({ icon, label, sub, color }: { icon: string; label: string; sub?: string; color?: string }) {
  return (
    <span className={`flex items-center gap-1 text-[11px] ${color || 'text-slate-300'}`}>
      <span className="text-xs">{icon}</span>
      <span className="font-semibold">{label}</span>
      {sub && <span className="text-slate-600 text-[9px]">{sub}</span>}
    </span>
  );
}

function Sep() {
  return <span className="text-slate-700 text-[10px]">·</span>;
}
