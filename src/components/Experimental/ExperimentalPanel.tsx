'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { FetchResult, FamilyGroup, TierSelection, OutlierResult, AggregatedPoint } from './types';
import { testSeamlessFetches } from './Coverage/FetchTester';
import { deduplicateByFamily } from './Coverage/FamilyDeduplicator';
import { selectModelsByTier } from './Coverage/ModelSelector';
import { filterOutliers } from './Algorithms/OutlierFilter';
import { aggregateTemperature, aggregateTemperatureByTier } from './Algorithms/WinsorizedMean';
import { getRegion, getPhase1Endpoints, AI_ENDPOINT_IDS, SEAMLESS_ENDPOINTS } from './data/families';

import PipelineSummary from './Components/PipelineSummary';
import DailyForecastTable from './Components/DailyForecastTable';
import TemperatureChart from './Components/TemperatureChart';
import AITemperatureChart from './Components/AITemperatureChart';
import StepEndpointsPlan from './Components/StepEndpointsPlan';
import StepFetchResults from './Components/StepFetchResults';
import StepFamilyDedup from './Components/StepFamilyDedup';
import StepModelSelection from './Components/StepModelSelection';
import StepAlgorithmChoice from './Components/StepAlgorithmChoice';
import StepOutlierFilter from './Components/StepOutlierFilter';

const MAX_FORECAST_HOURS = 336; // J14

interface ExperimentalPanelProps {
  lat?: number;
  lon?: number;
}

export default function ExperimentalPanel({ lat, lon }: ExperimentalPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [allFetchResults, setAllFetchResults] = useState<FetchResult[]>([]);
  const [phase1Results, setPhase1Results] = useState<FetchResult[]>([]);
  const [phase2Results, setPhase2Results] = useState<FetchResult[]>([]);
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [tierSelections, setTierSelections] = useState<TierSelection[]>([]);
  const [outlierResults, setOutlierResults] = useState<OutlierResult[]>([]);
  const [nwpAggregation, setNwpAggregation] = useState<AggregatedPoint[]>([]);
  const [aiAggregation, setAiAggregation] = useState<AggregatedPoint[]>([]);
  const [classicModelLines, setClassicModelLines] = useState<FetchResult[]>([]);
  const [modelTierStart, setModelTierStart] = useState<Record<string, number>>({});
  const [aiModelLines, setAiModelLines] = useState<FetchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [pipelineRan, setPipelineRan] = useState(false);
  const [pipelineDone, setPipelineDone] = useState(false);

  const region = useMemo(() => {
    if (lat == null || lon == null) return 'other';
    return getRegion(lat, lon);
  }, [lat, lon]);

  const phase1Endpoints = useMemo(() => {
    if (lat == null || lon == null) return [];
    return getPhase1Endpoints(lat, lon);
  }, [lat, lon]);

  const runPipeline = useCallback(async () => {
    if (lat == null || lon == null || pipelineRan) return;

    setLoading(true);
    setPipelineRan(true);
    setPipelineDone(false);

    try {
      setLoadingStep('Connexion aux modèles météo...');
      const { phase1, phase2, allResults } = await testSeamlessFetches(lat, lon);
      setPhase1Results(phase1);
      setPhase2Results(phase2);
      setAllFetchResults(allResults);

      setLoadingStep('Déduplication par famille...');
      const successFetches = allResults.filter((f) => f.status === 'success');
      const families = deduplicateByFamily(successFetches);
      setFamilyGroups(families);

      setLoadingStep('Sélection par horizon...');
      const tiers = selectModelsByTier(families, successFetches);
      setTierSelections(tiers);

      const dedupedFetches = families.map((g) => g.kept);

      setLoadingStep('Contrôle qualité...');
      const outliers = filterOutliers(dedupedFetches);
      setOutlierResults(outliers);

      setLoadingStep('Agrégation des températures...');
      const keptIds = new Set(outliers.filter((o) => o.kept).map((o) => o.endpoint.id));

      // AI models: not subject to tier restriction (always long-range)
      const aiFetches = dedupedFetches.filter((f) => AI_ENDPOINT_IDS.includes(f.endpoint.id));
      setAiModelLines(aiFetches);

      // Reference timestamps from the first model that has them
      const referenceTimes = dedupedFetches.find((f) => f.times?.length)?.times;

      // Build tier-aware NWP model sets (intersected with outlier QC)
      const isClassicKept = (f: FetchResult) =>
        !AI_ENDPOINT_IDS.includes(f.endpoint.id) && keptIds.has(f.endpoint.id);

      const shortTierSel = tiers.find((t) => t.tier === 'short');
      const midTierSel = tiers.find((t) => t.tier === 'mid');
      const longTierSel = tiers.find((t) => t.tier === 'long');

      const classicShort = (shortTierSel?.models ?? []).filter(isClassicKept);
      const classicMid = (midTierSel?.models ?? []).filter(isClassicKept);
      const classicLong = (longTierSel?.models ?? []).filter(isClassicKept);

      // Union of all tier models for individual model lines in the chart.
      // Build modelTierStart using the EARLIEST tier each model actually contributes to
      // (not its natural tier) — e.g. GEM is a fallback for short → tierStart = 0.
      const classicModelSet = new Map<string, FetchResult>();
      const tierStartRecord: Record<string, number> = {};

      const assignTier = (models: FetchResult[], startH: number) => {
        for (const m of models) {
          if (!classicModelSet.has(m.endpoint.id)) classicModelSet.set(m.endpoint.id, m);
          if (!(m.endpoint.id in tierStartRecord)) tierStartRecord[m.endpoint.id] = startH;
        }
      };

      assignTier(classicShort, 0);    // MF, ICON, UKMO, GEM (fallback) → H0
      assignTier(classicMid, 48);     // IFS HRES (first appearance at mid) → H48
      assignTier(classicLong, 120);   // GFS (only in long) → H120

      setClassicModelLines(Array.from(classicModelSet.values()));
      setModelTierStart(tierStartRecord);

      // Tier-aware NWP consensus (eliminates GFS/IFS from short-term aggregation)
      const nwpAgg = aggregateTemperatureByTier(
        classicShort,
        classicMid,
        classicLong,
        MAX_FORECAST_HOURS,
        referenceTimes
      );
      setNwpAggregation(nwpAgg);

      if (aiFetches.length > 0) {
        const aiAgg = aggregateTemperature(aiFetches, referenceTimes);
        setAiAggregation(aiAgg);
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
    setAllFetchResults([]);
    setPhase1Results([]);
    setPhase2Results([]);
    setFamilyGroups([]);
    setTierSelections([]);
    setOutlierResults([]);
    setNwpAggregation([]);
    setAiAggregation([]);
    setClassicModelLines([]);
    setModelTierStart({});
    setAiModelLines([]);
  }, [lat, lon]);

  // NWP chart data: hourly J1-J7, then every 3h J8-J14 (fewer data points for perf)
  const chartData = useMemo(() => {
    const zone1 = nwpAggregation.filter((p) => p.hour < 168);
    const zone2 = nwpAggregation
      .filter((p) => p.hour >= 168 && p.hour < MAX_FORECAST_HOURS)
      .filter((p) => p.hour % 3 === 0);
    return [...zone1, ...zone2];
  }, [nwpAggregation]);

  // AI aggregation for chart and table (full range, capped at J14)
  const aiChartData = useMemo(() => {
    return aiAggregation.filter((p) => p.hour < MAX_FORECAST_HOURS);
  }, [aiAggregation]);

  // NWP long-range reference for AI chart comparison (J8+, hourly — must match
  // AI aggregation resolution so nwpMap.get(hour) always finds a value)
  const nwpLongTermData = useMemo(() => {
    return nwpAggregation.filter((p) => p.hour >= 168 && p.hour < MAX_FORECAST_HOURS);
  }, [nwpAggregation]);

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
            MVP
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
          {pipelineDone && (
            <>
              {/* Pipeline summary */}
              <PipelineSummary
                fetchResults={allFetchResults}
                familyGroups={familyGroups}
                tierSelections={tierSelections}
                outlierResults={outlierResults}
              />

              {/* 14-day forecast table with toggleable AI min/max for J8+ */}
              {chartData.length > 0 && (
                <DailyForecastTable
                  aggregation={chartData}
                  aiAggregation={aiChartData}
                />
              )}

              {/* NWP consensus chart J1-J14 (tier-aware, no AI overlay) */}
              {chartData.length > 0 && (
                <TemperatureChart
                  data={chartData}
                  modelLines={classicModelLines}
                  modelTierStart={modelTierStart}
                />
              )}

              {/* Separate AI chart J7-J14 with NWP reference */}
              {aiChartData.length > 0 && aiModelLines.length > 0 && (
                <AITemperatureChart
                  aiAggregation={aiChartData}
                  aiModelLines={aiModelLines}
                  nwpReference={nwpLongTermData.length > 0 ? nwpLongTermData : undefined}
                />
              )}
            </>
          )}

          {/* Collapsible technical details */}
          {pipelineDone && (
            <details className="group">
              <summary className="cursor-pointer text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1.5 py-1">
                <span className="transition-transform group-open:rotate-90">▸</span>
                Détails techniques du pipeline
              </summary>
              <div className="mt-3 space-y-5 pl-2 border-l-2 border-slate-800">
                <StepEndpointsPlan
                  region={region}
                  phase1Endpoints={phase1Endpoints}
                  allEndpoints={SEAMLESS_ENDPOINTS}
                />
                <StepFetchResults
                  results={allFetchResults}
                  loading={false}
                  phase1Count={phase1Results.length}
                  phase2Count={phase2Results.length}
                />
                {familyGroups.length > 0 && <StepFamilyDedup groups={familyGroups} />}
                {tierSelections.length > 0 && (
                  <>
                    <StepModelSelection selections={tierSelections} />
                    <StepAlgorithmChoice selections={tierSelections} />
                  </>
                )}
                {outlierResults.length > 0 && <StepOutlierFilter results={outlierResults} />}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
