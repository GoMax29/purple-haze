'use client';

export interface DayCell {
  day: number;
  dayName: string;
  dayNum: number;
  /** Main figure (e.g. "12 mm", "85%", "45 km/h") */
  main: string;
  mainColor?: string;
  /** Secondary line (e.g. "min 40%", gust, wet share) */
  sub?: string;
  subColor?: string;
  dim?: boolean;
}

interface DailyVariableTableProps {
  title: string;
  cells: DayCell[];
  legend?: string;
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/** Builds the 14 day/date headers aligned with aggregation hours */
export function buildDayHeaders(): { day: number; dayName: string; dayNum: number }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Array.from({ length: 14 }, (_, d) => {
    const date = new Date(today.getTime() + d * 86400000);
    return { day: d + 1, dayName: DAY_NAMES[date.getDay()], dayNum: date.getDate() };
  });
}

/** Generic J1–J14 summary strip used by the non-temperature tabs */
export default function DailyVariableTable({ title, cells, legend }: DailyVariableTableProps) {
  if (cells.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">{title}</h3>
        <span className="text-[9px] text-slate-600">{cells.length} jours</span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex gap-[3px] min-w-min">
          {cells.map((c) => (
            <div
              key={c.day}
              className={`flex flex-col items-center min-w-[48px] px-1.5 py-2 rounded-lg border bg-slate-800/40 border-slate-700/30 ${
                c.dim ? 'opacity-70' : ''
              }`}
            >
              <span className="text-[9px] text-slate-500 font-medium">{c.dayName}</span>
              <span className="text-[10px] text-slate-400 font-mono">{c.dayNum}</span>
              <span
                className="text-[13px] font-bold mt-1.5 leading-none whitespace-nowrap"
                style={{ color: c.mainColor || '#e2e8f0' }}
              >
                {c.main}
              </span>
              {c.sub && (
                <span
                  className="text-[10px] mt-1 leading-none whitespace-nowrap"
                  style={{ color: c.subColor || '#64748b' }}
                >
                  {c.sub}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {legend && <div className="text-[9px] text-slate-600 px-1">{legend}</div>}
    </div>
  );
}
