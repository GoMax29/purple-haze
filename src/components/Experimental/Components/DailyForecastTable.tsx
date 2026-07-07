'use client';

import { useMemo, useState } from 'react';
import { AggregatedPoint } from '../types';

interface DailySummary {
  day: number;          // 1-based (1 = today)
  dayName: string;
  dayNum: number;
  month: string;
  min: number;
  max: number;
  modelCount: number;
  isLowConfidence: boolean;
  aiMin?: number;
  aiMax?: number;
}

interface DailyForecastTableProps {
  aggregation: AggregatedPoint[];
  aiAggregation?: AggregatedPoint[];
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_NAMES = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];

function tempColor(temp: number): string {
  if (temp <= 5) return '#93C5FD';
  if (temp <= 10) return '#67E8F9';
  if (temp <= 15) return '#6EE7B7';
  if (temp <= 20) return '#FDE68A';
  if (temp <= 25) return '#FDBA74';
  if (temp <= 30) return '#FCA5A5';
  return '#F87171';
}

export default function DailyForecastTable({ aggregation, aiAggregation }: DailyForecastTableProps) {
  const [showAI, setShowAI] = useState(false);

  const dailySummaries = useMemo((): DailySummary[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const summaries: DailySummary[] = [];

    for (let d = 0; d < 14; d++) {
      const dayStart = d * 24;
      const dayEnd = (d + 1) * 24;

      let dayPoints = aggregation.filter((p) => p.hour >= dayStart && p.hour < dayEnd);

      // For J8+, fill from AI if NWP aggregation has no data
      if (dayPoints.length === 0 && aiAggregation) {
        dayPoints = aiAggregation.filter((p) => p.hour >= dayStart && p.hour < dayEnd);
      }

      if (dayPoints.length === 0) continue;

      const date = new Date(today.getTime() + d * 86400000);
      const avgModelCount = dayPoints.reduce((s, p) => s + p.modelCount, 0) / dayPoints.length;

      // AI predictions for J7+ (days 7..13, d=7..13)
      let aiMin: number | undefined;
      let aiMax: number | undefined;
      if (d >= 7 && aiAggregation) {
        const aiDay = aiAggregation.filter((p) => p.hour >= dayStart && p.hour < dayEnd);
        if (aiDay.length > 0) {
          aiMin = Math.round(Math.min(...aiDay.map((p) => p.value)) * 10) / 10;
          aiMax = Math.round(Math.max(...aiDay.map((p) => p.value)) * 10) / 10;
        }
      }

      summaries.push({
        day: d + 1,
        dayName: DAY_NAMES[date.getDay()],
        dayNum: date.getDate(),
        month: MONTH_NAMES[date.getMonth()],
        min: Math.round(Math.min(...dayPoints.map((p) => p.value)) * 10) / 10,
        max: Math.round(Math.max(...dayPoints.map((p) => p.value)) * 10) / 10,
        modelCount: Math.round(avgModelCount),
        isLowConfidence: avgModelCount < 3,
        aiMin,
        aiMax,
      });
    }

    return summaries;
  }, [aggregation, aiAggregation]);

  // Are there any AI predictions available from J7+?
  const hasAI = dailySummaries.some((d) => d.day >= 8 && d.aiMin !== undefined);

  if (dailySummaries.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">
          Prévisions 14 jours
        </h3>
        <div className="flex items-center gap-2">
          {hasAI && (
            <button
              onClick={() => setShowAI((v) => !v)}
              className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${
                showAI
                  ? 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800/30 border-slate-700/40 text-slate-500 hover:text-emerald-400 hover:border-emerald-500/30'
              }`}
            >
              {showAI ? '▲ Masquer IA' : '▼ IA J8-J14'}
            </button>
          )}
          <span className="text-[9px] text-slate-600">
            {dailySummaries.length} jours
          </span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex gap-[3px] min-w-min">
          {dailySummaries.map((day) => (
            <div
              key={day.day}
              className={`flex flex-col items-center min-w-[46px] px-1.5 py-2 rounded-lg border transition-opacity ${
                day.isLowConfidence
                  ? 'bg-slate-800/20 border-slate-700/20 opacity-70'
                  : 'bg-slate-800/40 border-slate-700/30'
              } ${day.day >= 8 ? 'border-b-2 border-b-slate-700/20' : ''}`}
            >
              <span className="text-[9px] text-slate-500 font-medium">{day.dayName}</span>
              <span className="text-[10px] text-slate-400 font-mono">{day.dayNum}</span>

              {/* Classic NWP max */}
              <span
                className="text-sm font-bold mt-1.5 leading-none"
                style={{ color: tempColor(day.max) }}
              >
                {Math.round(day.max)}°
              </span>

              {/* Classic NWP min */}
              <span
                className="text-[11px] mt-0.5 leading-none"
                style={{ color: tempColor(day.min), opacity: 0.7 }}
              >
                {Math.round(day.min)}°
              </span>

              {/* AI predictions for J8+ (toggleable) */}
              {showAI && day.day >= 8 && day.aiMax !== undefined && day.aiMin !== undefined && (
                <div className="mt-1.5 pt-1 border-t border-emerald-900/30 w-full flex flex-col items-center">
                  <span className="text-[7px] text-emerald-500/70 font-mono mb-0.5">IA</span>
                  <span
                    className="text-[11px] font-semibold leading-none"
                    style={{ color: tempColor(day.aiMax), opacity: 0.85 }}
                  >
                    {Math.round(day.aiMax)}°
                  </span>
                  <span
                    className="text-[10px] leading-none mt-0.5"
                    style={{ color: tempColor(day.aiMin), opacity: 0.6 }}
                  >
                    {Math.round(day.aiMin)}°
                  </span>
                </div>
              )}

              {day.isLowConfidence && (
                <span className="text-[7px] text-slate-600 mt-1">~</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[9px] text-slate-600 px-1">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-700/50" />
          Confiance réduite (&lt; 3 modèles)
        </span>
        {showAI && hasAI && (
          <span className="flex items-center gap-1 text-emerald-600">
            <span className="w-2 h-2 rounded-full bg-emerald-900/60" />
            IA = AIFS + AIGFS + HGEFS (J8+)
          </span>
        )}
      </div>
    </div>
  );
}
