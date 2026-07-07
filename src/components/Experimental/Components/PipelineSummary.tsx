import { FetchResult, FamilyGroup, TierSelection, OutlierResult } from '../types';

interface PipelineSummaryProps {
  fetchResults: FetchResult[];
  familyGroups: FamilyGroup[];
  tierSelections: TierSelection[];
  outlierResults: OutlierResult[];
}

export default function PipelineSummary({
  fetchResults,
  familyGroups,
  tierSelections,
  outlierResults,
}: PipelineSummaryProps) {
  const successCount = fetchResults.filter((f) => f.status === 'success').length;
  const rejectedCount = outlierResults.filter((o) => !o.kept).length;
  const tiers = tierSelections.map((t) => `${t.independentFamilies}`);

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-800/40 border border-slate-700/30">
      <Chip icon="📡" label={`${successCount}/${fetchResults.length}`} sub="endpoints" />
      <Sep />
      <Chip icon="🏠" label={`${familyGroups.length}`} sub="familles" />
      <Sep />
      <Chip icon="📊" label={tiers.join(' · ')} sub="CT·MT·LT" />
      <Sep />
      {rejectedCount === 0 ? (
        <Chip icon="✓" label="0 rejeté" color="text-emerald-400" />
      ) : (
        <Chip icon="⚠" label={`${rejectedCount} rejeté${rejectedCount > 1 ? 's' : ''}`} color="text-amber-400" />
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
