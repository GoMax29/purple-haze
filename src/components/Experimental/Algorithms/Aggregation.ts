import { FetchResult, AggregatedPoint, HourlySeriesKey } from '../types';
import { GAUSSIAN_SIGMA_MIN_TEMP, WINSORIZE_TRIM_PERCENT, MIN_POOL_SIZE } from '../data/families';

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────

export interface TieredFetches {
  fine: FetchResult[];
  medium: FetchResult[];
  large: FetchResult[];
}

export type NumericStrategy = 'robust' | 'median';

export type PoolMode = 'expansion' | 'strict';

export interface ProgressiveOptions {
  key: HourlySeriesKey;
  /** 'robust' = winsorized (N>=4) / gaussian (N=2-3); 'median' = median (precip) */
  strategy?: NumericStrategy;
  /** Gaussian sigma floor, in the variable's unit (default: temperature 5 °C) */
  sigmaFloor?: number;
  /** Clamp output range (e.g. humidity 0–100) */
  clamp?: [number, number];
  /** Compute wetFraction (share of values > 0.1) — precipitation only */
  withWetFraction?: boolean;
  /**
   * Pool selection mode:
   * - 'expansion' (default): progressive pool with MIN_POOL_SIZE, merges tiers to reach ≥3
   * - 'strict': use the finest available tier as-is (even if only 1 model).
   *   Prioritises spatial resolution over statistical robustness.
   *   Used for temperature, wind, humidity where a single fine model at 1.5 km
   *   is more informative than 4 medium models at 10 km.
   */
  poolMode?: PoolMode;
}

/**
 * Progressive tier-aware aggregation for one numeric hourly series.
 *
 * Per hour, the pool prefers the finest available mesh and degrades
 * gracefully: fine → fine+medium → medium → medium+large → everything.
 * Cascade activeRanges are honoured.
 */
export function aggregateProgressive(
  tiered: TieredFetches,
  maxHours: number,
  times: string[] | undefined,
  options: ProgressiveOptions
): AggregatedPoint[] {
  const all = [...tiered.fine, ...tiered.medium, ...tiered.large];
  if (all.length === 0) return [];

  const refTimes = times ?? all.find((f) => f.times?.length)?.times;
  const points: AggregatedPoint[] = [];

  for (let h = 0; h < maxHours; h++) {
    const { values, pool } = poolValuesAt(tiered, h, options.key, options.poolMode ?? 'expansion');
    if (values.length === 0) continue;

    const { value, method } = aggregateValues(values, options);
    const sorted = [...values].sort((a, b) => a - b);
    const clamped = options.clamp
      ? Math.min(options.clamp[1], Math.max(options.clamp[0], value))
      : value;

    const point: AggregatedPoint = {
      hour: h,
      datetime: refTimes?.[h] ?? `H+${h}`,
      value: Math.round(clamped * 10) / 10,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      modelCount: values.length,
      pool,
      method,
    };

    if (options.withWetFraction) {
      point.wetFraction =
        Math.round((values.filter((v) => v > 0.1).length / values.length) * 100) / 100;
    }

    points.push(point);
  }

  return points;
}

/**
 * AI consensus over the full horizon (temperature only — the 3 AI models
 * are 25 km globals, no tier logic).
 */
export function aggregateAI(aiFetches: FetchResult[], times?: string[]): AggregatedPoint[] {
  if (aiFetches.length === 0) return [];

  const refTimes = times ?? aiFetches.find((f) => f.times?.length)?.times;
  const maxHours = Math.max(...aiFetches.map((f) => f.series.temperature_2m?.length ?? 0));
  const points: AggregatedPoint[] = [];

  for (let h = 0; h < maxHours; h++) {
    const values = valuesAt(aiFetches, h, 'temperature_2m');
    if (values.length === 0) continue;

    const { value, method } = aggregateValues(values, { key: 'temperature_2m' });
    const sorted = [...values].sort((a, b) => a - b);

    points.push({
      hour: h,
      datetime: refTimes?.[h] ?? `H+${h}`,
      value: Math.round(value * 10) / 10,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      modelCount: values.length,
      method,
    });
  }

  return points;
}

/**
 * Progressive pool selection for one hour — exported so custom aggregators
 * (WMO vote, wind direction vector mean) reuse the exact same pool logic.
 * Returns the pooled fetches whose `key` value is valid at hour h.
 *
 * Mode 'expansion' (default): merges tiers progressively until MIN_POOL_SIZE.
 * Mode 'strict': returns the finest tier with ≥1 valid model — never mixes.
 */
export function poolFetchesAt(
  tiered: TieredFetches,
  h: number,
  key: HourlySeriesKey,
  mode: PoolMode = 'expansion'
): { fetches: FetchResult[]; pool: AggregatedPoint['pool'] } {
  const fine = fetchesValidAt(tiered.fine, h, key);
  const medium = fetchesValidAt(tiered.medium, h, key);
  const large = fetchesValidAt(tiered.large, h, key);

  if (mode === 'strict') {
    if (fine.length > 0) return { fetches: fine, pool: 'fine' };
    if (medium.length > 0) return { fetches: medium, pool: 'medium' };
    if (large.length > 0) return { fetches: large, pool: 'mixed' };
    return { fetches: [], pool: 'mixed' };
  }

  // Expansion mode (original progressive pool)
  if (fine.length >= MIN_POOL_SIZE) return { fetches: fine, pool: 'fine' };
  if (fine.length + medium.length >= MIN_POOL_SIZE) {
    return {
      fetches: [...fine, ...medium],
      pool: fine.length > 0 ? 'fine+medium' : 'medium',
    };
  }
  if (medium.length >= MIN_POOL_SIZE) return { fetches: medium, pool: 'medium' };
  if (medium.length + large.length >= MIN_POOL_SIZE) {
    return {
      fetches: [...medium, ...large],
      pool: medium.length > 0 ? 'medium+large' : 'mixed',
    };
  }
  return { fetches: [...fine, ...medium, ...large], pool: 'mixed' };
}

// ────────────────────────────────────────────────────────────
// SHARED MATH (exported for VariableAggregators)
// ────────────────────────────────────────────────────────────

export function winsorizedMean(values: number[], trimPercent: number = WINSORIZE_TRIM_PERCENT): number {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const trimCount = Math.floor(n * trimPercent);

  const winsorized = sorted.map((v, i) => {
    if (i < trimCount) return sorted[trimCount];
    if (i >= n - trimCount) return sorted[n - trimCount - 1];
    return v;
  });

  return simpleMean(winsorized);
}

/**
 * Robust gaussian weighted mean for small pools (N = 2-3).
 * Weights centred on the median, sigma = max(MAD * 1.4826, floor).
 * [20, 21, 30] with floor 5 → ≈ 21.4 (plain mean: 23.7).
 */
export function robustGaussianMean(values: number[], sigmaFloor: number = GAUSSIAN_SIGMA_MIN_TEMP): number {
  if (values.length === 0) return NaN;
  if (values.length === 1) return values[0];

  const med = median(values);
  const deviations = values.map((v) => Math.abs(v - med));
  const mad = median(deviations);
  const sigma = Math.max(mad * 1.4826, sigmaFloor);

  let weightedSum = 0;
  let totalWeight = 0;
  for (const v of values) {
    const w = Math.exp(-0.5 * ((v - med) / sigma) ** 2);
    weightedSum += v * w;
    totalWeight += w;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : med;
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function valueAt(fetch: FetchResult, h: number, key: HourlySeriesKey): number | null {
  if (fetch.activeRange && (h < fetch.activeRange.startH || h >= fetch.activeRange.endH)) {
    return null;
  }
  const v = fetch.series[key]?.[h];
  return v === undefined ? null : v;
}

// ────────────────────────────────────────────────────────────
// INTERNAL
// ────────────────────────────────────────────────────────────

function fetchesValidAt(fetches: FetchResult[], h: number, key: HourlySeriesKey): FetchResult[] {
  return fetches.filter((f) => valueAt(f, h, key) !== null);
}

function valuesAt(fetches: FetchResult[], h: number, key: HourlySeriesKey): number[] {
  const values: number[] = [];
  for (const f of fetches) {
    const v = valueAt(f, h, key);
    if (v !== null) values.push(v);
  }
  return values;
}

function poolValuesAt(
  tiered: TieredFetches,
  h: number,
  key: HourlySeriesKey,
  poolMode: PoolMode = 'expansion'
): { values: number[]; pool: AggregatedPoint['pool'] } {
  const { fetches, pool } = poolFetchesAt(tiered, h, key, poolMode);
  return { values: valuesAt(fetches, h, key), pool };
}

function aggregateValues(
  values: number[],
  options: Pick<ProgressiveOptions, 'strategy' | 'sigmaFloor' | 'key'>
): { value: number; method: AggregatedPoint['method'] } {
  if (values.length === 1) return { value: values[0], method: 'single' };

  if (options.strategy === 'median') {
    return { value: median(values), method: 'median' };
  }

  if (values.length >= 4) {
    return { value: winsorizedMean(values), method: 'winsorized' };
  }
  return { value: robustGaussianMean(values, options.sigmaFloor), method: 'gaussian' };
}

function simpleMean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}
