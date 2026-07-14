import { FetchResult, ModelDefinition, DedupExclusion, HourlySeriesKey, MeshTier } from '../types';

interface ApiFetchResult {
  id: string;
  apiModel: string;
  status: 'success' | 'no_data' | 'error';
  dataPoints: number;
  series: Partial<Record<HourlySeriesKey, (number | null)[]>>;
  times: string[];
  error?: string;
  fetchDurationMs: number;
}

/**
 * Forecast hours requested per tier.
 * Fine models max out at 48-60h anyway; medium ~120-168h; large/AI go full range.
 * Requesting more than a model's capacity is harmless (returns available hours only).
 */
export const FORECAST_HOURS_BY_TIER: Record<string, number> = {
  fine: 72,
  medium: 180,
  large: 384,
  ai: 384,
};

export interface TierGroup {
  tier: MeshTier | 'ai';
  models: ModelDefinition[];
}

/**
 * Fetches models grouped by tier using multi-model URLs.
 * Each tier = 1 HTTP request to the API route (which makes 1 Open-Meteo call per tier).
 * Total: 4 API calls max (fine + medium + large + AI) instead of ~16 individual.
 */
export async function fetchByTier(
  lat: number,
  lon: number,
  tierGroups: TierGroup[]
): Promise<FetchResult[]> {
  const tiers = tierGroups
    .filter((g) => g.models.length > 0)
    .map((g) => ({
      tier: g.tier,
      models: g.models.map((m) => ({ id: m.id, apiModel: m.apiModel })),
      forecast_hours: FORECAST_HOURS_BY_TIER[g.tier] ?? 384,
    }));

  if (tiers.length === 0) return [];

  const response = await fetch('/api/experimental/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, tiers }),
  });

  if (!response.ok) {
    throw new Error(`Fetch API returned ${response.status}`);
  }

  const data = await response.json();
  const results: ApiFetchResult[] = data.results;

  // Map API results back to ModelDefinition-enriched FetchResult
  const allModels = tierGroups.flatMap((g) => g.models);
  return results.map((r) => {
    const model = allModels.find((m) => m.id === r.id)!;
    return {
      model,
      status: r.status,
      dataPoints: r.dataPoints,
      series: r.series,
      times: r.times,
      error: r.error,
      fetchDurationMs: r.fetchDurationMs,
    };
  });
}

/**
 * Post-fetch validation with dedup fallback:
 * if a dedup winner (e.g. DMI DINI) failed at fetch time, the model it
 * shadowed (e.g. KNMI HARMONIE EU) is fetched individually and reinstated.
 */
export async function validateAndFallback(
  lat: number,
  lon: number,
  fetchResults: FetchResult[],
  exclusions: DedupExclusion[]
): Promise<FetchResult[]> {
  const results = [...fetchResults];

  const failedIds = new Set(
    results.filter((r) => r.status !== 'success').map((r) => r.model.id)
  );

  const fallbacksToFetch = exclusions
    .filter((e) => e.fallbackFor && failedIds.has(e.fallbackFor))
    .map((e) => e.excluded);

  if (fallbacksToFetch.length > 0) {
    const fallbackResults = await fetchByTier(lat, lon, [
      { tier: 'medium', models: fallbacksToFetch },
    ]);
    results.push(...fallbackResults);
  }

  return results;
}

// ─── Legacy compat: kept for any code still using old API ───────────
/** @deprecated Use fetchByTier instead */
export async function fetchIndividualModels(
  lat: number,
  lon: number,
  models: ModelDefinition[]
): Promise<FetchResult[]> {
  return fetchByTier(lat, lon, [{ tier: 'medium', models }]);
}
