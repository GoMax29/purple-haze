import { ModelDefinition, MeshTier } from '../types';
import { Region, GLOBAL_PASS_MODEL_IDS, REGION_PROVIDERS } from '../data/families';

export interface RegionalFilterResult {
  kept: ModelDefinition[];
  filtered: ModelDefinition[];
}

/**
 * Regional filter for medium and large mesh models.
 *
 * Fine mesh models are never filtered: their bounding boxes already act
 * as a natural regional filter (no Japanese fine LAM covers Europe).
 *
 * Medium/large models pass if:
 *  - their provider belongs to the detected region, OR
 *  - they are global reference models (GFS, IFS HRES/0.25°, ICON Global,
 *    UKMO Global — the worldwide pass list), OR
 *  - they are AI models (aggregated separately anyway).
 */
export function filterByRegion(
  models: ModelDefinition[],
  region: Region,
  meshTier: MeshTier
): RegionalFilterResult {
  if (meshTier === 'fine') {
    return { kept: [...models], filtered: [] };
  }

  const localProviders = REGION_PROVIDERS[region] ?? [];
  const kept: ModelDefinition[] = [];
  const filtered: ModelDefinition[] = [];

  for (const model of models) {
    const passes =
      model.isAI ||
      GLOBAL_PASS_MODEL_IDS.includes(model.id) ||
      localProviders.includes(model.provider);
    (passes ? kept : filtered).push(model);
  }

  return { kept, filtered };
}
