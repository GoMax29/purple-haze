import { ModelDefinition, BboxResult, MeshTier } from '../types';
import { INDIVIDUAL_MODELS } from '../data/models';
import { getMeshTier } from '../data/families';

function isInBbox(
  lat: number,
  lon: number,
  bounds: [[number, number], [number, number]]
): boolean {
  const [min, max] = bounds;
  return lat >= min[0] && lat <= max[0] && lon >= min[1] && lon <= max[1];
}

export function resolveBoundingBoxes(lat: number, lon: number): BboxResult[] {
  return INDIVIDUAL_MODELS.map((model) => ({
    model,
    inBounds: model.bounds === null || isInBbox(lat, lon, model.bounds),
  }));
}

export function getModelsInBounds(lat: number, lon: number): ModelDefinition[] {
  return resolveBoundingBoxes(lat, lon)
    .filter((r) => r.inBounds)
    .map((r) => r.model);
}

export function countByMeshTier(
  results: BboxResult[]
): Record<MeshTier, { available: number; total: number }> {
  const counts: Record<MeshTier, { available: number; total: number }> = {
    fine: { available: 0, total: 0 },
    medium: { available: 0, total: 0 },
    large: { available: 0, total: 0 },
  };

  for (const r of results) {
    if (r.model.isAI || r.model.excludeFromAggregation) continue;
    const tier = getMeshTier(r.model.resolution_km);
    counts[tier].total += 1;
    if (r.inBounds) counts[tier].available += 1;
  }

  return counts;
}
