'use client';

import { useMemo } from 'react';
import { AggregatedPoint, FetchResult, TierSelection, CascadeGroup } from '../../types';
import DailyVariableTable, { DayCell, buildDayHeaders } from '../DailyVariableTable';
import WindChart from '../charts/WindChart';
import AlgorithmExplainer from '../AlgorithmExplainer';
import ExplainerToggle from './ExplainerToggle';
import { downsampleForChart, directionArrow, directionLabel } from '../charts/chartUtils';

const MAX_HOURS = 336;

function windColor(kmh: number): string {
  if (kmh >= 60) return '#f87171';
  if (kmh >= 40) return '#fb923c';
  if (kmh >= 25) return '#fbbf24';
  return '#86efac';
}

interface WindTabProps {
  speed: AggregatedPoint[];
  gusts: AggregatedPoint[];
  direction: AggregatedPoint[];
  modelLines: FetchResult[];
  tierSelections: TierSelection[];
  cascades: CascadeGroup[];
}

export default function WindTab({
  speed,
  gusts,
  direction,
  modelLines,
  tierSelections,
  cascades,
}: WindTabProps) {
  const dailyCells = useMemo((): DayCell[] => {
    const headers = buildDayHeaders();
    const cells: DayCell[] = [];

    for (const h of headers) {
      const inDay = (p: AggregatedPoint) => p.hour >= (h.day - 1) * 24 && p.hour < h.day * 24;
      const daySpeed = speed.filter(inDay);
      if (daySpeed.length === 0) continue;

      const dayGusts = gusts.filter(inDay);
      const dayDirs = direction.filter(inDay);

      const maxSpeed = Math.round(Math.max(...daySpeed.map((p) => p.value)));
      const maxGust = dayGusts.length > 0 ? Math.round(Math.max(...dayGusts.map((p) => p.value))) : null;

      // Dominant direction: vector mean of the hourly consensus directions
      let arrow = '';
      if (dayDirs.length > 0) {
        let u = 0;
        let v = 0;
        for (const p of dayDirs) {
          const rad = (p.value * Math.PI) / 180;
          u += Math.sin(rad);
          v += Math.cos(rad);
        }
        const meanDir = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;
        arrow = `${directionArrow(meanDir)} ${directionLabel(meanDir)}`;
      }

      const avgModels = daySpeed.reduce((s, p) => s + p.modelCount, 0) / daySpeed.length;

      cells.push({
        ...h,
        main: `${maxSpeed}`,
        mainColor: windColor(maxSpeed),
        sub: maxGust !== null ? `${maxGust} ${arrow}` : arrow,
        subColor: maxGust !== null ? windColor(maxGust) : '#64748b',
        dim: avgModels < 3,
      });
    }

    return cells;
  }, [speed, gusts, direction]);

  const chartSpeed = useMemo(() => downsampleForChart(speed, MAX_HOURS), [speed]);
  const chartGusts = useMemo(() => downsampleForChart(gusts, MAX_HOURS), [gusts]);
  const chartDirection = useMemo(() => downsampleForChart(direction, MAX_HOURS), [direction]);

  return (
    <div className="space-y-4">
      <DailyVariableTable
        title="Vent max (km/h) · rafales max + direction dominante"
        cells={dailyCells}
        legend="Grand chiffre = vitesse max · petit = rafale max + direction dominante du jour"
      />

      <WindChart speed={chartSpeed} gusts={chartGusts} direction={chartDirection} modelLines={modelLines} />

      <ExplainerToggle>
        <AlgorithmExplainer
          variable="wind"
          tierSelections={tierSelections}
          cascades={cascades}
          modelLines={modelLines}
          aggregation={speed}
        />
      </ExplainerToggle>
    </div>
  );
}
