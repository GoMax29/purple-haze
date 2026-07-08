'use client';

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { AggregatedPoint, FetchResult } from '../../types';
import { WMO_GROUPS, wmoGroupOf } from '../../Algorithms/VariableAggregators';
import { getWMOIcon } from '@/utils/wmoIcons';
import { ensureReadableColor } from './chartUtils';

interface DaySummary {
  day: number;
  dayName: string;
  dayNum: number;
  code: number;
  groupLabel: string;
  icon: string;
  hoursInGroup: number;
  modelCount: number;
  modelBreakdown: ModelWmoVote[];
}

interface ModelWmoVote {
  name: string;
  color: string;
  groupLabel: string;
  code: number;
}

interface WmoDailyStripProps {
  wmo: AggregatedPoint[];
  modelLines?: FetchResult[];
}

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOVER_DELAY_MS = 300;
const LONG_PRESS_MS = 400;

export default function WmoDailyStrip({ wmo, modelLines }: WmoDailyStripProps) {
  const [visibleDay, setVisibleDay] = useState<number | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const handleMouseEnter = useCallback((day: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => setVisibleDay(day), HOVER_DELAY_MS);
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setVisibleDay(null);
  }, []);

  const handleTouchStart = useCallback((day: number) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => setVisibleDay(day), LONG_PRESS_MS);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    setVisibleDay(null);
  }, []);

  const days = useMemo((): DaySummary[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const summaries: DaySummary[] = [];

    for (let d = 0; d < 14; d++) {
      const dayPoints = wmo.filter((p) => p.hour >= d * 24 && p.hour < (d + 1) * 24);
      if (dayPoints.length === 0) continue;

      const hoursByGroup = new Map<string, { count: number; codes: number[] }>();
      for (const p of dayPoints) {
        const group = wmoGroupOf(p.value);
        if (!hoursByGroup.has(group.id)) hoursByGroup.set(group.id, { count: 0, codes: [] });
        const entry = hoursByGroup.get(group.id)!;
        entry.count++;
        entry.codes.push(p.value);
      }

      let chosenId: string | null = null;
      for (const group of [...WMO_GROUPS].sort((a, b) => b.severity - a.severity)) {
        const entry = hoursByGroup.get(group.id);
        if (entry && group.severity >= 3 && entry.count >= 3) {
          chosenId = group.id;
          break;
        }
      }
      if (!chosenId) {
        let best = 0;
        for (const [id, entry] of Array.from(hoursByGroup.entries())) {
          if (entry.count > best) { best = entry.count; chosenId = id; }
        }
      }

      const chosen = hoursByGroup.get(chosenId!)!;
      const sorted = [...chosen.codes].sort((a, b) => a - b);
      const representative = sorted[Math.floor(sorted.length / 2)];
      const date = new Date(today.getTime() + d * 86400000);
      const avgModels = dayPoints.reduce((s, p) => s + p.modelCount, 0) / dayPoints.length;

      const modelBreakdown: ModelWmoVote[] = [];
      if (modelLines) {
        for (const ml of modelLines) {
          const modelCodes: number[] = [];
          for (let h = d * 24; h < (d + 1) * 24; h++) {
            if (ml.activeRange && (h < ml.activeRange.startH || h >= ml.activeRange.endH)) continue;
            const c = ml.series.weather_code?.[h];
            if (c !== null && c !== undefined) modelCodes.push(c);
          }
          if (modelCodes.length === 0) continue;

          const groupVotes = new Map<string, number[]>();
          for (const c of modelCodes) {
            const g = wmoGroupOf(c);
            if (!groupVotes.has(g.id)) groupVotes.set(g.id, []);
            groupVotes.get(g.id)!.push(c);
          }

          let bestGroup = ''; let bestCount = 0; let bestSev = -1;
          for (const [gid, codes] of Array.from(groupVotes.entries())) {
            const sev = WMO_GROUPS.find((g) => g.id === gid)?.severity ?? 0;
            if (codes.length > bestCount || (codes.length === bestCount && sev > bestSev)) {
              bestCount = codes.length; bestGroup = gid; bestSev = sev;
            }
          }

          const bestCodes = groupVotes.get(bestGroup)!;
          const medCode = bestCodes.sort((a, b) => a - b)[Math.floor(bestCodes.length / 2)];
          const groupDef = WMO_GROUPS.find((g) => g.id === bestGroup)!;

          modelBreakdown.push({
            name: `${ml.model.providerFlag} ${ml.model.name}`,
            color: ml.model.color,
            groupLabel: groupDef.label,
            code: medCode,
          });
        }
      }

      summaries.push({
        day: d + 1, dayName: DAY_NAMES[date.getDay()], dayNum: date.getDate(),
        code: representative, groupLabel: WMO_GROUPS.find((g) => g.id === chosenId)!.label,
        icon: getWMOIcon(representative), hoursInGroup: chosen.count,
        modelCount: Math.round(avgModels), modelBreakdown,
      });
    }
    return summaries;
  }, [wmo, modelLines]);

  if (days.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300">Ciel — smart bary multi-modèles</h3>
        <span className="text-[9px] text-slate-600">{days.length} jours</span>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 pb-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex gap-[3px] min-w-min">
          {days.map((d) => (
            <div
              key={d.day}
              className={`relative flex flex-col items-center min-w-[52px] px-1.5 py-2 rounded-lg border bg-slate-800/40 border-slate-700/30 select-none ${
                d.modelCount < 3 ? 'opacity-70' : ''
              }`}
              onMouseEnter={() => handleMouseEnter(d.day)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleTouchStart(d.day)}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <span className="text-[9px] text-slate-500 font-medium">{d.dayName}</span>
              <span className="text-[10px] text-slate-400 font-mono">{d.dayNum}</span>
              <span className="text-xl mt-1 leading-none">{d.icon}</span>
              <span className="text-[8px] text-slate-500 mt-1.5 text-center leading-tight">{d.groupLabel}</span>
              <span className="text-[7px] text-slate-600 font-mono mt-0.5">WMO {d.code}</span>

              {/* Popover positioned ABOVE the card */}
              {visibleDay === d.day && d.modelBreakdown.length > 0 && (
                <div className="absolute z-20 bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 rounded-lg px-3 py-2 shadow-xl text-[10px] min-w-[180px] max-w-[220px]">
                  <div className="text-slate-400 text-[9px] mb-1.5 font-semibold">Prévision par modèle</div>
                  {d.modelBreakdown.map((m, i) => (
                    <div key={i} className="flex justify-between gap-2 py-0.5">
                      <span style={{ color: ensureReadableColor(m.color) }} className="truncate">{m.name}</span>
                      <span className="text-slate-300 whitespace-nowrap flex items-center gap-1">
                        <span className="text-xs">{getWMOIcon(m.code)}</span>
                        <span className="font-mono text-slate-500">{m.code}</span>
                      </span>
                    </div>
                  ))}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-slate-700" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-[9px] text-slate-600 px-1">
        Smart bary : groupe dominant + barycentre discret. Appui long (mobile) ou survol (PC) pour voir chaque modèle.
      </div>
    </div>
  );
}
