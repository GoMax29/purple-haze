import { ModelDefinition, MeshTier } from '../types';
import { getMeshTier } from '../data/families';

export interface ResolutionClassification {
  fine: ModelDefinition[];
  medium: ModelDefinition[];
  large: ModelDefinition[];
}

/**
 * Splits NWP models into mesh tiers by native resolution:
 * fine < 5 km, medium 5–11 km (inclusive), large > 11 km.
 * AI models and excluded blends (NBM) are not classified here —
 * they are handled by dedicated paths in the pipeline.
 */
export function classifyByResolution(models: ModelDefinition[]): ResolutionClassification {
  const result: ResolutionClassification = { fine: [], medium: [], large: [] };

  for (const model of models) {
    if (model.isAI || model.excludeFromAggregation) continue;
    result[getMeshTier(model.resolution_km)].push(model);
  }

  for (const tier of Object.keys(result) as MeshTier[]) {
    result[tier].sort((a, b) => a.resolution_km - b.resolution_km);
  }

  return result;
}
