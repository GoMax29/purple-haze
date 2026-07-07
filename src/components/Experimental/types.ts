export type Tier = 'short' | 'mid' | 'long';

export type FetchStatus = 'success' | 'no_data' | 'out_of_coverage' | 'error' | 'skipped';

export interface ModelDefinition {
  id: string;
  name: string;
  provider: string;
  providerFlag: string;
  resolution_km: number;
  forecast_hours: number;
  tier: Tier;
  family: string;
  bounds: [[number, number], [number, number]] | null;
  isAI: boolean;
  isGlobal: boolean;
  region?: string;
  color: string;
}

export interface SeamlessEndpoint {
  id: string;
  name: string;
  provider: string;
  providerFlag: string;
  family: string;
  apiModel: string;
  resolution_km: number;
  forecast_hours: number;
  tier: Tier;
  isAI: boolean;
  isGlobal: boolean;
  regions: string[];
}

export interface BboxResult {
  model: ModelDefinition;
  inBounds: boolean;
}

export interface FetchResult {
  endpoint: SeamlessEndpoint;
  status: FetchStatus;
  dataPoints: number;
  error?: string;
  temperatures: (number | null)[];
  times?: string[];
  fetchDurationMs?: number;
}

export interface FamilyGroup {
  family: string;
  familyLabel: string;
  kept: FetchResult;
  removed: FetchResult[];
}

export interface TierSelection {
  tier: Tier;
  label: string;
  models: FetchResult[];
  fallbacks: FetchResult[];
  independentFamilies: number;
  algorithm: AlgorithmChoice;
}

export interface AlgorithmChoice {
  name: string;
  description: string;
  icon: string;
}

export interface OutlierResult {
  endpoint: SeamlessEndpoint;
  meanTemp: number;
  spreadFromConsensus: number;
  kept: boolean;
  reason?: string;
}

export interface AggregatedPoint {
  hour: number;
  datetime: string;
  value: number;
  min: number;
  max: number;
  modelCount: number;
}

export interface TrendPoint {
  hour: number;
  datetime: string;
  central: number;
  upper: number;
  lower: number;
}

export interface PipelineState {
  latitude: number;
  longitude: number;
  bboxResults: BboxResult[];
  fetchResults: FetchResult[];
  familyGroups: FamilyGroup[];
  tierSelections: TierSelection[];
  outlierResults: OutlierResult[];
  aggregation: AggregatedPoint[];
  trendClassic: TrendPoint[];
  trendAI: TrendPoint[];
  loading: boolean;
  currentStep: number;
  error?: string;
}
