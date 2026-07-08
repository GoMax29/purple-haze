'use client';

import { useState, useMemo } from 'react';
import { AggregatedPoint, FetchResult, TierSelection, CascadeGroup } from '../../types';
import DailyForecastTable from '../DailyForecastTable';
import TemperatureChart from '../TemperatureChart';
import AITemperatureChart from '../AITemperatureChart';
import AlgorithmExplainer from '../AlgorithmExplainer';
import ExplainerToggle from './ExplainerToggle';

type ChartRange = 'full' | '1-7' | '8-14';

const RANGE_TABS: { id: ChartRange; label: string }[] = [
  { id: 'full', label: 'J1–14' },
  { id: '1-7', label: 'J1–7' },
  { id: '8-14', label: 'J8–14' },
];

interface TemperatureTabProps {
  chartData: AggregatedPoint[];
  fullAggregation: AggregatedPoint[];
  aiChartData: AggregatedPoint[];
  nwpLongTermData: AggregatedPoint[];
  classicModelLines: FetchResult[];
  aiModelLines: FetchResult[];
  tierSelections: TierSelection[];
  cascades: CascadeGroup[];
}

export default function TemperatureTab({
  chartData,
  fullAggregation,
  aiChartData,
  nwpLongTermData,
  classicModelLines,
  aiModelLines,
  tierSelections,
  cascades,
}: TemperatureTabProps) {
  const [chartRange, setChartRange] = useState<ChartRange>('full');

  const filteredNwp = useMemo(() => {
    if (chartRange === '1-7') return chartData.filter((p) => p.hour < 168);
    if (chartRange === '8-14') return chartData.filter((p) => p.hour >= 168);
    return chartData;
  }, [chartData, chartRange]);

  const filteredAi = useMemo(() => {
    if (chartRange === '1-7') return [];
    if (chartRange === '8-14') return aiChartData.filter((p) => p.hour >= 168);
    return aiChartData;
  }, [aiChartData, chartRange]);

  const filteredNwpLong = useMemo(() => {
    if (chartRange === '1-7') return [];
    return nwpLongTermData;
  }, [nwpLongTermData, chartRange]);

  const showAi = filteredAi.length > 0 && aiModelLines.length > 0;

  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <DailyForecastTable aggregation={chartData} aiAggregation={aiChartData} />
      )}

      {/* Range tabs + title */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-slate-300">Courbe de température</h3>
        <div className="flex gap-0.5">
          {RANGE_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setChartRange(tab.id)}
              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-colors border ${
                chartRange === tab.id
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                  : 'bg-slate-800/40 border-slate-700/30 text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredNwp.length > 0 && (
        <TemperatureChart data={filteredNwp} modelLines={classicModelLines} />
      )}

      {showAi && (
        <AITemperatureChart
          aiAggregation={filteredAi}
          aiModelLines={aiModelLines}
          nwpReference={filteredNwpLong.length > 0 ? filteredNwpLong : undefined}
        />
      )}

      <ExplainerToggle>
        <AlgorithmExplainer
          variable="temperature"
          tierSelections={tierSelections}
          cascades={cascades}
          modelLines={classicModelLines}
          aggregation={fullAggregation}
        />
      </ExplainerToggle>
    </div>
  );
}
