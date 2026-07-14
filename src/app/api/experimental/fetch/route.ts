import { NextRequest, NextResponse } from 'next/server';

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';
const MAX_CONCURRENT = 10;
const FETCH_TIMEOUT_MS = 15000;

const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
] as const;

type HourlyVar = (typeof HOURLY_VARS)[number];

// ─── Cache ──────────────────────────────────────────────────────────
interface CacheEntry {
  results: TierFetchResult[];
  timestamp: number;
}

const tierCache = new Map<string, CacheEntry>();

const TTL_BY_TIER: Record<string, number> = {
  fine: 90 * 60_000,    // 90 min — runs every 6h, check ~1× between runs
  medium: 90 * 60_000,  // 90 min
  large: 180 * 60_000,  // 3h — IFS/GFS run 2×/day
  ai: 360 * 60_000,     // 6h — AI models run 1-2×/day
  nowcast: 5 * 60_000,  // 5 min — placeholder for future nowcast
};

function getCacheKey(lat: number, lon: number, tier: string, apiModels: string[], forecastHours: number): string {
  const latR = Math.round(lat * 100) / 100;
  const lonR = Math.round(lon * 100) / 100;
  return `${latR},${lonR}:${tier}:${apiModels.sort().join('+')}:h${forecastHours}`;
}

function getCachedTier(key: string, tier: string): TierFetchResult[] | null {
  const entry = tierCache.get(key);
  if (!entry) return null;
  const ttl = TTL_BY_TIER[tier] ?? TTL_BY_TIER.medium;
  if (Date.now() - entry.timestamp > ttl) {
    tierCache.delete(key);
    return null;
  }
  return entry.results;
}

// ─── Concurrency limiter (semaphore pattern) ────────────────────────
let activeCount = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeCount < MAX_CONCURRENT) {
    activeCount++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function releaseSlot(): void {
  activeCount--;
  const next = queue.shift();
  if (next) {
    activeCount++;
    next();
  }
}

// ─── Types ──────────────────────────────────────────────────────────
interface TierRequest {
  tier: string;
  models: { id: string; apiModel: string }[];
  forecast_hours: number;
}

interface TierFetchResult {
  id: string;
  apiModel: string;
  status: 'success' | 'no_data' | 'error';
  dataPoints: number;
  series: Record<string, (number | null)[]>;
  times: string[];
  error?: string;
  fetchDurationMs: number;
}

// ─── Main handler ───────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lon, tiers } = body as {
      lat: number;
      lon: number;
      tiers: TierRequest[];
    };

    if (!lat || !lon || !tiers?.length) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lon, tiers' },
        { status: 400 }
      );
    }

    const allResults: TierFetchResult[] = [];
    const fetchPromises: Promise<void>[] = [];

    for (const tierReq of tiers) {
      const cacheKey = getCacheKey(lat, lon, tierReq.tier, tierReq.models.map(m => m.apiModel), tierReq.forecast_hours);
      const cached = getCachedTier(cacheKey, tierReq.tier);

      if (cached) {
        allResults.push(...cached);
        continue;
      }

      fetchPromises.push(
        fetchTierMultiModel(lat, lon, tierReq).then((results) => {
          allResults.push(...results);
          tierCache.set(cacheKey, { results, timestamp: Date.now() });
        })
      );
    }

    await Promise.all(fetchPromises);
    return NextResponse.json({ results: allResults });
  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : 'Unknown'}` },
      { status: 500 }
    );
  }
}

// ─── Multi-model fetch per tier ─────────────────────────────────────
async function fetchTierMultiModel(
  lat: number,
  lon: number,
  tierReq: TierRequest
): Promise<TierFetchResult[]> {
  const { models, forecast_hours } = tierReq;
  if (models.length === 0) return [];

  const hourly = HOURLY_VARS.join(',');
  const modelParam = models.map((m) => m.apiModel).join(',');
  const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&hourly=${hourly}&models=${modelParam}&timezone=auto&forecast_hours=${forecast_hours}`;

  await acquireSlot();
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const duration = Date.now() - start;

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      // If multi-model fails, fall back to individual fetches
      if (models.length > 1) {
        return fallbackIndividual(lat, lon, models, forecast_hours);
      }
      return models.map((m) => ({
        id: m.id,
        apiModel: m.apiModel,
        status: 'error' as const,
        dataPoints: 0,
        series: {},
        times: [],
        error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
        fetchDurationMs: duration,
      }));
    }

    const data = await response.json();
    return parseMultiModelResponse(data, models, duration);
  } catch (err: unknown) {
    const duration = Date.now() - start;
    const message = err instanceof Error ? err.message : 'Unknown error';
    // On timeout/network error with multi-model, fall back to individual
    if (models.length > 1) {
      return fallbackIndividual(lat, lon, models, forecast_hours);
    }
    return models.map((m) => ({
      id: m.id,
      apiModel: m.apiModel,
      status: 'error' as const,
      dataPoints: 0,
      series: {},
      times: [],
      error: message.includes('abort') ? `Timeout (${FETCH_TIMEOUT_MS / 1000}s)` : message,
      fetchDurationMs: duration,
    }));
  } finally {
    clearTimeout(timeout);
    releaseSlot();
  }
}

// ─── Parse multi-model response (suffixed keys) ─────────────────────
function parseMultiModelResponse(
  data: Record<string, unknown>,
  models: { id: string; apiModel: string }[],
  fetchDurationMs: number
): TierFetchResult[] {
  const hourly = data.hourly as Record<string, unknown[]> | undefined;
  if (!hourly) {
    return models.map((m) => ({
      id: m.id,
      apiModel: m.apiModel,
      status: 'error' as const,
      dataPoints: 0,
      series: {},
      times: [],
      error: 'No hourly data in response',
      fetchDurationMs,
    }));
  }

  const times = (hourly.time as string[]) || [];
  const isSingleModel = models.length === 1;

  return models.map((model) => {
    const series: Record<string, (number | null)[]> = {};
    let hasAnyData = false;

    for (const varKey of HOURLY_VARS) {
      // Multi-model: keys are suffixed with model name
      // Single-model: keys may be unsuffixed
      const suffixedKey = `${varKey}_${model.apiModel}`;
      const rawData = (hourly[suffixedKey] ?? (isSingleModel ? hourly[varKey] : undefined)) as
        | (number | null)[]
        | undefined;

      series[varKey] = rawData || [];
      if (rawData && rawData.some((v) => v !== null)) hasAnyData = true;
    }

    const temps = series.temperature_2m;
    const nonNull = temps ? temps.filter((t) => t !== null).length : 0;

    return {
      id: model.id,
      apiModel: model.apiModel,
      status: (hasAnyData && nonNull > 0 ? 'success' : 'no_data') as 'success' | 'no_data',
      dataPoints: nonNull,
      series,
      times,
      fetchDurationMs,
    };
  });
}

// ─── Fallback: individual model fetches (if multi-model fails) ──────
async function fallbackIndividual(
  lat: number,
  lon: number,
  models: { id: string; apiModel: string }[],
  forecast_hours: number
): Promise<TierFetchResult[]> {
  const results: TierFetchResult[] = [];

  for (const model of models) {
    await acquireSlot();
    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const hourly = HOURLY_VARS.join(',');
      const url = `${OPEN_METEO_BASE}?latitude=${lat}&longitude=${lon}&hourly=${hourly}&models=${model.apiModel}&timezone=auto&forecast_hours=${forecast_hours}`;
      const response = await fetch(url, { signal: controller.signal });
      const duration = Date.now() - start;

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        results.push({
          id: model.id,
          apiModel: model.apiModel,
          status: 'error',
          dataPoints: 0,
          series: {},
          times: [],
          error: `HTTP ${response.status}: ${errText.slice(0, 200)}`,
          fetchDurationMs: duration,
        });
        continue;
      }

      const data = await response.json();
      const parsed = parseMultiModelResponse(data, [model], duration);
      results.push(...parsed);
    } catch (err: unknown) {
      const duration = Date.now() - start;
      const message = err instanceof Error ? err.message : 'Unknown error';
      results.push({
        id: model.id,
        apiModel: model.apiModel,
        status: 'error',
        dataPoints: 0,
        series: {},
        times: [],
        error: message.includes('abort') ? `Timeout (${FETCH_TIMEOUT_MS / 1000}s)` : message,
        fetchDurationMs: duration,
      });
    } finally {
      clearTimeout(timeout);
      releaseSlot();
    }
  }

  return results;
}

// ─── Cache stats (GET endpoint for debugging) ───────────────────────
export async function GET() {
  const entries = Array.from(tierCache.entries()).map(([key, entry]) => ({
    key,
    age_s: Math.round((Date.now() - entry.timestamp) / 1000),
    models: entry.results.length,
    success: entry.results.filter((r) => r.status === 'success').length,
  }));

  return NextResponse.json({
    cache_size: tierCache.size,
    entries,
    concurrency: { active: activeCount, queued: queue.length, max: MAX_CONCURRENT },
  });
}
