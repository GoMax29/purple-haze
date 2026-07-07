import { FetchResult, OutlierResult } from '../types';

// A model is rejected if EITHER condition is met over the 0–120h analysis window:
//   (1) mean absolute deviation from consensus > MEAN_SPREAD_THRESHOLD
//   (2) any single hour deviates more than MAX_SINGLE_DEVIATION
//
// Extending the window from 48h → 120h catches models that look fine in the
// first two days but degrade significantly by J3–J5 (e.g. UKMO cold-bias episodes).
const MEAN_SPREAD_THRESHOLD = 4.0;    // degrees Celsius — mean MAD
const MAX_SINGLE_DEVIATION = 8.0;     // degrees Celsius — single-hour hard spike
const ANALYSIS_HOURS_LIMIT = 120;     // horizon used for QC (5 days)
const MIN_HOURS_FOR_ANALYSIS = 48;    // minimum valid data required to score a model

/**
 * QC Layer 1: filters models whose temperature deviates excessively from the
 * hourly consensus (median of all models) over the first 0–120h window.
 *
 * Two independent rejection conditions:
 *  - Mean absolute deviation (MAD) > 4°C across the window
 *  - Any single hour exceeds 8°C from consensus (spike filter)
 */
export function filterOutliers(
  fetchResults: FetchResult[],
  options?: { spreadThreshold?: number; maxSingleDeviation?: number }
): OutlierResult[] {
  const threshold = options?.spreadThreshold ?? MEAN_SPREAD_THRESHOLD;
  const spikeThreshold = options?.maxSingleDeviation ?? MAX_SINGLE_DEVIATION;

  if (fetchResults.length <= 1) {
    return fetchResults.map((f) => ({
      endpoint: f.endpoint,
      meanTemp: computeMean(f.temperatures),
      spreadFromConsensus: 0,
      kept: true,
      reason: 'Single model — no filtering possible',
    }));
  }

  // Determine how many hours to analyse (capped at model's actual data length)
  const maxHours = Math.max(...fetchResults.map((f) => f.temperatures.length));
  const analysisHours = Math.min(maxHours, ANALYSIS_HOURS_LIMIT);

  // Build hourly median consensus
  const consensus: number[] = [];
  for (let h = 0; h < analysisHours; h++) {
    const values = fetchResults
      .map((f) => f.temperatures[h])
      .filter((v): v is number => v !== null);
    consensus.push(values.length > 0 ? median(values) : NaN);
  }

  return fetchResults.map((f) => {
    const temps = f.temperatures;
    let totalDev = 0;
    let maxDev = 0;
    let count = 0;

    const windowEnd = Math.min(analysisHours, temps.length);

    for (let h = 0; h < windowEnd; h++) {
      const t = temps[h];
      const c = consensus[h];
      if (t !== null && t !== undefined && !isNaN(c)) {
        const dev = Math.abs(t - c);
        totalDev += dev;
        if (dev > maxDev) maxDev = dev;
        count++;
      }
    }

    const meanDev = count >= MIN_HOURS_FOR_ANALYSIS ? totalDev / count : 0;
    const meanTemp = computeMean(temps, analysisHours);

    // Reject if mean deviation OR max single-hour deviation exceeds thresholds
    const meetsThreshold = count >= MIN_HOURS_FOR_ANALYSIS;
    const failsMean = meetsThreshold && meanDev > threshold;
    const failsSpike = meetsThreshold && maxDev > spikeThreshold;
    const kept = !failsMean && !failsSpike;

    let reason: string | undefined;
    if (failsSpike) {
      reason = `Pic max ${maxDev.toFixed(1)}° > seuil ${spikeThreshold}° (H0–${windowEnd}h)`;
    } else if (failsMean) {
      reason = `MAD moyen ${meanDev.toFixed(1)}° > seuil ${threshold}° (H0–${windowEnd}h)`;
    } else if (!meetsThreshold) {
      reason = `Données insuffisantes (${count}h < ${MIN_HOURS_FOR_ANALYSIS}h)`;
    }

    return {
      endpoint: f.endpoint,
      meanTemp,
      spreadFromConsensus: meanDev,
      kept,
      reason,
    };
  });
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function computeMean(temps: (number | null)[], maxHours?: number): number {
  const slice = maxHours != null ? temps.slice(0, maxHours) : temps;
  const valid = slice.filter((t): t is number => t !== null);
  if (valid.length === 0) return NaN;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}
