'use client';

import { AggregatedPoint, FetchResult, TierSelection, CascadeGroup } from '../../types';
import WmoDailyStrip from '../charts/WmoDailyStrip';
import AlgorithmExplainer from '../AlgorithmExplainer';
import ExplainerToggle from './ExplainerToggle';

interface SkyTabProps {
  wmo: AggregatedPoint[];
  modelLines: FetchResult[];
  tierSelections: TierSelection[];
  cascades: CascadeGroup[];
}

export default function SkyTab({ wmo, modelLines, tierSelections, cascades }: SkyTabProps) {
  return (
    <div className="space-y-4">
      <WmoDailyStrip wmo={wmo} modelLines={modelLines} />

      <ExplainerToggle>
        <AlgorithmExplainer
          variable="sky"
          tierSelections={tierSelections}
          cascades={cascades}
          modelLines={modelLines}
          aggregation={wmo}
        />
      </ExplainerToggle>
    </div>
  );
}
