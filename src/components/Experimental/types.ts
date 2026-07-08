// ────────────────────────────────────────────────────────────
// Experimental Weather Engine v2 — types
// Individual-model pipeline (no seamless).
// ────────────────────────────────────────────────────────────

/** Mesh resolution tier: fine < 5 km, medium 5–11 km (incl.), large > 11 km */
export type MeshTier = 'fine' | 'medium' | 'large';

export type FetchStatus = 'success' | 'no_data' | 'out_of_coverage' | 'error' | 'skipped';

/** Hourly series fetched from Open-Meteo for every model (single request) */
export const HOURLY_VARS = [
  'temperature_2m',
  'relative_humidity_2m',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_gusts_10m',
  'wind_direction_10m',
] as const;

export type HourlySeriesKey = (typeof HOURLY_VARS)[number];

/** User-facing variable tabs */
export type WeatherVariable = 'temperature' | 'precipitation' | 'humidity' | 'wind' | 'sky';

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  providerFlag: string;
  /** Exact model name for the Open-Meteo `models=` query parameter */
  apiModel: string;
  resolution_km: number;
  forecast_hours: number;
  family: string;
  /** [[lat_min, lon_min], [lat_max, lon_max]] or null for global coverage */
  bounds: [[number, number], [number, number]] | null;
  isAI: boolean;
  isGlobal: boolean;
  /** Statistical blends (NBM) are never aggregated — displayed as reference only */
  excludeFromAggregation?: boolean;
  color: string;
}

export interface BboxResult {
  model: ModelDefinition;
  inBounds: boolean;
}

/** Hour range during which a model contributes to the aggregation pool */
export interface ActiveRange {
  startH: number;
  endH: number;
}

export interface FetchResult {
  model: ModelDefinition;
  status: FetchStatus;
  /** Non-null temperature points (primary validity indicator) */
  dataPoints: number;
  /** All hourly series returned by the single Open-Meteo request */
  series: Partial<Record<HourlySeriesKey, (number | null)[]>>;
  times?: string[];
  fetchDurationMs?: number;
  error?: string;
  /** Set by intra-provider cascade logic; undefined = active over full horizon */
  activeRange?: ActiveRange;
}

/** Result of the targeted dedup step (hard-coded exclusion rules) */
export interface DedupExclusion {
  excluded: ModelDefinition;
  reason: string;
  /** If the winner fails at fetch time, this model may be reinstated */
  fallbackFor?: string;
}

/** Intra-provider cascade: same family + provider, finest active first */
export interface CascadeGroup {
  provider: string;
  family: string;
  meshTier: MeshTier;
  /** Sorted finest first */
  models: ModelDefinition[];
  /** modelId → hour range where that member is the active voice */
  activeRanges: Record<string, ActiveRange>;
}

/** Models selected for one mesh tier after dedup + cascade + cap */
export interface TierSelection {
  meshTier: MeshTier;
  label: string;
  models: ModelDefinition[];
  /** Dropped by the 5-model cap */
  dropped: ModelDefinition[];
  /** Filtered out by the regional filter */
  regionFiltered: ModelDefinition[];
  independentFamilies: number;
}

export interface AggregatedPoint {
  hour: number;
  datetime: string;
  value: number;
  min: number;
  max: number;
  modelCount: number;
  /** Which pool produced this point (for UI display) */
  pool?: 'fine' | 'fine+medium' | 'medium' | 'medium+large' | 'mixed';
  /** Aggregation method used at this hour */
  method?: 'winsorized' | 'gaussian' | 'single' | 'median' | 'vote' | 'vector';
  /** Precipitation only: share of models predicting > 0.1 mm this hour (0–1) */
  wetFraction?: number;
}

/** Aggregations for every variable, produced by one pipeline run */
export interface VariableAggregations {
  temperature: AggregatedPoint[];
  humidity: AggregatedPoint[];
  precipitation: AggregatedPoint[];
  windSpeed: AggregatedPoint[];
  windGusts: AggregatedPoint[];
  windDirection: AggregatedPoint[];
  wmo: AggregatedPoint[];
}

export interface TrendPoint {
  hour: number;
  datetime: string;
  central: number;
  upper: number;
  lower: number;
}
