import { Tier } from '../types';
import StatusBadge from './StatusBadge';

interface ModelRowProps {
  flag: string;
  name: string;
  family: string;
  resolution: string;
  hours: number;
  tier: Tier;
  inBounds: boolean;
  dimmed?: boolean;
}

const TIER_BADGE_STYLES = {
  short: 'bg-emerald-900/60 text-emerald-300',
  mid: 'bg-amber-900/60 text-amber-300',
  long: 'bg-red-900/60 text-red-300',
} as const;

const TIER_LABELS = { short: 'S', mid: 'M', long: 'L' } as const;

export default function ModelRow({
  flag,
  name,
  family,
  resolution,
  hours,
  tier,
  inBounds,
  dimmed,
}: ModelRowProps) {
  return (
    <div
      className={`flex items-center gap-2 py-1 px-2 rounded transition-colors hover:bg-slate-800/40 ${
        dimmed ? 'opacity-35 line-through' : ''
      }`}
    >
      <span className="text-sm shrink-0">{flag}</span>
      <span className="text-[11px] text-slate-200 flex-1 truncate">{name}</span>
      <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${TIER_BADGE_STYLES[tier]}`}>
        {TIER_LABELS[tier]}
      </span>
      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700 font-mono">
        {family}
      </span>
      <span className="text-[9px] text-slate-500 w-12 text-right">{resolution}</span>
      <span className="text-[9px] text-slate-600 w-10 text-right">{hours}h</span>
      <StatusBadge status={inBounds ? 'ok' : 'error'} />
    </div>
  );
}
