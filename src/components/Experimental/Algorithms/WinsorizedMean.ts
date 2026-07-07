import { FetchResult, AggregatedPoint, TrendPoint } from '../types';

const TRIM_PERCENT = 0.2;
const TREND_K = 1.0;

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────

/**
 * Aggregates temperature data from multiple models using winsorised mean.
 * All hours from 0 to maxHours are included.
 */
export function aggregateTemperature(
  fetchResults: FetchResult[],
  times?: string[]
): AggregatedPoint[] {
  if (fetchResults.length === 0) return [];
  const maxHours = Math.max(...fetchResults.map((f) => f.temperatures.length));
  return aggregateRange(fetchResults, 0, maxHours, times);
}

/**
 * Aggregates temperatures for a specific hour range [startH, endH).
 * Useful for per-tier aggregation where each tier uses a different model set.
 */
export function aggregateTemperatureRange(
  fetchResults: FetchResult[],
  startH: number,
  endH: number,
  times?: string[]
): AggregatedPoint[] {
  if (fetchResults.length === 0) return [];
  return aggregateRange(fetchResults, startH, endH, times);
}

/**
 * Builds a unified NWP consensus series respecting tier boundaries:
 *   - H 0..47   → shortModels
 *   - H 48..119 → midModels
 *   - H 120+    → longModels (up to maxHour)
 *
 * This ensures GFS (tier=long) and IFS (tier=mid) do not pollute the
 * short-term consensus, matching what Étape 4 reports.
 */
export function aggregateTemperatureByTier(
  shortModels: FetchResult[],
  midModels: FetchResult[],
  longModels: FetchResult[],
  maxHour: number,
  times?: string[]
): AggregatedPoint[] {
  return [
    ...aggregateRange(shortModels, 0, 48, times),
    ...aggregateRange(midModels, 48, 120, times),
    ...aggregateRange(longModels, 120, maxHour, times),
  ];
}

/**
 * Computes a trend band (central ± σ) for H+240 to H+maxHours.
 * Only includes models that have non-null data beyond H+240.
 */
export function computeTrendBand(fetchResults: FetchResult[]): TrendPoint[] {
  if (fetchResults.length === 0) return [];

  const startHour = 240;
  const longRangeModels = fetchResults.filter((f) => {
    if (f.temperatures.length <= startHour) return false;
    return f.temperatures.slice(startHour).some((v) => v !== null);
  });

  if (longRangeModels.length === 0) return [];

  const maxHours = Math.max(...longRangeModels.map((f) => f.temperatures.length));
  const points: TrendPoint[] = [];

  for (let h = startHour; h < maxHours; h++) {
    const values = longRangeModels
      .map((f) => f.temperatures[h])
      .filter((v): v is number => v !== null);

    if (values.length < 2) continue;

    const central =
      values.length >= 4 ? winsorizedMean(values, TRIM_PERCENT) : simpleMean(values);
    const std = standardDeviation(values, central);

    points.push({
      hour: h,
      datetime: `H+${h}`,
      central: Math.round(central * 10) / 10,
      upper: Math.round((central + TREND_K * std) * 10) / 10,
      lower: Math.round((central - TREND_K * std) * 10) / 10,
    });
  }

  return points;
}

// ────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ────────────────────────────────────────────────────────────

function aggregateRange(
  fetchResults: FetchResult[],
  startH: number,
  endH: number,
  times?: string[]
): AggregatedPoint[] {
  if (fetchResults.length === 0) return [];

  // Use the times array from the first result that has one, or the explicit arg
  const refTimes = times ?? fetchResults.find((f) => f.times?.length)?.times;

  const points: AggregatedPoint[] = [];

  for (let h = startH; h < endH; h++) {
    const values = fetchResults
      .map((f) => f.temperatures[h])
      .filter((v): v is number => v !== null && v !== undefined);

    if (values.length === 0) continue;

    const value =
      values.length >= 4 ? winsorizedMean(values, TRIM_PERCENT) : simpleMean(values);

    const sorted = [...values].sort((a, b) => a - b);

    points.push({
      hour: h,
      datetime: refTimes?.[h] ?? `H+${h}`,
      value: Math.round(value * 10) / 10,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      modelCount: values.length,
    });
  }

  return points;
}

function winsorizedMean(values: number[], trimPercent: number): number {
  if (values.length <= 2) return simpleMean(values);

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

function simpleMean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function standardDeviation(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}
