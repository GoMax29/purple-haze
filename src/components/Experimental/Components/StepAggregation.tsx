import { AggregatedPoint, TrendPoint, FetchResult } from '../types';
import TemperatureChart from './TemperatureChart';
import TrendChart from './TrendChart';

interface StepAggregationProps {
  aggregation: AggregatedPoint[];
  trendClassic: TrendPoint[];
  trendAI: TrendPoint[];
  modelLines?: FetchResult[];
}

export default function StepAggregation({ aggregation, trendClassic, trendAI, modelLines }: StepAggregationProps) {
  const maxHourWithData = aggregation.length > 0
    ? aggregation[aggregation.length - 1].hour
    : 0;
  const maxDay = Math.ceil(maxHourWithData / 24);

  const zone1 = aggregation.filter((p) => p.hour < 168);
  const zone2 = aggregation.filter((p) => p.hour >= 168 && p.hour < 240)
    .filter((p) => p.hour % 8 === 0);
  const zone1And2 = [...zone1, ...zone2];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 7 — Agrégation température
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {aggregation.length} points · J1–J{maxDay}
        </span>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-2">
        <StatCard label="J1–J7" value={`${zone1.length} pts`} sub="Horaire" />
        <StatCard label="J7–J10" value={`${zone2.length} pts`} sub="3x/jour" />
        <StatCard label="Tendance NWP" value={`${trendClassic.length} pts`} sub="J10+" />
        <StatCard label="Tendance IA" value={`${trendAI.length} pts`} sub="J10+" />
      </div>

      {/* Temperature chart (J1–J10) with per-model lines */}
      {zone1And2.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] text-slate-400 font-semibold">
              Température agrégée + modèles individuels
            </div>
            <div className="text-[9px] text-slate-600">
              {modelLines?.length || 0} modèles NWP classiques
            </div>
          </div>
          <TemperatureChart data={zone1And2} modelLines={modelLines} />
        </div>
      )}

      {/* Trend chart (J10–J16) */}
      {trendClassic.length > 0 && (
        <div>
          <div className="text-[10px] text-slate-400 font-semibold mb-2">
            Bande de tendance — J10+
          </div>
          <TrendChart classicTrend={trendClassic} aiTrend={trendAI} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="flex flex-col items-center py-2 rounded border border-slate-700/30 bg-slate-800/30">
      <span className="text-[9px] text-slate-500 uppercase">{label}</span>
      <span className="text-sm font-bold text-slate-200">{value}</span>
      <span className="text-[8px] text-slate-600">{sub}</span>
    </div>
  );
}
