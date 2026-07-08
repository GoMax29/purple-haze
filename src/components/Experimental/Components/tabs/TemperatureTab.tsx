'use client';

import { AggregatedPoint, FetchResult, TierSelection, CascadeGroup } from '../../types';
import DailyForecastTable from '../DailyForecastTable';
import TemperatureChart from '../TemperatureChart';
import AITemperatureChart from '../AITemperatureChart';
import AlgorithmExplainer from '../AlgorithmExplainer';
import ExplainerToggle from './ExplainerToggle';

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
  return (
    <div className="space-y-4">
      {chartData.length > 0 && (
        <DailyForecastTable aggregation={chartData} aiAggregation={aiChartData} />
      )}

      {chartData.length > 0 && (
        <TemperatureChart data={chartData} modelLines={classicModelLines} />
      )}

      {aiChartData.length > 0 && aiModelLines.length > 0 && (
        <AITemperatureChart
          aiAggregation={aiChartData}
          aiModelLines={aiModelLines}
          nwpReference={nwpLongTermData.length > 0 ? nwpLongTermData : undefined}
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
