import { FetchResult, SeamlessEndpoint } from '../types';
import {
  getPhase1Endpoints,
  getPhase2Endpoints,
  MIN_INDEPENDENT_FAMILIES,
} from '../data/families';

interface ApiFetchResult {
  id: string;
  status: 'success' | 'no_data' | 'error';
  dataPoints: number;
  temperatures: (number | null)[];
  times: string[];
  error?: string;
  fetchDurationMs: number;
}

/**
 * Phase 1: fetch region-matched + universal endpoints.
 * Phase 2 (if needed): fetch remaining endpoints as fallback to reach
 * MIN_INDEPENDENT_FAMILIES per tier.
 */
export async function testSeamlessFetches(
  lat: number,
  lon: number
): Promise<{ phase1: FetchResult[]; phase2: FetchResult[]; allResults: FetchResult[] }> {
  // Phase 1: region-matched + universal
  const phase1Endpoints = getPhase1Endpoints(lat, lon);
  const phase1Results = await fetchEndpoints(lat, lon, phase1Endpoints);

  const successPhase1 = phase1Results.filter((r) => r.status === 'success');
  const families = new Set(successPhase1.map((r) => r.endpoint.family));

  // Check if we need Phase 2
  if (families.size >= MIN_INDEPENDENT_FAMILIES) {
    return { phase1: phase1Results, phase2: [], allResults: phase1Results };
  }

  // Phase 2: fetch additional endpoints to fill gaps
  const phase2Endpoints = getPhase2Endpoints(lat, lon);
  if (phase2Endpoints.length === 0) {
    return { phase1: phase1Results, phase2: [], allResults: phase1Results };
  }

  const phase2Results = await fetchEndpoints(lat, lon, phase2Endpoints);
  const allResults = [...phase1Results, ...phase2Results];

  return { phase1: phase1Results, phase2: phase2Results, allResults };
}

async function fetchEndpoints(
  lat: number,
  lon: number,
  endpoints: SeamlessEndpoint[]
): Promise<FetchResult[]> {
  const models = endpoints.map((ep) => ({
    id: ep.id,
    apiModel: ep.apiModel,
  }));

  const response = await fetch('/api/experimental/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon, models }),
  });

  if (!response.ok) {
    throw new Error(`Fetch API returned ${response.status}`);
  }

  const data = await response.json();
  const results: ApiFetchResult[] = data.results;

  return results.map((r) => {
    const endpoint = endpoints.find((ep) => ep.id === r.id)!;
    return {
      endpoint,
      status: r.status,
      dataPoints: r.dataPoints,
      temperatures: r.temperatures,
      times: r.times,
      error: r.error,
      fetchDurationMs: r.fetchDurationMs,
    };
  });
}
