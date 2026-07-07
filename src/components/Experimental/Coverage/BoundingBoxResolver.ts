import { ModelDefinition, BboxResult } from '../types';
import { INDIVIDUAL_MODELS } from '../data/models';

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

export function countByTier(results: BboxResult[]): Record<string, { available: number; total: number }> {
  const tiers = ['short', 'mid', 'long'] as const;
  const counts: Record<string, { available: number; total: number }> = {};

  for (const tier of tiers) {
    const tierModels = results.filter((r) => r.model.tier === tier);
    counts[tier] = {
      available: tierModels.filter((r) => r.inBounds).length,
      total: tierModels.length,
    };
  }

  return counts;
}
