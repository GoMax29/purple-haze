'use client';

import { useMemo } from 'react';
import { AggregatedPoint, FetchResult, TierSelection, CascadeGroup } from '../../types';
import DailyVariableTable, { DayCell, buildDayHeaders } from '../DailyVariableTable';
import PrecipitationChart from '../charts/PrecipitationChart';
import AlgorithmExplainer from '../AlgorithmExplainer';
import ExplainerToggle from './ExplainerToggle';
import { downsampleForChart } from '../charts/chartUtils';

const MAX_HOURS = 336;

interface PrecipitationTabProps {
  aggregation: AggregatedPoint[];
  modelLines: FetchResult[];
  tierSelections: TierSelection[];
  cascades: CascadeGroup[];
}

export default function PrecipitationTab({
  aggregation,
  modelLines,
  tierSelections,
  cascades,
}: PrecipitationTabProps) {
  const dailyCells = useMemo((): DayCell[] => {
    const headers = buildDayHeaders();
    const cells: DayCell[] = [];

    for (const h of headers) {
      const dayPoints = aggregation.filter(
        (p) => p.hour >= (h.day - 1) * 24 && p.hour < h.day * 24
      );
      if (dayPoints.length === 0) continue;

      const total = dayPoints.reduce((s, p) => s + p.value, 0);
      const maxWet = Math.max(...dayPoints.map((p) => p.wetFraction ?? 0));
      const avgModels = dayPoints.reduce((s, p) => s + p.modelCount, 0) / dayPoints.length;
      const rounded = Math.round(total * 10) / 10;

      cells.push({
        ...h,
        main: rounded > 0 ? `${rounded}` : '0',
        mainColor: rounded >= 5 ? '#38bdf8' : rounded > 0 ? '#7dd3fc' : '#475569',
        sub: maxWet > 0 ? `${Math.round(maxWet * 100)}%` : '—',
        subColor: maxWet >= 0.5 ? '#34d399' : '#64748b',
        dim: avgModels < 3,
      });
    }

    return cells;
  }, [aggregation]);

  const chartData = useMemo(() => downsampleForChart(aggregation, MAX_HOURS), [aggregation]);

  return (
    <div className="space-y-4">
      <DailyVariableTable
        title="Cumul quotidien (mm) · % max de modèles en pluie"
        cells={dailyCells}
        legend="mm = somme des médianes horaires · % = pic journalier de la part de modèles voyant > 0,1 mm"
      />

      <PrecipitationChart data={chartData} modelLines={modelLines} />

      <ExplainerToggle>
        <AlgorithmExplainer
          variable="precipitation"
          tierSelections={tierSelections}
          cascades={cascades}
          modelLines={modelLines}
          aggregation={aggregation}
        />
      </ExplainerToggle>
    </div>
  );
}
