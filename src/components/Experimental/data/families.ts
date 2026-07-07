import { SeamlessEndpoint } from '../types';

export type Region = 'europe' | 'americas' | 'asia' | 'oceania' | 'other';

/**
 * Determines the geographic region of a point.
 * Used to select which seamless endpoints are relevant for Phase 1 fetch.
 * Logic mirrored from model-coverage.html getRegion().
 */
export function getRegion(lat: number, lon: number): Region {
  if (lon < -25) return 'americas';
  if (lat > 25 && lon >= -25 && lon < 55) return 'europe';
  if (lon >= 55 && lon <= 160) return 'asia';
  if (lat < -10 && lon > 100) return 'oceania';
  return 'other';
}

/**
 * All 14 seamless endpoints with region assignments.
 * `regions` indicates where the endpoint is relevant for Phase 1 fetch.
 * 'universal' means always fetched regardless of location.
 */
export const SEAMLESS_ENDPOINTS: SeamlessEndpoint[] = [
  // --- NWP families (seamless) ---
  {
    id: 'dwd_icon_seamless',
    name: 'ICON Seamless',
    provider: 'dwd',
    providerFlag: '🇩🇪',
    family: 'icon',
    apiModel: 'icon_seamless',
    resolution_km: 2,
    forecast_hours: 180,
    tier: 'short',
    isAI: false,
    isGlobal: true,
    regions: ['europe', 'universal'],
  },
  {
    id: 'ncep_gfs_seamless',
    name: 'GFS Seamless',
    provider: 'noaa',
    providerFlag: '🇺🇸',
    family: 'gfs',
    apiModel: 'gfs_seamless',
    resolution_km: 13,
    forecast_hours: 384,
    tier: 'long',
    isAI: false,
    isGlobal: true,
    regions: ['universal'],
  },
  {
    id: 'gem_seamless',
    name: 'GEM Seamless',
    provider: 'cmc',
    providerFlag: '🇨🇦',
    family: 'gem',
    apiModel: 'gem_seamless',
    resolution_km: 2.5,
    forecast_hours: 240,
    tier: 'mid',
    isAI: false,
    isGlobal: true,
    regions: ['europe', 'americas'],
  },
  {
    id: 'meteofrance_seamless',
    name: 'Météo-France Seamless',
    provider: 'mf',
    providerFlag: '🇫🇷',
    family: 'arpege',
    apiModel: 'meteofrance_seamless',
    resolution_km: 1.5,
    forecast_hours: 96,
    tier: 'short',
    isAI: false,
    isGlobal: false,
    regions: ['europe'],
  },
  {
    id: 'ukmo_seamless',
    name: 'UKMO Seamless',
    provider: 'ukmo',
    providerFlag: '🇬🇧',
    family: 'ukmo',
    apiModel: 'ukmo_seamless',
    resolution_km: 2,
    forecast_hours: 168,
    tier: 'short',
    isAI: false,
    isGlobal: true,
    regions: ['europe'],
  },
  {
    id: 'jma_seamless',
    name: 'JMA Seamless',
    provider: 'jma',
    providerFlag: '🇯🇵',
    family: 'jma',
    apiModel: 'jma_seamless',
    resolution_km: 5,
    forecast_hours: 264,
    tier: 'long',
    isAI: false,
    isGlobal: true,
    regions: ['asia'],
  },
  {
    id: 'kma_seamless',
    name: 'KMA Seamless',
    provider: 'kma',
    providerFlag: '🇰🇷',
    family: 'kma',
    apiModel: 'kma_seamless',
    resolution_km: 1.5,
    forecast_hours: 288,
    tier: 'long',
    isAI: false,
    isGlobal: false,
    regions: ['asia'],
  },
  {
    id: 'ecmwf_ifs',
    name: 'IFS HRES',
    provider: 'ecmwf',
    providerFlag: '🇪🇺',
    family: 'ifs',
    apiModel: 'ecmwf_ifs',
    resolution_km: 9,
    forecast_hours: 360,
    tier: 'mid',
    isAI: false,
    isGlobal: true,
    regions: ['universal'],
  },
  {
    id: 'ecmwf_ifs025',
    name: 'IFS 0.25°',
    provider: 'ecmwf',
    providerFlag: '🇪🇺',
    family: 'ifs',
    apiModel: 'ecmwf_ifs025',
    resolution_km: 25,
    forecast_hours: 360,
    tier: 'long',
    isAI: false,
    isGlobal: true,
    regions: ['universal'],
  },
  {
    id: 'cma_grapes_global',
    name: 'GRAPES Global',
    provider: 'cma',
    providerFlag: '🇨🇳',
    family: 'cma',
    apiModel: 'cma_grapes_global',
    resolution_km: 13,
    forecast_hours: 240,
    tier: 'long',
    isAI: false,
    isGlobal: true,
    regions: ['asia'],
  },
  {
    id: 'bom_access_global',
    name: 'ACCESS-G',
    provider: 'bom',
    providerFlag: '🇦🇺',
    family: 'bom',
    apiModel: 'bom_access_global',
    resolution_km: 15,
    forecast_hours: 240,
    tier: 'long',
    isAI: false,
    isGlobal: true,
    regions: ['oceania'],
  },
  // --- AI / Hybrid (always fetched) ---
  {
    id: 'ecmwf_aifs025_single',
    name: 'AIFS 0.25°',
    provider: 'ecmwf',
    providerFlag: '🇪🇺',
    family: 'aifs',
    apiModel: 'ecmwf_aifs025_single',
    resolution_km: 25,
    forecast_hours: 360,
    tier: 'long',
    isAI: true,
    isGlobal: true,
    regions: ['universal'],
  },
  {
    id: 'ncep_aigfs025',
    name: 'AIGFS 0.25°',
    provider: 'noaa',
    providerFlag: '🇺🇸',
    family: 'aigfs',
    apiModel: 'ncep_aigfs025',
    resolution_km: 25,
    forecast_hours: 384,
    tier: 'long',
    isAI: true,
    isGlobal: true,
    regions: ['universal'],
  },
  {
    id: 'ncep_hgefs025_ensemble_mean',
    name: 'HGEFS Ens. Mean',
    provider: 'noaa',
    providerFlag: '🇺🇸',
    family: 'hgefs',
    apiModel: 'ncep_hgefs025_ensemble_mean',
    resolution_km: 25,
    forecast_hours: 240,
    tier: 'long',
    isAI: true,
    isGlobal: true,
    regions: ['universal'],
  },
];

/**
 * Returns the endpoints to fetch for Phase 1 (region-matched + universal).
 * Phase 1 endpoints are those whose `regions` array includes 'universal'
 * or includes the detected region for the given coordinates.
 */
export function getPhase1Endpoints(lat: number, lon: number): SeamlessEndpoint[] {
  const region = getRegion(lat, lon);
  return SEAMLESS_ENDPOINTS.filter(
    (ep) => ep.regions.includes('universal') || ep.regions.includes(region)
  );
}

/**
 * Returns additional endpoints for Phase 2 fallback — those NOT already
 * included in Phase 1 for this region.
 */
export function getPhase2Endpoints(lat: number, lon: number): SeamlessEndpoint[] {
  const phase1Ids = new Set(getPhase1Endpoints(lat, lon).map((ep) => ep.id));
  return SEAMLESS_ENDPOINTS.filter((ep) => !phase1Ids.has(ep.id));
}

export const AI_ENDPOINT_IDS = [
  'ecmwf_aifs025_single',
  'ncep_aigfs025',
  'ncep_hgefs025_ensemble_mean',
];

export const MIN_INDEPENDENT_FAMILIES = 4;

export const TIER_CONFIG = {
  short: { min: 0, max: 48, label: 'Court terme (0–48 h)' },
  mid: { min: 48, max: 120, label: 'Moyen terme (48–120 h)' },
  long: { min: 120, max: Infinity, label: 'Long terme (120 h +)' },
} as const;
