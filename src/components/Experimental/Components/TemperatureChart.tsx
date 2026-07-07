'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { AggregatedPoint, FetchResult } from '../types';

// ─── colours ───────────────────────────────────────────────
const MODEL_COLORS: Record<string, string> = {
  dwd_icon_seamless: '#60A5FA',
  ncep_gfs_seamless: '#34D399',
  gem_seamless: '#F472B6',
  meteofrance_seamless: '#FB923C',
  ukmo_seamless: '#FBBF24',
  jma_seamless: '#A78BFA',
  kma_seamless: '#C084FC',
  ecmwf_ifs: '#818CF8',
  ecmwf_ifs025: '#6366F1',
  cma_grapes_global: '#4ADE80',
  bom_access_global: '#F59E0B',
};

interface TemperatureChartProps {
  data: AggregatedPoint[];
  modelLines?: FetchResult[];
}

export default function TemperatureChart({ data, modelLines }: TemperatureChartProps) {
  const chartData = useMemo(() => {
    return data.map((p) => {
      const row: Record<string, unknown> = {
        hour: p.hour,
        datetime: p.datetime,
        value: p.value,
        min: p.min,
        max: p.max,
        modelCount: p.modelCount,
      };

      if (modelLines) {
        for (const ml of modelLines) {
          const t = ml.temperatures[p.hour];
          if (t !== null && t !== undefined) {
            row[`m_${ml.endpoint.id}`] = Math.round(t * 10) / 10;
          }
        }
      }

      return row;
    });
  }, [data, modelLines]);

  const nwpModels = useMemo(() => {
    if (!modelLines) return [];
    return modelLines.map((ml) => ({
      key: `m_${ml.endpoint.id}`,
      id: ml.endpoint.id,
      name: `${ml.endpoint.providerFlag} ${ml.endpoint.name}`,
      color: MODEL_COLORS[ml.endpoint.id] || '#94A3B8',
    }));
  }, [modelLines]);

  const lastHour = data.length > 0 ? data[data.length - 1].hour : 0;

  // Tick positions: every 24h up to lastHour
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= lastHour; h += 24) ticks.push(h);
    return ticks;
  }, [lastHour]);

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">
          Courbe de température — J1 à J{Math.min(14, Math.ceil(lastHour / 24))}
        </h3>
        <span className="flex items-center gap-1 text-[9px] text-purple-300">
          <span className="w-2.5 h-0.5 rounded bg-purple-400" />
          Consensus NWP
        </span>
      </div>

      <div className="h-56 sm:h-64 w-full rounded-lg bg-slate-800/40 border border-slate-700/30 p-1.5 sm:p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.3} />
                <stop offset="40%" stopColor="#a78bfa" stopOpacity={0.06} />
                <stop offset="60%" stopColor="#a78bfa" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.3} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="hour"
              type="number"
              scale="linear"
              domain={[0, lastHour > 0 ? lastHour : 168]}
              ticks={xTicks}
              tickFormatter={(h: number) => `J${Math.floor(h / 24) + 1}`}
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}°`}
              width={32}
              domain={['auto', 'auto']}
            />
            <Tooltip
              content={<CustomTooltip nwpModels={nwpModels} />}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
            />

            {/* Tier boundaries */}
            {lastHour > 48 && (
              <ReferenceLine x={48} stroke="#334155" strokeDasharray="4 3" />
            )}
            {lastHour > 120 && (
              <ReferenceLine x={120} stroke="#334155" strokeDasharray="4 3" />
            )}
            {/* J7/J8 boundary — where AI models take over */}
            {lastHour > 168 && (
              <ReferenceLine
                x={168}
                stroke="#475569"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: 'J8', position: 'insideTopRight', fill: '#475569', fontSize: 8 }}
              />
            )}

            {/* NWP spread envelope */}
            <Area
              type="monotone"
              dataKey="max"
              stroke="none"
              fill="url(#spreadGrad)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="min"
              stroke="none"
              fill="#0f172a"
              fillOpacity={0.92}
              isAnimationActive={false}
            />

            {/* Individual NWP model lines (clipped to tier start via null values) */}
            {nwpModels.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={1}
                strokeOpacity={0.35}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}

            {/* NWP consensus — prominent */}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#a78bfa"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3, fill: '#a78bfa', stroke: '#1e1b4b', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Compact legend */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-1">
        <LegendItem color="#a78bfa" label="Consensus NWP" bold />
        {nwpModels.map((m) => (
          <LegendItem key={m.key} color={m.color} label={m.name} dim />
        ))}
      </div>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────

function LegendItem({
  color,
  label,
  bold,
  dim,
}: {
  color: string;
  label: string;
  bold?: boolean;
  dim?: boolean;
}) {
  return (
    <span className="flex items-center gap-1 text-[8px] sm:text-[9px]">
      <span
        className="w-2.5 h-0.5 rounded inline-block"
        style={{ backgroundColor: color, opacity: dim ? 0.5 : 1 }}
      />
      <span className={bold ? 'text-slate-300 font-semibold' : 'text-slate-600'}>{label}</span>
    </span>
  );
}

function CustomTooltip({
  active,
  payload,
  nwpModels,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke?: string; color?: string; payload: Record<string, unknown> }>;
  nwpModels: Array<{ key: string; name: string; color: string }>;
}) {
  if (!active || !payload?.length) return null;

  const raw = payload.filter(
    (p) => p.value != null && p.dataKey !== 'max' && p.dataKey !== 'min'
  );
  if (raw.length === 0) return null;

  const rawDatetime = payload[0]?.payload?.datetime as string | undefined;
  const displayDate = rawDatetime ? formatDatetime(rawDatetime) : '';

  // Resolve name + color for each item
  const resolved = raw.map((item) => {
    let name = item.dataKey;
    let color = item.stroke || item.color || '#94a3b8';
    let isConsensus = false;
    if (item.dataKey === 'value') {
      name = 'Consensus NWP';
      color = '#a78bfa';
      isConsensus = true;
    } else {
      const nwp = nwpModels?.find((m) => m.key === item.dataKey);
      if (nwp) { name = nwp.name; color = nwp.color; }
    }
    return { ...item, name, color, isConsensus };
  });

  // Sort models by temperature value (ascending); keep consensus out for now
  const modelItems = resolved.filter((r) => !r.isConsensus)
    .sort((a, b) => Number(a.value) - Number(b.value));
  const consensusItem = resolved.find((r) => r.isConsensus);

  // Insert consensus at the middle of the sorted model list
  const mid = Math.floor(modelItems.length / 2);
  const orderedItems = consensusItem
    ? [...modelItems.slice(0, mid), consensusItem, ...modelItems.slice(mid)]
    : modelItems;

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] max-w-[220px]">
      {displayDate && (
        <div className="text-slate-400 text-[9px] mb-1.5 font-mono">{displayDate}</div>
      )}
      {orderedItems.map((item, i) => {
        const isConsensus = item.isConsensus;
        // Add separator before and after consensus
        const needsTopSep = isConsensus && i > 0;
        const needsBotSep = isConsensus && i < orderedItems.length - 1;
        return (
          <div key={item.dataKey}>
            {needsTopSep && <div className="border-t border-slate-700/50 my-0.5" />}
            <div className={`flex justify-between gap-3 py-0.5 ${isConsensus ? 'font-semibold' : ''}`}>
              <span style={{ color: item.color }} className="truncate">{item.name}</span>
              <span className="text-slate-200 font-mono whitespace-nowrap">
                {Number(item.value).toFixed(1)}°
              </span>
            </div>
            {needsBotSep && <div className="border-t border-slate-700/50 my-0.5" />}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Formats an Open-Meteo ISO datetime string (local time, no offset)
 * into a human-readable French label.
 * Input:  "2026-07-07T14:00"
 * Output: "Lun 7 juil. 14h00"
 */
function formatDatetime(iso: string): string {
  const [datePart, timePart] = iso.split('T');
  if (!datePart) return iso;
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const MONTH_SHORT = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_SHORT[month - 1];
  const time = timePart ? timePart.replace(':', 'h') : '';
  return `${dayName} ${day} ${monthName}${time ? ' ' + time : ''}`;
}
