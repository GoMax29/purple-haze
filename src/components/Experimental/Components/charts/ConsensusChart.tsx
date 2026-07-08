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
} from 'recharts';
import { AggregatedPoint, FetchResult, HourlySeriesKey } from '../../types';
import { formatDatetime, ensureReadableColor } from './chartUtils';

interface ModelLineInfo {
  key: string;
  name: string;
  color: string;
}

interface ConsensusChartProps {
  data: AggregatedPoint[];
  title: string;
  unit: string;
  color: string;
  gradientId: string;
  yDomain?: [number | 'auto', number | 'auto'];
  modelLines?: FetchResult[];
  seriesKey?: HourlySeriesKey;
}

export default function ConsensusChart({
  data,
  title,
  unit,
  color,
  gradientId,
  yDomain = ['auto', 'auto'],
  modelLines,
  seriesKey,
}: ConsensusChartProps) {
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

      if (modelLines && seriesKey) {
        for (const ml of modelLines) {
          if (ml.activeRange && (p.hour < ml.activeRange.startH || p.hour >= ml.activeRange.endH)) continue;
          const v = ml.series[seriesKey]?.[p.hour];
          if (v !== null && v !== undefined) {
            row[`m_${ml.model.id}`] = Math.round(v * 10) / 10;
          }
        }
      }

      return row;
    });
  }, [data, modelLines, seriesKey]);

  const nwpModels = useMemo((): ModelLineInfo[] => {
    if (!modelLines) return [];
    return modelLines.map((ml) => ({
      key: `m_${ml.model.id}`,
      name: `${ml.model.providerFlag} ${ml.model.name}`,
      color: ml.model.color || '#94A3B8',
    }));
  }, [modelLines]);

  const lastHour = data.length > 0 ? data[data.length - 1].hour : 0;

  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= lastHour; h += 24) ticks.push(h);
    return ticks;
  }, [lastHour]);

  if (data.length === 0) return null;

  const hasModels = nwpModels.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">{title}</h3>
        <span className="flex items-center gap-1 text-[9px]" style={{ color }}>
          <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: color }} />
          Consensus
        </span>
      </div>

      <div className={`${hasModels ? 'h-56 sm:h-64' : 'h-48 sm:h-56'} w-full rounded-lg bg-slate-800/40 border border-slate-700/30 p-1.5 sm:p-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="50%" stopColor={color} stopOpacity={0.05} />
                <stop offset="100%" stopColor={color} stopOpacity={0.25} />
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
              tickFormatter={(v) => `${v}${unit}`}
              width={40}
              domain={yDomain}
            />
            {hasModels ? (
              <Tooltip
                content={<ConsensusTooltip nwpModels={nwpModels} unit={unit} consensusColor={color} />}
                cursor={{ stroke: '#475569', strokeWidth: 1 }}
              />
            ) : (
              <Tooltip
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '10px',
                }}
                itemStyle={{ color: '#e2e8f0' }}
                labelStyle={{ color: '#94a3b8' }}
                labelFormatter={(h: number, payload) => {
                  const dt = payload?.[0]?.payload?.datetime as string | undefined;
                  return dt ? formatDatetime(dt) : `H+${h}`;
                }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    value: 'Consensus',
                    max: 'Max modèles',
                    min: 'Min modèles',
                  };
                  return [`${Number(value).toFixed(0)}${unit}`, labels[name] || name];
                }}
              />
            )}

            {/* Envelope */}
            <Area type="monotone" dataKey="max" stroke="none" fill={`url(#${gradientId})`} fillOpacity={1} isAnimationActive={false} />
            <Area type="monotone" dataKey="min" stroke="none" fill="#0f172a" fillOpacity={0.92} isAnimationActive={false} />

            {/* Individual model lines */}
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

            {/* Consensus */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3, fill: color, stroke: '#0f172a', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {hasModels && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-1">
          <LegendItem color={color} label="Consensus" bold />
          {nwpModels.map((m) => (
            <LegendItem key={m.key} color={m.color} label={m.name} dim />
          ))}
        </div>
      )}
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

function ConsensusTooltip({
  active,
  payload,
  nwpModels,
  unit,
  consensusColor,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke?: string; color?: string; payload: Record<string, unknown> }>;
  nwpModels: ModelLineInfo[];
  unit: string;
  consensusColor: string;
}) {
  if (!active || !payload?.length) return null;

  const raw = payload.filter(
    (p) => p.value != null && p.dataKey !== 'max' && p.dataKey !== 'min'
  );
  if (raw.length === 0) return null;

  const rawDatetime = payload[0]?.payload?.datetime as string | undefined;
  const displayDate = rawDatetime ? formatDatetime(rawDatetime) : '';

  const resolved = raw.map((item) => {
    let name = item.dataKey;
    let itemColor = item.stroke || item.color || '#94a3b8';
    let isConsensus = false;
    if (item.dataKey === 'value') {
      name = 'Consensus';
      itemColor = consensusColor;
      isConsensus = true;
    } else {
      const nwp = nwpModels.find((m) => m.key === item.dataKey);
      if (nwp) { name = nwp.name; itemColor = nwp.color; }
    }
    return { ...item, name, color: ensureReadableColor(itemColor), isConsensus };
  });

  const ordered = [...resolved].sort((a, b) => Number(b.value) - Number(a.value));

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] max-w-[220px]">
      {displayDate && (
        <div className="text-slate-400 text-[9px] mb-1.5 font-mono">{displayDate}</div>
      )}
      {ordered.map((item, i) => {
        const prev = ordered[i - 1];
        const next = ordered[i + 1];
        const topSep = item.isConsensus && i > 0 && !prev?.isConsensus;
        const botSep = item.isConsensus && next != null;
        return (
          <div key={item.dataKey}>
            {topSep && <div className="border-t border-slate-700/50 my-0.5" />}
            <div className={`flex justify-between gap-3 py-0.5 ${item.isConsensus ? 'font-semibold' : ''}`}>
              <span style={{ color: item.color }} className="truncate">{item.name}</span>
              <span className="text-slate-200 font-mono whitespace-nowrap">
                {Number(item.value).toFixed(0)}{unit}
              </span>
            </div>
            {botSep && <div className="border-t border-slate-700/50 my-0.5" />}
          </div>
        );
      })}
    </div>
  );
}
