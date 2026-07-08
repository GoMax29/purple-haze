import { MeshTier } from '../types';

export type Region = 'europe' | 'americas' | 'asia' | 'oceania' | 'other';

/**
 * Determines the geographic region of a point.
 * Used by the regional filter for medium/large mesh models
 * (fine mesh models are self-filtering via their bounding boxes).
 */
export function getRegion(lat: number, lon: number): Region {
  if (lon < -25) return 'americas';
  if (lat > 25 && lon >= -25 && lon < 55) return 'europe';
  if (lon >= 55 && lon <= 160) return 'asia';
  if (lat < -10 && lon > 100) return 'oceania';
  return 'other';
}

// ────────────────────────────────────────────────────────────
// Resolution classification
// fine < 5 km · medium 5–11 km (inclusive) · large > 11 km
// ────────────────────────────────────────────────────────────
export const RESOLUTION_THRESHOLDS = {
  fineMax: 5, // exclusive
  mediumMax: 11, // inclusive
} as const;

export function getMeshTier(resolutionKm: number): MeshTier {
  if (resolutionKm < RESOLUTION_THRESHOLDS.fineMax) return 'fine';
  if (resolutionKm <= RESOLUTION_THRESHOLDS.mediumMax) return 'medium';
  return 'large';
}

export const MESH_TIER_CONFIG: Record<MeshTier, { label: string; range: string }> = {
  fine: { label: 'Maille fine', range: '< 5 km' },
  medium: { label: 'Maille moyenne', range: '5–11 km' },
  large: { label: 'Maille large', range: '> 11 km' },
};

// ────────────────────────────────────────────────────────────
// Regional filter (medium + large mesh only)
// ────────────────────────────────────────────────────────────

/**
 * Global reference models that bypass the regional filter everywhere:
 * GFS, ECMWF IFS HRES + 0.25°, ICON Global, UKMO Global.
 * (AI models also bypass — handled via isAI flag.)
 */
export const GLOBAL_PASS_MODEL_IDS = [
  'gfs',
  'ecmwf_ifs_hres',
  'ecmwf_ifs025',
  'icon_global',
  'ukmo_global',
];

/** Providers considered "local" for each region (medium/large mesh filter) */
export const REGION_PROVIDERS: Record<Region, string[]> = {
  europe: ['dwd', 'mf', 'ukmo', 'dmi', 'knmi', 'metno', 'mch', 'arpae', 'ecmwf'],
  americas: ['noaa', 'cmc'],
  asia: ['jma', 'kma', 'cma'],
  oceania: ['bom'],
  other: [],
};

// ────────────────────────────────────────────────────────────
// Aggregation constants
// ────────────────────────────────────────────────────────────

export const MAX_MODELS_PER_TIER = 5;

/** Minimum pool size before merging with the next (coarser) tier */
export const MIN_POOL_SIZE = 3;

/**
 * Floor for the gaussian weighting sigma (temperature, °C).
 * With [20, 21, 30]: median=21, MAD-sigma≈1.5 → floored to 5.0,
 * giving w(30)≈0.20 and a result of ≈21.4 °C (outlier damped, not erased).
 */
export const GAUSSIAN_SIGMA_MIN_TEMP = 5.0;

/** Winsorized mean trim fraction (per side) for N >= 4 */
export const WINSORIZE_TRIM_PERCENT = 0.2;
