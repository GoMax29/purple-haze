import { FetchResult, ModelDefinition, DedupExclusion, HourlySeriesKey } from '../types';

interface ApiFetchResult {
  id: string;
  status: 'success' | 'no_data' | 'error';
  dataPoints: number;
  series: Partial<Record<HourlySeriesKey, (number | null)[]>>;
  times: string[];
  error?: string;
  fetchDurationMs: number;
}

const BATCH_SIZE = 10;

/**
 * Fetches individual models (no seamless) through the API route,
 * batched to keep each upstream burst reasonable.
 */
export async function fetchIndividualModels(
  lat: number,
  lon: number,
  models: ModelDefinition[]
): Promise<FetchResult[]> {
  const results: FetchResult[] = [];

  for (let i = 0; i < models.length; i += BATCH_SIZE) {
    const batch = models.slice(i, i + BATCH_SIZE);
    const batchResults = await fetchBatch(lat, lon, batch);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Post-fetch validation with dedup fallback:
 * if a dedup winner (e.g. DMI DINI) failed at fetch time, the model it
 * shadowed (e.g. KNMI HARMONIE EU) is fetched and reinstated.
 * Returns all results; callers filter on status === 'success'.
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
    const fallbackResults = await fetchBatch(lat, lon, fallbacksToFetch);
    results.push(...fallbackResults);
  }

  return results;
}

async function fetchBatch(
  lat: number,
  lon: number,
  models: ModelDefinition[]
): Promise<FetchResult[]> {
  const payload = models.map((m) => ({ id: m.id, apiModel: m.apiModel }));

  const response = await fetch('/api/experimental/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, models: payload }),
  });

  if (!response.ok) {
    throw new Error(`Fetch API returned ${response.status}`);
  }

  const data = await response.json();
  const results: ApiFetchResult[] = data.results;

  return results.map((r) => {
    const model = models.find((m) => m.id === r.id)!;
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
