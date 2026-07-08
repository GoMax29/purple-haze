import { ModelDefinition, CascadeGroup } from '../types';
import { MAX_MODELS_PER_TIER } from '../data/families';

export interface TierCapResult {
  kept: ModelDefinition[];
  dropped: ModelDefinition[];
}

/**
 * Caps a tier at MAX_MODELS_PER_TIER slots, maximising family diversity.
 *
 * A cascade group (same provider + family, e.g. ICON CH1→CH2) counts as
 * ONE slot: capping keeps or drops the whole group.
 *
 * Slot selection:
 *  1. One unit per family, finest resolution first (diversity guarantee).
 *  2. Remaining slots filled by finest resolution regardless of family.
 */
export function capModelsPerTier(
  models: ModelDefinition[],
  cascades: CascadeGroup[],
  maxSlots: number = MAX_MODELS_PER_TIER
): TierCapResult {
  // Build units: cascade groups = 1 unit, standalone models = 1 unit each
  const cascadeMemberIds = new Set(
    cascades.flatMap((c) => c.models.map((m) => m.id))
  );

  interface Unit {
    family: string;
    resolution: number; // finest member
    members: ModelDefinition[];
  }

  const units: Unit[] = [];

  for (const cascade of cascades) {
    const members = cascade.models.filter((m) => models.some((x) => x.id === m.id));
    if (members.length === 0) continue;
    units.push({
      family: cascade.family,
      resolution: Math.min(...members.map((m) => m.resolution_km)),
      members,
    });
  }

  for (const model of models) {
    if (cascadeMemberIds.has(model.id)) continue;
    units.push({ family: model.family, resolution: model.resolution_km, members: [model] });
  }

  if (units.length <= maxSlots) {
    return { kept: units.flatMap((u) => u.members), dropped: [] };
  }

  units.sort((a, b) => a.resolution - b.resolution);

  const selected: Unit[] = [];
  const seenFamilies = new Set<string>();

  // Pass 1: one unit per family (finest first)
  for (const unit of units) {
    if (selected.length >= maxSlots) break;
    if (seenFamilies.has(unit.family)) continue;
    seenFamilies.add(unit.family);
    selected.push(unit);
  }

  // Pass 2: fill remaining slots by resolution
  for (const unit of units) {
    if (selected.length >= maxSlots) break;
    if (selected.includes(unit)) continue;
    selected.push(unit);
  }

  const keptIds = new Set(selected.flatMap((u) => u.members.map((m) => m.id)));
  return {
    kept: models.filter((m) => keptIds.has(m.id)),
    dropped: models.filter((m) => !keptIds.has(m.id)),
  };
}
