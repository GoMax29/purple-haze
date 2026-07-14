'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  FetchResult,
  TierSelection,
  BboxResult,
  DedupExclusion,
  CascadeGroup,
  MeshTier,
  ModelDefinition,
  ActiveRange,
  VariableAggregations,
  WeatherVariable,
} from './types';
import { resolveBoundingBoxes } from './Coverage/BoundingBoxResolver';
import { classifyByResolution } from './Coverage/ResolutionClassifier';
import { filterByRegion } from './Coverage/RegionalFilter';
import { applyExplicitDedup, detectCascades } from './Coverage/ModelDeduplicator';
import { capModelsPerTier } from './Coverage/TierCapper';
import { fetchByTier, validateAndFallback, TierGroup } from './Coverage/FetchTester';
import { aggregateAI } from './Algorithms/Aggregation';
import { aggregateAllVariables } from './Algorithms/VariableAggregators';
import { getRegion, MESH_TIER_CONFIG } from './data/families';
import { getAIModels } from './data/models';
import { downsampleForChart } from './Components/charts/chartUtils';

import PipelineSummary from './Components/PipelineSummary';
import TemperatureTab from './Components/tabs/TemperatureTab';
import PrecipitationTab from './Components/tabs/PrecipitationTab';
import HumidityTab from './Components/tabs/HumidityTab';
import WindTab from './Components/tabs/WindTab';
import SkyTab from './Components/tabs/SkyTab';
import StepBoundingBox from './Components/StepBoundingBox';
import StepModelSelection from './Components/StepModelSelection';
import StepDedupCascade from './Components/StepFamilyDedup';
import StepAlgorithmChoice from './Components/StepAlgorithmChoice';
import StepFetchResults from './Components/StepFetchResults';

const MAX_FORECAST_HOURS = 336; // J14

const TABS: { id: WeatherVariable; label: string; short: string; icon: string }[] = [
  { id: 'temperature', label: 'Température', short: 'T', icon: '🌡' },
  { id: 'precipitation', label: 'Précip.', short: 'P', icon: '🌧' },
  { id: 'humidity', label: 'Humidité', short: 'H', icon: '💧' },
  { id: 'wind', label: 'Vent', short: 'V', icon: '💨' },
  { id: 'sky', label: 'Ciel', short: 'C', icon: '☁️' },
];

interface ExperimentalPanelProps {
  lat?: number;
  lon?: number;
}

export default function ExperimentalPanel({ lat, lon }: ExperimentalPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WeatherVariable>('temperature');
  const [bboxResults, setBboxResults] = useState<BboxResult[]>([]);
  const [tierSelections, setTierSelections] = useState<TierSelection[]>([]);
  const [exclusions, setExclusions] = useState<DedupExclusion[]>([]);
  const [cascades, setCascades] = useState<CascadeGroup[]>([]);
  const [allFetchResults, setAllFetchResults] = useState<FetchResult[]>([]);
  const [variableAgg, setVariableAgg] = useState<VariableAggregations | null>(null);
  const [aiAggregation, setAiAggregation] = useState<VariableAggregations['temperature']>([]);
  const [classicModelLines, setClassicModelLines] = useState<FetchResult[]>([]);
  const [aiModelLines, setAiModelLines] = useState<FetchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [pipelineRan, setPipelineRan] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);

  const region = useMemo(() => {
    if (lat == null || lon == null) return 'other';
    return getRegion(lat, lon);
  }, [lat, lon]);

  const runPipeline = useCallback(async () => {
    if (lat == null || lon == null || pipelineRan) return;

    setLoading(true);
    setPipelineRan(true);
    setPipelineDone(false);

    try {
      // 1. Bbox resolution
      setLoadingStep('Résolution des bounding boxes...');
      const bbox = resolveBoundingBoxes(lat, lon);
      setBboxResults(bbox);
      const inBounds = bbox.filter((r) => r.inBounds).map((r) => r.model);

      // 2. Explicit dedup (cross-tier rules: AROME vs HD, KNMI EU vs DMI DINI)
      const { kept: dedupedModels, exclusions: allExclusions } = applyExplicitDedup(inBounds);
      setExclusions(allExclusions);

      // 3. Classification by resolution (excludes AI + NBM)
      const { fine, medium, large } = classifyByResolution(dedupedModels);

      // 4. Regional filter (medium + large only)
      const detectedRegion = getRegion(lat, lon);
      const filteredMedium = filterByRegion(medium, detectedRegion, 'medium');
      const filteredLarge = filterByRegion(large, detectedRegion, 'large');

      // 5. Intra-provider cascades + cap 5 slots/tier (cascade = 1 slot)
      const cascFine = detectCascades(fine, 'fine');
      const cascMedium = detectCascades(filteredMedium.kept, 'medium');
      const cascLarge = detectCascades(filteredLarge.kept, 'large');
      const allCascades = [...cascFine.cascades, ...cascMedium.cascades, ...cascLarge.cascades];
      setCascades(allCascades);

      const capFine = capModelsPerTier(fine, cascFine.cascades);
      const capMedium = capModelsPerTier(filteredMedium.kept, cascMedium.cascades);
      const capLarge = capModelsPerTier(filteredLarge.kept, cascLarge.cascades);

      const buildSelection = (
        meshTier: MeshTier,
        kept: ModelDefinition[],
        dropped: ModelDefinition[],
        regionFiltered: ModelDefinition[]
      ): TierSelection => ({
        meshTier,
        label: MESH_TIER_CONFIG[meshTier].label,
        models: kept,
        dropped,
        regionFiltered,
        independentFamilies: new Set(kept.map((m) => m.family)).size,
      });

      const selections = [
        buildSelection('fine', capFine.kept, capFine.dropped, []),
        buildSelection('medium', capMedium.kept, capMedium.dropped, filteredMedium.filtered),
        buildSelection('large', capLarge.kept, capLarge.dropped, filteredLarge.filtered),
      ];
      setTierSelections(selections);

      // 6. Multi-model fetch grouped by tier (4 requests max instead of ~16)
      setLoadingStep('Connexion aux modèles météo...');
      const aiModels = getAIModels();
      const tierGroups: TierGroup[] = [
        { tier: 'fine', models: capFine.kept },
        { tier: 'medium', models: capMedium.kept },
        { tier: 'large', models: capLarge.kept },
        { tier: 'ai', models: aiModels },
      ];
      const rawResults = await fetchByTier(lat, lon, tierGroups);

      // 7. Post-fetch validation + dedup fallback
      setLoadingStep('Validation des données...');
      const validated = await validateAndFallback(lat, lon, rawResults, allExclusions);
      setAllFetchResults(validated);

      const successResults = validated.filter(
        (r) => r.status === 'success' && r.dataPoints > 0
      );

      // Attach cascade active ranges
      const activeRanges: Record<string, ActiveRange> = {
        ...cascFine.activeRanges,
        ...cascMedium.activeRanges,
        ...cascLarge.activeRanges,
      };
      for (const result of successResults) {
        const range = activeRanges[result.model.id];
        if (range) result.activeRange = range;
      }

      // 8. Per-variable progressive aggregation
      setLoadingStep('Agrégation multi-variables...');
      const idsOf = (models: ModelDefinition[]) => new Set(models.map((m) => m.id));
      const fineIds = idsOf(capFine.kept);
      const mediumIds = idsOf(capMedium.kept);
      const largeIds = idsOf(capLarge.kept);
      // Fallback-reinstated models join their natural mesh tier
      for (const result of successResults) {
        const excl = allExclusions.find((e) => e.excluded.id === result.model.id);
        if (excl) {
          const km = result.model.resolution_km;
          if (km < 5) fineIds.add(result.model.id);
          else if (km <= 11) mediumIds.add(result.model.id);
          else largeIds.add(result.model.id);
        }
      }

      const tieredFetches = {
        fine: successResults.filter((r) => fineIds.has(r.model.id)),
        medium: successResults.filter((r) => mediumIds.has(r.model.id)),
        large: successResults.filter((r) => largeIds.has(r.model.id)),
      };

      const referenceTimes = successResults.find((f) => f.times?.length)?.times;
      setVariableAgg(aggregateAllVariables(tieredFetches, MAX_FORECAST_HOURS, referenceTimes));
      setClassicModelLines([
        ...tieredFetches.fine,
        ...tieredFetches.medium,
        ...tieredFetches.large,
      ]);

      // 9. AI consensus (temperature only, separate chart)
      const aiFetches = successResults.filter((r) => r.model.isAI);
      setAiModelLines(aiFetches);
      if (aiFetches.length > 0) {
        setAiAggregation(aggregateAI(aiFetches, referenceTimes));
      }

      setPipelineDone(true);
    } catch (err) {
      console.error('[ExperimentalPanel] Pipeline error:', err);
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  }, [lat, lon, pipelineRan]);

  useEffect(() => {
    if (isOpen && !pipelineRan && lat != null && lon != null) {
      runPipeline();
    }
  }, [isOpen, runPipeline, pipelineRan, lat, lon]);

  useEffect(() => {
    setPipelineRan(false);
    setPipelineDone(false);
    setBboxResults([]);
    setTierSelections([]);
    setExclusions([]);
    setCascades([]);
    setAllFetchResults([]);
    setVariableAgg(null);
    setAiAggregation([]);
    setClassicModelLines([]);
    setAiModelLines([]);
  }, [lat, lon]);

  // Temperature chart data (hourly J1-J7, 3h J8-J14)
  const tempChartData = useMemo(
    () => (variableAgg ? downsampleForChart(variableAgg.temperature, MAX_FORECAST_HOURS) : []),
    [variableAgg]
  );
  const aiChartData = useMemo(
    () => aiAggregation.filter((p) => p.hour < MAX_FORECAST_HOURS),
    [aiAggregation]
  );
  const nwpLongTermData = useMemo(
    () =>
      variableAgg
        ? variableAgg.temperature.filter((p) => p.hour >= 168 && p.hour < MAX_FORECAST_HOURS)
        : [],
    [variableAgg]
  );

  if (lat == null || lon == null) return null;

  return (
    <div className="mt-4 rounded-xl border border-purple-500/30 bg-slate-900/80 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-3 hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
            MVP v2
          </span>
          <span className="text-xs sm:text-sm font-semibold text-slate-200">
            Experimental Weather Engine
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono uppercase">
            {region}
          </span>
          <span className={`text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-700/50 p-3 sm:p-4 space-y-4">
          {/* Loading state */}
          {loading && (
            <div className="flex items-center gap-3 py-6 justify-center">
              <span className="animate-spin text-purple-400 text-lg">⟳</span>
              <span className="text-xs text-slate-400">{loadingStep}</span>
            </div>
          )}

          {/* Results */}
          {pipelineDone && variableAgg && (
            <>
              {/* Variable tabs — compact on mobile */}
              <div className="flex gap-1 -mx-1 px-1 pb-0.5">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                      activeTab === tab.id
                        ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                        : 'bg-slate-800/40 border-slate-700/30 text-slate-500 hover:text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{tab.icon}</span>
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.short}</span>
                  </button>
                ))}
              </div>

              {/* Active tab content */}
              {activeTab === 'temperature' && (
                <TemperatureTab
                  chartData={tempChartData}
                  fullAggregation={variableAgg.temperature}
                  aiChartData={aiChartData}
                  nwpLongTermData={nwpLongTermData}
                  classicModelLines={classicModelLines}
                  aiModelLines={aiModelLines}
                  tierSelections={tierSelections}
                  cascades={cascades}
                />
              )}
              {activeTab === 'precipitation' && (
                <PrecipitationTab
                  aggregation={variableAgg.precipitation}
                  modelLines={classicModelLines}
                  tierSelections={tierSelections}
                  cascades={cascades}
                />
              )}
              {activeTab === 'humidity' && (
                <HumidityTab
                  aggregation={variableAgg.humidity}
                  modelLines={classicModelLines}
                  tierSelections={tierSelections}
                  cascades={cascades}
                />
              )}
              {activeTab === 'wind' && (
                <WindTab
                  speed={variableAgg.windSpeed}
                  gusts={variableAgg.windGusts}
                  direction={variableAgg.windDirection}
                  modelLines={classicModelLines}
                  tierSelections={tierSelections}
                  cascades={cascades}
                />
              )}
              {activeTab === 'sky' && (
                <SkyTab
                  wmo={variableAgg.wmo}
                  modelLines={classicModelLines}
                  tierSelections={tierSelections}
                  cascades={cascades}
                />
              )}
            </>
          )}

          {/* Collapsible technical details (pipeline internals) */}
          {pipelineDone && (
            <details className="group">
              <summary className="cursor-pointer text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 py-1">
                <span className="transition-transform group-open:rotate-90">▸</span>
                Détails techniques du pipeline
              </summary>
              <div className="mt-3 space-y-5 pl-2 border-l-2 border-slate-800">
                {bboxResults.length > 0 && (
                  <StepBoundingBox results={bboxResults} lat={lat} lon={lon} />
                )}
                {tierSelections.length > 0 && (
                  <StepModelSelection selections={tierSelections} />
                )}
                <StepDedupCascade exclusions={exclusions} cascades={cascades} />
                {allFetchResults.length > 0 && (
                  <StepFetchResults results={allFetchResults} loading={false} />
                )}
                {tierSelections.length > 0 && (
                  <StepAlgorithmChoice selections={tierSelections} />
                )}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
