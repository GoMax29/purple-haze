'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { AggregatedPoint, FetchResult } from '../../types';
import { formatDatetime, ensureReadableColor, modelMeshTier, isTierInPool } from './chartUtils';

interface ModelLineInfo {
  key: string;
  name: string;
  color: string;
}

interface PrecipitationChartProps {
  data: AggregatedPoint[];
  modelLines?: FetchResult[];
}

export default function PrecipitationChart({ data, modelLines }: PrecipitationChartProps) {
  const nwpModels = useMemo((): ModelLineInfo[] => {
    if (!modelLines) return [];
    return modelLines.map((ml) => ({
      key: `m_${ml.model.id}`,
      name: `${ml.model.providerFlag} ${ml.model.name}`,
      color: ml.model.color || '#94A3B8',
    }));
  }, [modelLines]);

  const chartData = useMemo(
    () =>
      data.map((p) => {
        const row: Record<string, unknown> = {
          ...p,
          wetPct: p.wetFraction !== undefined ? Math.round(p.wetFraction * 100) : null,
        };

        if (modelLines) {
          for (const ml of modelLines) {
            if (ml.activeRange && (p.hour < ml.activeRange.startH || p.hour >= ml.activeRange.endH)) continue;
            const tier = modelMeshTier(ml.model.resolution_km);
            if (!isTierInPool(tier, p.pool)) continue;
            const v = ml.series.precipitation?.[p.hour];
            if (v !== null && v !== undefined) {
              row[`m_${ml.model.id}`] = Math.round(v * 10) / 10;
            }
          }
        }

        return row;
      }),
    [data, modelLines]
  );

  const lastHour = data.length > 0 ? data[data.length - 1].hour : 0;
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = 0; h <= lastHour; h += 24) ticks.push(h);
    return ticks;
  }, [lastHour]);

  if (chartData.length === 0) return null;

  const hasModels = nwpModels.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">
          Précipitations — médiane multi-modèles
        </h3>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="flex items-center gap-1 text-sky-300">
            <span className="w-2.5 h-2 rounded-sm bg-sky-400/70" />
            mm/h
          </span>
          <span className="flex items-center gap-1 text-emerald-300">
            <span className="w-2.5 h-0.5 rounded bg-emerald-400" />
            % modèles en pluie
          </span>
        </div>
      </div>

      <div className={`${hasModels ? 'h-52 sm:h-64' : 'h-44 sm:h-56'} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 2, left: -5, bottom: 5 }}>
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
              yAxisId="mm"
              tick={{ fontSize: 9, fill: '#94a3b8' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}`}
              width={30}
              domain={[0, 'auto']}
              label={{ value: 'mm', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#64748b' }}
            />
            <YAxis
              yAxisId="pct"
              orientation="right"
              tick={{ fontSize: 9, fill: '#34d399' }}
              axisLine={{ stroke: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(v) => `${v}%`}
              width={35}
              domain={[0, 100]}
            />
            {hasModels ? (
              <Tooltip
                content={<PrecipTooltip nwpModels={nwpModels} />}
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
                  if (name === 'value') return [`${Number(value).toFixed(1)} mm`, 'Médiane'];
                  if (name === 'max') return [`${Number(value).toFixed(1)} mm`, 'Max modèles'];
                  if (name === 'wetPct') return [`${value}%`, 'Modèles en pluie'];
                  return [value, name];
                }}
              />
            )}

            {/* Max envelope as thin bars behind */}
            <Bar yAxisId="mm" dataKey="max" fill="#0ea5e9" fillOpacity={0.15} isAnimationActive={false} />
            {/* Median consensus */}
            <Bar yAxisId="mm" dataKey="value" fill="#38bdf8" fillOpacity={0.75} isAnimationActive={false} />

            {/* Individual model precip lines */}
            {nwpModels.map((m) => (
              <Line
                key={m.key}
                yAxisId="mm"
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={0.8}
                strokeOpacity={0.3}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}

            {/* Wet-model share */}
            <Line
              yAxisId="pct"
              type="monotone"
              dataKey="wetPct"
              stroke="#34d399"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {hasModels && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-1">
          <LegendItem color="#38bdf8" label="Médiane" bold />
          <LegendItem color="#34d399" label="% pluie" bold />
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

function PrecipTooltip({
  active,
  payload,
  nwpModels,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke?: string; color?: string; payload: Record<string, unknown> }>;
  nwpModels: ModelLineInfo[];
}) {
  if (!active || !payload?.length) return null;

  const raw = payload.filter(
    (p) => p.value != null && p.dataKey !== 'max'
  );
  if (raw.length === 0) return null;

  const rawDatetime = payload[0]?.payload?.datetime as string | undefined;
  const displayDate = rawDatetime ? formatDatetime(rawDatetime) : '';
  const wetPctItem = raw.find((p) => p.dataKey === 'wetPct');

  const modelItems = raw
    .filter((p) => p.dataKey !== 'wetPct' && p.dataKey !== 'value')
    .map((item) => {
      const nwp = nwpModels.find((m) => m.key === item.dataKey);
      return {
        dataKey: item.dataKey,
        value: Number(item.value),
        name: nwp?.name ?? item.dataKey,
        color: ensureReadableColor(nwp?.color ?? '#94a3b8'),
        isConsensus: false,
      };
    });

  const consensusItem = raw.find((p) => p.dataKey === 'value');

  const allItems = [
    ...(consensusItem
      ? [{ dataKey: 'value', value: Number(consensusItem.value), name: 'Médiane', color: '#38bdf8', isConsensus: true }]
      : []),
    ...modelItems,
  ].sort((a, b) => b.value - a.value);

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] max-w-[220px]">
      {displayDate && (
        <div className="text-slate-400 text-[9px] mb-1.5 font-mono">{displayDate}</div>
      )}
      {allItems.map((item, i) => {
        const prev = allItems[i - 1];
        const next = allItems[i + 1];
        const topSep = item.isConsensus && i > 0 && !prev?.isConsensus;
        const botSep = item.isConsensus && next != null;
        return (
          <div key={item.dataKey}>
            {topSep && <div className="border-t border-slate-700/50 my-0.5" />}
            <div className={`flex justify-between gap-3 py-0.5 ${item.isConsensus ? 'font-semibold' : ''}`}>
              <span style={{ color: item.color }} className="truncate">{item.name}</span>
              <span className="text-slate-200 font-mono whitespace-nowrap">
                {item.value.toFixed(1)} mm
              </span>
            </div>
            {botSep && <div className="border-t border-slate-700/50 my-0.5" />}
          </div>
        );
      })}
      {wetPctItem != null && (
        <>
          <div className="border-t border-slate-700/50 my-0.5" />
          <div className="flex justify-between gap-3 py-0.5">
            <span className="text-emerald-400">Modèles en pluie</span>
            <span className="text-slate-200 font-mono whitespace-nowrap">{Number(wetPctItem.value)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
