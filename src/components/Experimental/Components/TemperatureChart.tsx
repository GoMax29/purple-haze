'use client';

import { useMemo, useRef, useState, useCallback } from 'react';
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
import { ensureReadableColor, formatDatetime, modelMeshTier, isTierInPool } from './charts/chartUtils';

interface TemperatureChartProps {
  data: AggregatedPoint[];
  modelLines?: FetchResult[];
}

export default function TemperatureChart({ data, modelLines }: TemperatureChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [fixedPos, setFixedPos] = useState<{ x: number; y: number } | undefined>(undefined);

  const chartData = useMemo(() => {
    return data.map((p) => {
      const row: Record<string, unknown> = {
        hour: p.hour,
        datetime: p.datetime,
        value: p.value,
        min: p.min,
        max: p.max,
        modelCount: p.modelCount,
        pool: p.pool,
      };

      if (modelLines) {
        for (const ml of modelLines) {
          if (ml.activeRange && (p.hour < ml.activeRange.startH || p.hour >= ml.activeRange.endH)) continue;
          const tier = modelMeshTier(ml.model.resolution_km);
          if (!isTierInPool(tier, p.pool)) continue;
          const t = ml.series.temperature_2m?.[p.hour];
          if (t !== null && t !== undefined) {
            row[`m_${ml.model.id}`] = Math.round(t * 10) / 10;
          }
        }
      }

      return row;
    });
  }, [data, modelLines]);

  const nwpModels = useMemo(() => {
    if (!modelLines) return [];
    return modelLines.map((ml) => ({
      key: `m_${ml.model.id}`,
      id: ml.model.id,
      name: `${ml.model.providerFlag} ${ml.model.name}`,
      color: ml.model.color || '#94A3B8',
    }));
  }, [modelLines]);

  const lastHour = data.length > 0 ? data[data.length - 1].hour : 0;
  const firstHour = data.length > 0 ? data[0].hour : 0;

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    const start = Math.floor(firstHour / 24) * 24;
    for (let h = start; h <= lastHour; h += 24) ticks.push(h);
    return ticks;
  }, [firstHour, lastHour]);

  const yTicks = useMemo(() => {
    const allValues = data.flatMap((d) => [d.value, d.min, d.max]).filter((v) => v != null && !isNaN(v));
    if (allValues.length === 0) return [];
    const lo = Math.floor(Math.min(...allValues) / 5) * 5;
    const hi = Math.ceil(Math.max(...allValues) / 5) * 5;
    const ticks: number[] = [];
    for (let v = lo; v <= hi; v += 5) ticks.push(v);
    return ticks;
  }, [data]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    setFixedPos({
      x: x < rect.width / 2 ? rect.width - 60 : 10,
      y: 20,
    });
  }, []);
  const handleTouchEnd = useCallback(() => setFixedPos(undefined), []);

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-1">
        <span className="flex items-center gap-1 text-[9px] text-purple-300">
          <span className="w-2.5 h-0.5 rounded bg-purple-400" />
          Consensus NWP
        </span>
      </div>

      <div
        ref={chartRef}
        className="h-52 sm:h-64 w-full"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 4, left: -10, bottom: 5 }}>
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
              domain={[firstHour, lastHour > 0 ? lastHour : 168]}
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
              width={30}
              domain={yTicks.length >= 2 ? [yTicks[0], yTicks[yTicks.length - 1]] : ['auto', 'auto']}
              ticks={yTicks}
            />
            <Tooltip
              content={<CustomTooltip nwpModels={nwpModels} />}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
              position={fixedPos}
            />

            {lastHour > 48 && firstHour < 48 && (
              <ReferenceLine x={48} stroke="#334155" strokeDasharray="4 3" />
            )}
            {lastHour > 120 && firstHour < 120 && (
              <ReferenceLine x={120} stroke="#334155" strokeDasharray="4 3" />
            )}
            {lastHour > 168 && firstHour < 168 && (
              <ReferenceLine x={168} stroke="#475569" strokeDasharray="6 3" strokeWidth={1.5} />
            )}

            <Area type="monotone" dataKey="max" stroke="none" fill="url(#spreadGrad)" fillOpacity={1} isAnimationActive={false} />
            <Area type="monotone" dataKey="min" stroke="none" fill="#0f172a" fillOpacity={0.92} isAnimationActive={false} />

            {nwpModels.map((m) => (
              <Line key={m.key} type="monotone" dataKey={m.key} stroke={m.color} strokeWidth={1} strokeOpacity={0.35} dot={false} isAnimationActive={false} connectNulls={false} />
            ))}

            <Line type="monotone" dataKey="value" stroke="#a78bfa" strokeWidth={2.5} dot={false} activeDot={{ r: 3, fill: '#a78bfa', stroke: '#1e1b4b', strokeWidth: 2 }} isAnimationActive={false} connectNulls={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-1">
        <LegendItem color="#a78bfa" label="Consensus NWP" bold />
        {nwpModels.map((m) => (
          <LegendItem key={m.key} color={m.color} label={m.name} dim />
        ))}
      </div>
    </div>
  );
}

function LegendItem({ color, label, bold, dim }: { color: string; label: string; bold?: boolean; dim?: boolean }) {
  return (
    <span className="flex items-center gap-1 text-[8px] sm:text-[9px]">
      <span className="w-2.5 h-0.5 rounded inline-block" style={{ backgroundColor: color, opacity: dim ? 0.5 : 1 }} />
      <span className={bold ? 'text-slate-300 font-semibold' : 'text-slate-600'}>{label}</span>
    </span>
  );
}

function CustomTooltip({
  active, payload, nwpModels,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke?: string; color?: string; payload: Record<string, unknown> }>;
  nwpModels: Array<{ key: string; name: string; color: string }>;
}) {
  if (!active || !payload?.length) return null;
  const raw = payload.filter((p) => p.value != null && p.dataKey !== 'max' && p.dataKey !== 'min');
  if (raw.length === 0) return null;

  const rawDatetime = payload[0]?.payload?.datetime as string | undefined;
  const displayDate = rawDatetime ? formatDatetime(rawDatetime) : '';

  const resolved = raw.map((item) => {
    let name = item.dataKey;
    let color = item.stroke || item.color || '#94a3b8';
    let isConsensus = false;
    if (item.dataKey === 'value') {
      name = 'Consensus NWP'; color = '#a78bfa'; isConsensus = true;
    } else {
      const nwp = nwpModels?.find((m) => m.key === item.dataKey);
      if (nwp) { name = nwp.name; color = nwp.color; }
    }
    return { ...item, name, color: ensureReadableColor(color), isConsensus };
  });

  const orderedItems = [...resolved].sort((a, b) => Number(b.value) - Number(a.value));

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] max-w-[220px]">
      {displayDate && <div className="text-slate-400 text-[9px] mb-1.5 font-mono">{displayDate}</div>}
      {orderedItems.map((item, i) => {
        const prev = orderedItems[i - 1];
        const next = orderedItems[i + 1];
        const topSep = item.isConsensus && i > 0 && !prev?.isConsensus;
        const botSep = item.isConsensus && next != null;
        return (
          <div key={item.dataKey}>
            {topSep && <div className="border-t border-slate-700/50 my-0.5" />}
            <div className={`flex justify-between gap-3 py-0.5 ${item.isConsensus ? 'font-semibold' : ''}`}>
              <span style={{ color: item.color }} className="truncate">{item.name}</span>
              <span className="text-slate-200 font-mono whitespace-nowrap">{Number(item.value).toFixed(1)}°</span>
            </div>
            {botSep && <div className="border-t border-slate-700/50 my-0.5" />}
          </div>
        );
      })}
    </div>
  );
}
