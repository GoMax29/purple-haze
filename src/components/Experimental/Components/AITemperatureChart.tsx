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
// Each AI model gets a visually distinct colour so lines don't blend together.
const AI_COLORS: Record<string, string> = {
  ecmwf_aifs025_single: '#3B82F6',        // blue   — ECMWF AIFS
  ncep_aigfs025: '#22D3EE',               // azure/cyan — NCEP AIGFS (GraphCast-based)
  ncep_hgefs025_ensemble_mean: '#34D399', // green  — NCEP HGEFS (hybrid ensemble)
};

// AI consensus rendered in bright emerald — clearly distinct from individual model lines
const AI_CONSENSUS_COLOR = '#10B981';
// NWP long-term reference rendered in solid purple
const NWP_REFERENCE_COLOR = '#A78BFA';

const AI_START_HOUR = 168; // J8 — models start diverging meaningfully

interface AITemperatureChartProps {
  /** AI model aggregated consensus (hours 0+, filtered to J7+ in this component) */
  aiAggregation: AggregatedPoint[];
  /** Individual AI fetch results for per-model lines */
  aiModelLines: FetchResult[];
  /** NWP long-term consensus for comparison (same hour range) */
  nwpReference?: AggregatedPoint[];
}

export default function AITemperatureChart({
  aiAggregation,
  aiModelLines,
  nwpReference,
}: AITemperatureChartProps) {
  const chartData = useMemo(() => {
    // Only show from AI_START_HOUR onwards
    const aiPoints = aiAggregation.filter((p) => p.hour >= AI_START_HOUR);
    if (aiPoints.length === 0) return [];

    const nwpMap = nwpReference
      ? new Map(nwpReference.filter((p) => p.hour >= AI_START_HOUR).map((p) => [p.hour, p]))
      : null;

    return aiPoints.map((p) => {
      const nwp = nwpMap?.get(p.hour);
      const row: Record<string, unknown> = {
        hour: p.hour,
        datetime: p.datetime,
        aiValue: p.value,
        aiMin: p.min,
        aiMax: p.max,
        nwpValue: nwp?.value ?? null,
      };

      for (const ml of aiModelLines) {
        const t = ml.temperatures[p.hour];
        if (t !== null && t !== undefined) {
          row[`ai_${ml.endpoint.id}`] = Math.round(t * 10) / 10;
        }
      }

      return row;
    });
  }, [aiAggregation, aiModelLines, nwpReference]);

  const aiModels = useMemo(() =>
    aiModelLines.map((ml) => ({
      key: `ai_${ml.endpoint.id}`,
      id: ml.endpoint.id,
      name: `${ml.endpoint.providerFlag} ${ml.endpoint.name}`,
      color: AI_COLORS[ml.endpoint.id] || '#34D399',
    })),
    [aiModelLines]
  );

  const lastHour = chartData.length > 0 ? (chartData[chartData.length - 1].hour as number) : 0;
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let h = AI_START_HOUR; h <= lastHour; h += 24) ticks.push(h);
    return ticks;
  }, [lastHour]);

  if (chartData.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">
          Modèles IA — J7 à J{Math.min(14, Math.ceil(lastHour / 24))}
          <span className="ml-2 text-[9px] font-normal text-slate-500">
            comparaison avec NWP long terme
          </span>
        </h3>
        <div className="flex items-center gap-2 text-[9px]">
          <span className="flex items-center gap-1" style={{ color: AI_CONSENSUS_COLOR }}>
            <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: AI_CONSENSUS_COLOR }} />
            Consensus IA
          </span>
          {nwpReference && (
            <span className="flex items-center gap-1" style={{ color: NWP_REFERENCE_COLOR }}>
              <span className="w-2.5 h-0.5 rounded" style={{ backgroundColor: NWP_REFERENCE_COLOR }} />
              NWP
            </span>
          )}
        </div>
      </div>

      <div className="h-48 sm:h-56 w-full rounded-lg bg-slate-800/40 border border-emerald-900/20 p-1.5 sm:p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -5, bottom: 5 }}>
            <defs>
              <linearGradient id="aiSpreadGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={AI_CONSENSUS_COLOR} stopOpacity={0.22} />
                <stop offset="50%" stopColor={AI_CONSENSUS_COLOR} stopOpacity={0.04} />
                <stop offset="100%" stopColor={AI_CONSENSUS_COLOR} stopOpacity={0.22} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="hour"
              type="number"
              scale="linear"
              domain={[AI_START_HOUR, lastHour > 0 ? lastHour : AI_START_HOUR + 168]}
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
              content={<AITooltip aiModels={aiModels} hasNwp={!!nwpReference} />}
              cursor={{ stroke: '#475569', strokeWidth: 1 }}
            />

            {/* J10 marker — where AI models become the only source */}
            {lastHour > 240 && (
              <ReferenceLine
                x={240}
                stroke="#475569"
                strokeDasharray="4 3"
                label={{ value: 'J11', position: 'insideTopRight', fill: '#475569', fontSize: 8 }}
              />
            )}

            {/* AI spread envelope */}
            <Area
              type="monotone"
              dataKey="aiMax"
              stroke="none"
              fill="url(#aiSpreadGrad)"
              fillOpacity={1}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="aiMin"
              stroke="none"
              fill="#0f172a"
              fillOpacity={0.92}
              isAnimationActive={false}
            />

            {/* Individual AI model lines */}
            {aiModels.map((m) => (
              <Line
                key={m.key}
                type="monotone"
                dataKey={m.key}
                stroke={m.color}
                strokeWidth={1}
                strokeOpacity={0.45}
                strokeDasharray="3 2"
                dot={false}
                isAnimationActive={false}
                connectNulls={false}
              />
            ))}

            {/* NWP long-term reference — solid purple, clearly visible */}
            {nwpReference && (
              <Line
                type="monotone"
                dataKey="nwpValue"
                stroke={NWP_REFERENCE_COLOR}
                strokeWidth={2}
                strokeOpacity={0.85}
                strokeDasharray="6 3"
                dot={false}
                isAnimationActive={false}
                connectNulls={true}
              />
            )}

            {/* AI consensus — prominent emerald */}
            <Line
              type="monotone"
              dataKey="aiValue"
              stroke={AI_CONSENSUS_COLOR}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 3, fill: AI_CONSENSUS_COLOR, stroke: '#064e3b', strokeWidth: 2 }}
              isAnimationActive={false}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Compact legend */}
      <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 px-1">
        <LegendItem color={AI_CONSENSUS_COLOR} label="Consensus IA" bold />
        {nwpReference && (
          <LegendItem color={NWP_REFERENCE_COLOR} label="Consensus NWP (réf.)" dashed />
        )}
        {aiModels.map((m) => {
          const isHgefs = m.id === 'ncep_hgefs025_ensemble_mean';
          return (
            <LegendItem
              key={m.key}
              color={m.color}
              label={isHgefs ? `${m.name} (J8–J10)` : m.name}
              dim
              dashed
            />
          );
        })}
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
  dashed,
}: {
  color: string;
  label: string;
  bold?: boolean;
  dim?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1 text-[8px] sm:text-[9px]">
      <span
        className="w-2.5 h-0.5 rounded inline-block"
        style={{ backgroundColor: color, opacity: dim ? 0.5 : 1 }}
      />
      {dashed && (
        <span className="text-[8px]" style={{ color, opacity: 0.5 }}>- -</span>
      )}
      <span className={bold ? 'text-slate-300 font-semibold' : 'text-slate-600'}>{label}</span>
    </span>
  );
}

function AITooltip({
  active,
  payload,
  aiModels,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; payload: Record<string, unknown> }>;
  aiModels: Array<{ key: string; name: string; color: string }>;
  hasNwp: boolean;
}) {
  if (!active || !payload?.length) return null;

  const raw = payload.filter(
    (p) => p.value != null && p.dataKey !== 'aiMax' && p.dataKey !== 'aiMin'
  );
  if (raw.length === 0) return null;

  const rawDatetime = payload[0]?.payload?.datetime as string | undefined;
  const displayDate = rawDatetime ? formatDatetime(rawDatetime) : '';

  const resolved = raw.map((item) => {
    let name = item.dataKey;
    let color = '#94a3b8';
    let isConsensus = false;
    let isNwp = false;
    if (item.dataKey === 'aiValue') {
      name = 'Consensus IA'; color = AI_CONSENSUS_COLOR; isConsensus = true;
    } else if (item.dataKey === 'nwpValue') {
      name = 'Consensus NWP'; color = NWP_REFERENCE_COLOR; isNwp = true;
    } else {
      const ai = aiModels?.find((m) => m.key === item.dataKey);
      if (ai) { name = ai.name; color = ai.color; }
    }
    return { ...item, name, color, isConsensus, isNwp };
  });

  // Sort individual AI model lines by temperature; consensus and NWP ref separate
  // NWP ref always last; all others sorted descending (highest temp on top)
  const nwpItem = resolved.find((r) => r.isNwp);
  const mainItems = resolved
    .filter((r) => !r.isNwp)
    .sort((a, b) => Number(b.value) - Number(a.value));
  const orderedItems = [...mainItems, ...(nwpItem ? [nwpItem] : [])];

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] max-w-[220px]">
      {displayDate && (
        <div className="text-slate-400 text-[9px] mb-1.5 font-mono">{displayDate}</div>
      )}
      {orderedItems.map((item, i) => {
        const prev = orderedItems[i - 1];
        const topSep = (item.isConsensus && i > 0 && !prev?.isConsensus) ||
                       (item.isNwp && i > 0);
        return (
          <div key={item.dataKey}>
            {topSep && <div className="border-t border-slate-700/50 my-0.5" />}
            <div className={`flex justify-between gap-3 py-0.5 ${item.isConsensus ? 'font-semibold' : ''}`}>
              <span style={{ color: item.color }} className="truncate">{item.name}</span>
              <span className="text-slate-200 font-mono whitespace-nowrap">
                {Number(item.value).toFixed(1)}°
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

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
