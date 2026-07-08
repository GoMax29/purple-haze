'use client';

import { useMemo } from 'react';
import { AggregatedPoint, FetchResult, TierSelection, CascadeGroup } from '../../types';
import DailyVariableTable, { DayCell, buildDayHeaders } from '../DailyVariableTable';
import ConsensusChart from '../charts/ConsensusChart';
import AlgorithmExplainer from '../AlgorithmExplainer';
import ExplainerToggle from './ExplainerToggle';
import { downsampleForChart } from '../charts/chartUtils';

const MAX_HOURS = 336;

function humidityColor(pct: number): string {
  if (pct >= 90) return '#38bdf8';
  if (pct >= 70) return '#7dd3fc';
  if (pct >= 50) return '#bae6fd';
  return '#fde68a';
}

interface HumidityTabProps {
  aggregation: AggregatedPoint[];
  modelLines: FetchResult[];
  tierSelections: TierSelection[];
  cascades: CascadeGroup[];
}

export default function HumidityTab({
  aggregation,
  modelLines,
  tierSelections,
  cascades,
}: HumidityTabProps) {
  const dailyCells = useMemo((): DayCell[] => {
    const headers = buildDayHeaders();
    const cells: DayCell[] = [];

    for (const h of headers) {
      const dayPoints = aggregation.filter(
        (p) => p.hour >= (h.day - 1) * 24 && p.hour < h.day * 24
      );
      if (dayPoints.length === 0) continue;

      const max = Math.round(Math.max(...dayPoints.map((p) => p.value)));
      const min = Math.round(Math.min(...dayPoints.map((p) => p.value)));
      const avgModels = dayPoints.reduce((s, p) => s + p.modelCount, 0) / dayPoints.length;

      cells.push({
        ...h,
        main: `${max}%`,
        mainColor: humidityColor(max),
        sub: `${min}%`,
        subColor: humidityColor(min),
        dim: avgModels < 3,
      });
    }

    return cells;
  }, [aggregation]);

  const chartData = useMemo(() => downsampleForChart(aggregation, MAX_HOURS), [aggregation]);

  return (
    <div className="space-y-4">
      <DailyVariableTable
        title="Humidité relative — max / min quotidiens"
        cells={dailyCells}
        legend="Max en haut (souvent la nuit), min en bas (souvent l'après-midi)"
      />

      <ConsensusChart
        data={chartData}
        title="Humidité relative — consensus"
        unit="%"
        color="#38bdf8"
        gradientId="humidityGrad"
        yDomain={[0, 100]}
        modelLines={modelLines}
        seriesKey="relative_humidity_2m"
      />

      <ExplainerToggle>
        <AlgorithmExplainer
          variable="humidity"
          tierSelections={tierSelections}
          cascades={cascades}
          modelLines={modelLines}
          aggregation={aggregation}
        />
      </ExplainerToggle>
    </div>
  );
}
