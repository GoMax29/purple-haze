import { AggregatedPoint, VariableAggregations } from '../types';
import {
  TieredFetches,
  aggregateProgressive,
  poolFetchesAt,
  valueAt,
  median,
} from './Aggregation';

/**
 * Sigma floors for the robust gaussian (N=2-3), in each variable's unit.
 * Chosen so moderate divergence keeps weight while clear outliers are damped.
 */
const SIGMA_FLOORS = {
  temperature: 5.0, // °C
  humidity: 15.0, // %
  windSpeed: 10.0, // km/h
  windGusts: 15.0, // km/h
} as const;

/**
 * Runs every per-variable aggregation over one pipeline result.
 *
 * Methods per variable:
 *  - temperature / humidity / wind speed / gusts: winsorized (N>=4) or
 *    robust gaussian (N=2-3) — continuous fields where consensus is physical
 *  - precipitation: MEDIAN — averaging shower amounts smears rain everywhere;
 *    the median answers "do most models see rain here, and how much?"
 *  - wind direction: circular vector mean weighted by each model's speed
 *    (355° and 5° must average to 0°, not 180°)
 *  - sky (WMO code): severity-group vote — codes are categories, any
 *    arithmetic mean is physically meaningless
 */
export function aggregateAllVariables(
  tiered: TieredFetches,
  maxHours: number,
  times?: string[]
): VariableAggregations {
  return {
    temperature: aggregateProgressive(tiered, maxHours, times, {
      key: 'temperature_2m',
      sigmaFloor: SIGMA_FLOORS.temperature,
    }),
    humidity: aggregateProgressive(tiered, maxHours, times, {
      key: 'relative_humidity_2m',
      sigmaFloor: SIGMA_FLOORS.humidity,
      clamp: [0, 100],
    }),
    precipitation: aggregateProgressive(tiered, maxHours, times, {
      key: 'precipitation',
      strategy: 'median',
      withWetFraction: true,
    }),
    windSpeed: aggregateProgressive(tiered, maxHours, times, {
      key: 'wind_speed_10m',
      sigmaFloor: SIGMA_FLOORS.windSpeed,
    }),
    windGusts: aggregateProgressive(tiered, maxHours, times, {
      key: 'wind_gusts_10m',
      sigmaFloor: SIGMA_FLOORS.windGusts,
    }),
    windDirection: aggregateWindDirection(tiered, maxHours, times),
    wmo: aggregateWmo(tiered, maxHours, times),
  };
}

// ────────────────────────────────────────────────────────────
// Wind direction — circular vector mean
// ────────────────────────────────────────────────────────────

function aggregateWindDirection(
  tiered: TieredFetches,
  maxHours: number,
  times?: string[]
): AggregatedPoint[] {
  const all = [...tiered.fine, ...tiered.medium, ...tiered.large];
  if (all.length === 0) return [];
  const refTimes = times ?? all.find((f) => f.times?.length)?.times;
  const points: AggregatedPoint[] = [];

  for (let h = 0; h < maxHours; h++) {
    const { fetches, pool } = poolFetchesAt(tiered, h, 'wind_direction_10m');

    let u = 0;
    let v = 0;
    let count = 0;
    for (const f of fetches) {
      const dir = valueAt(f, h, 'wind_direction_10m');
      if (dir === null) continue;
      // Weight by wind speed: a 40 km/h model matters more for direction
      // than a 3 km/h one (direction is noise at near-calm)
      const speed = valueAt(f, h, 'wind_speed_10m') ?? 1;
      const rad = (dir * Math.PI) / 180;
      u += speed * Math.sin(rad);
      v += speed * Math.cos(rad);
      count++;
    }
    if (count === 0) continue;

    const meanDir = ((Math.atan2(u, v) * 180) / Math.PI + 360) % 360;

    points.push({
      hour: h,
      datetime: refTimes?.[h] ?? `H+${h}`,
      value: Math.round(meanDir),
      min: Math.round(meanDir),
      max: Math.round(meanDir),
      modelCount: count,
      pool,
      method: 'vector',
    });
  }

  return points;
}

// ────────────────────────────────────────────────────────────
// WMO — severity-group vote
// ────────────────────────────────────────────────────────────

export interface WmoGroup {
  id: string;
  label: string;
  severity: number;
  codes: number[];
}

export const WMO_GROUPS: WmoGroup[] = [
  { id: 'clear', label: 'Clair / nuageux', severity: 0, codes: [0, 1, 2, 3] },
  { id: 'fog', label: 'Brouillard', severity: 1, codes: [45, 48] },
  { id: 'drizzle', label: 'Bruine', severity: 2, codes: [51, 53, 55, 56, 57] },
  { id: 'rain', label: 'Pluie', severity: 3, codes: [61, 63, 65, 66, 67] },
  { id: 'showers', label: 'Averses', severity: 4, codes: [80, 81, 82] },
  { id: 'snow', label: 'Neige', severity: 5, codes: [71, 73, 75, 77, 85, 86] },
  { id: 'thunder', label: 'Orage', severity: 6, codes: [95, 96, 99] },
];

export function wmoGroupOf(code: number): WmoGroup {
  return WMO_GROUPS.find((g) => g.codes.includes(code)) ?? WMO_GROUPS[0];
}

/**
 * Per-hour vote: each model votes for its code's severity group.
 * Winning group = most votes, ties broken by higher severity (safety first).
 * Representative code = median of the voters' codes inside the winning group.
 */
function aggregateWmo(
  tiered: TieredFetches,
  maxHours: number,
  times?: string[]
): AggregatedPoint[] {
  const all = [...tiered.fine, ...tiered.medium, ...tiered.large];
  if (all.length === 0) return [];
  const refTimes = times ?? all.find((f) => f.times?.length)?.times;
  const points: AggregatedPoint[] = [];

  for (let h = 0; h < maxHours; h++) {
    const { fetches, pool } = poolFetchesAt(tiered, h, 'weather_code');

    const codes: number[] = [];
    for (const f of fetches) {
      const c = valueAt(f, h, 'weather_code');
      if (c !== null) codes.push(c);
    }
    if (codes.length === 0) continue;

    const votes = new Map<string, number[]>();
    for (const code of codes) {
      const group = wmoGroupOf(code);
      if (!votes.has(group.id)) votes.set(group.id, []);
      votes.get(group.id)!.push(code);
    }

    let winner: { group: WmoGroup; members: number[] } | null = null;
    for (const [groupId, members] of Array.from(votes.entries())) {
      const group = WMO_GROUPS.find((g) => g.id === groupId)!;
      if (
        !winner ||
        members.length > winner.members.length ||
        (members.length === winner.members.length && group.severity > winner.group.severity)
      ) {
        winner = { group, members };
      }
    }

    const representative = Math.round(median(winner!.members));

    points.push({
      hour: h,
      datetime: refTimes?.[h] ?? `H+${h}`,
      value: representative,
      min: Math.min(...codes),
      max: Math.max(...codes),
      modelCount: codes.length,
      pool,
      method: 'vote',
    });
  }

  return points;
}
