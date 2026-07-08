'use client';

import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { AggregatedPoint, FetchResult } from '../../types';
import { formatDatetime, directionArrow, directionLabel, ensureReadableColor, modelMeshTier, isTierInPool } from './chartUtils';

const SPEED_COLOR = '#22d3ee';
const GUST_COLOR = '#f59e0b';

interface ModelLineInfo {
  key: string;
  name: string;
  color: string;
}

interface WindChartProps {
  speed: AggregatedPoint[];
  gusts: AggregatedPoint[];
  direction: AggregatedPoint[];
  modelLines?: FetchResult[];
}

export default function WindChart({ speed, gusts, direction, modelLines }: WindChartProps) {
  const nwpModels = useMemo((): ModelLineInfo[] => {
    if (!modelLines) return [];
    return modelLines.map((ml) => ({
      key: `m_${ml.model.id}`,
      name: `${ml.model.providerFlag} ${ml.model.name}`,
      color: ml.model.color || '#94A3B8',
    }));
  }, [modelLines]);

  const chartData = useMemo(() => {
    const gustMap = new Map(gusts.map((p) => [p.hour, p]));
    const dirMap = new Map(direction.map((p) => [p.hour, p.value]));

    return speed.map((p) => {
      const row: Record<string, unknown> = {
        hour: p.hour,
        datetime: p.datetime,
        speed: p.value,
        speedMax: p.max,
        speedMin: p.min,
        gust: gustMap.get(p.hour)?.value ?? null,
        dir: dirMap.get(p.hour) ?? null,
      };

      if (modelLines) {
        const speedPool = speed.find((sp) => sp.hour === p.hour)?.pool;
        for (const ml of modelLines) {
          if (ml.activeRange && (p.hour < ml.activeRange.startH || p.hour >= ml.activeRange.endH)) continue;
          const tier = modelMeshTier(ml.model.resolution_km);
          if (!isTierInPool(tier, speedPool)) continue;
          const v = ml.series.wind_speed_10m?.[p.hour];
          if (v !== null && v !== undefined) {
            row[`m_${ml.model.id}`] = Math.round(v * 10) / 10;
          }
        }
      }

      return row;
    });
  }, [speed, gusts, direction, modelLines]);

  const lastHour = speed.length > 0 ? speed[speed.length - 1].hour : 0;
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
        <h3 className="text-xs font-semibold text-slate-300">Vent — vitesse &amp; rafales</h3>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="flex items-center gap-1" style={{ color: SPEED_COLOR }}>
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: SPEED_COLOR }} />
            Vitesse
          </span>
          <span className="flex items-center gap-1" style={{ color: GUST_COLOR }}>
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: GUST_COLOR }} />
            Rafales
          </span>
        </div>
      </div>

      <div className={`${hasModels ? 'h-52 sm:h-64' : 'h-44 sm:h-56'} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="windSpread" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SPEED_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={SPEED_COLOR} stopOpacity={0.03} />
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
              tickFormatter={(v) => `${v}`}
              width={30}
              domain={[0, 'auto']}
              label={{ value: 'km/h', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#64748b' }}
            />
            <Tooltip
              content={<WindTooltip nwpModels={nwpModels} hasModels={hasModels} />}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
            />

            {/* Speed envelope */}
            <Area type="monotone" dataKey="speedMax" stroke="none" fill="url(#windSpread)" isAnimationActive={false} />
            <Area type="monotone" dataKey="speedMin" stroke="none" fill="#0f172a" fillOpacity={0.92} isAnimationActive={false} />

            {/* Individual model speed lines */}
            {nwpModels.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={1}
                strokeOpacity={0.3}
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}

            <Line
              type="monotone"
              dataKey="gust"
              stroke={GUST_COLOR}
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              isAnimationActive={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="speed"
              stroke={SPEED_COLOR}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3, fill: SPEED_COLOR, stroke: '#0f172a', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {hasModels && (
        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-1">
          <LegendItem color={SPEED_COLOR} label="Vitesse consensus" bold />
          <LegendItem color={GUST_COLOR} label="Rafales" bold />
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

function WindTooltip({
  active,
  payload,
  nwpModels,
  hasModels,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; stroke?: string; color?: string; payload: Record<string, unknown> }>;
  nwpModels: ModelLineInfo[];
  hasModels: boolean;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as Record<string, unknown> | undefined;
  const dt = row?.datetime ? formatDatetime(row.datetime as string) : '';
  const dir = row?.dir as number | null | undefined;

  const headerParts: string[] = [];
  if (dt) headerParts.push(dt);
  if (dir != null) headerParts.push(`${directionArrow(dir)} ${directionLabel(dir)} (${dir}°)`);

  const speedItem = payload.find((p) => p.dataKey === 'speed');
  const gustItem = payload.find((p) => p.dataKey === 'gust');

  const modelItems = hasModels
    ? payload
        .filter((p) => p.value != null && p.dataKey.startsWith('m_'))
        .map((item) => {
          const nwp = nwpModels.find((m) => m.key === item.dataKey);
          return {
            dataKey: item.dataKey,
            value: Number(item.value),
            name: nwp?.name ?? item.dataKey,
            color: ensureReadableColor(nwp?.color ?? '#94a3b8'),
          };
        })
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] max-w-[240px]">
      {headerParts.length > 0 && (
        <div className="text-slate-400 text-[9px] mb-1.5 font-mono">{headerParts.join(' · ')}</div>
      )}

      {/* Consensus speed + gusts at top */}
      {speedItem != null && (
        <div className="flex justify-between gap-3 py-0.5 font-semibold">
          <span style={{ color: SPEED_COLOR }}>Vitesse</span>
          <span className="text-slate-200 font-mono whitespace-nowrap">{Number(speedItem.value).toFixed(0)} km/h</span>
        </div>
      )}
      {gustItem != null && gustItem.value != null && (
        <div className="flex justify-between gap-3 py-0.5 font-semibold">
          <span style={{ color: GUST_COLOR }}>Rafales</span>
          <span className="text-slate-200 font-mono whitespace-nowrap">{Number(gustItem.value).toFixed(0)} km/h</span>
        </div>
      )}

      {/* Individual model speeds */}
      {modelItems.length > 0 && (
        <>
          <div className="border-t border-slate-700/50 my-0.5" />
          {modelItems.map((item) => (
            <div key={item.dataKey} className="flex justify-between gap-3 py-0.5">
              <span style={{ color: item.color }} className="truncate">{item.name}</span>
              <span className="text-slate-200 font-mono whitespace-nowrap">{item.value.toFixed(0)} km/h</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
