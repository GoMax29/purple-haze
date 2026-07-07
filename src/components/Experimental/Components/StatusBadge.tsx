interface StatusBadgeProps {
  status: 'ok' | 'error' | 'warning' | 'info' | 'skipped';
  label?: string;
  size?: 'sm' | 'md';
}

const STATUS_STYLES = {
  ok: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  error: 'bg-red-500/15 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  info: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  skipped: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
} as const;

const STATUS_ICONS = {
  ok: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ',
  skipped: '—',
} as const;

export default function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded border font-mono ${sizeClasses} ${STATUS_STYLES[status]}`}>
      <span>{STATUS_ICONS[status]}</span>
      {label && <span>{label}</span>}
    </span>
  );
}
