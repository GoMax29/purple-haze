import { FetchResult, FamilyGroup, TierSelection, Tier } from '../types';
import { TIER_CONFIG, MIN_INDEPENDENT_FAMILIES, AI_ENDPOINT_IDS } from '../data/families';
import { pickAlgorithm } from '../Algorithms/AlgorithmPicker';

const TIER_ORDER: Record<Tier, number> = { short: 0, mid: 1, long: 2 };
const TIERS: Tier[] = ['short', 'mid', 'long'];
const MAX_MODELS_PER_TIER = 5;

/**
 * Assigns models to tiers using each endpoint's natural `tier` field
 * as the earliest horizon where the model becomes relevant.
 *
 * Rules:
 * - AI models are NEVER eligible for short or mid tiers.
 * - A model with tier='short' → eligible for short + mid + long.
 * - A model with tier='mid'   → eligible for mid + long only.
 * - A model with tier='long'  → eligible for long only.
 * - Fallback adds just enough models to reach MIN_INDEPENDENT_FAMILIES (finest first).
 * - Each tier is capped at MAX_MODELS_PER_TIER (5) models, finest resolution first.
 */
export function selectModelsByTier(
  familyGroups: FamilyGroup[],
  _allSuccessful: FetchResult[]
): TierSelection[] {
  const keptModels = familyGroups.map((g) => g.kept);

  return TIERS.map((tier) => {
    const eligible = keptModels.filter((m) => {
      if (tier !== 'long' && AI_ENDPOINT_IDS.includes(m.endpoint.id)) return false;
      const naturalOrder = TIER_ORDER[m.endpoint.tier as Tier] ?? 0;
      const targetOrder = TIER_ORDER[tier];
      const coversHorizon = m.endpoint.forecast_hours > TIER_CONFIG[tier].min;
      return naturalOrder <= targetOrder && coversHorizon;
    });

    let selection = buildTierSelection(tier, eligible);

    if (selection.independentFamilies < MIN_INDEPENDENT_FAMILIES) {
      const existingFamilies = new Set(selection.models.map((m) => m.endpoint.family));
      const needed = MIN_INDEPENDENT_FAMILIES - selection.independentFamilies;

      const fallbackCandidates = keptModels
        .filter((m) => {
          if (tier !== 'long' && AI_ENDPOINT_IDS.includes(m.endpoint.id)) return false;
          const coversHorizon = m.endpoint.forecast_hours > TIER_CONFIG[tier].min;
          return coversHorizon && !existingFamilies.has(m.endpoint.family);
        })
        .sort((a, b) => a.endpoint.resolution_km - b.endpoint.resolution_km)
        .slice(0, needed);

      const combined = [...eligible, ...fallbackCandidates];
      selection = buildTierSelection(tier, combined);
      selection.fallbacks = fallbackCandidates;
    }

    if (selection.models.length > MAX_MODELS_PER_TIER) {
      selection.models = selection.models.slice(0, MAX_MODELS_PER_TIER);
      selection.independentFamilies = new Set(selection.models.map((m) => m.endpoint.family)).size;
      selection.algorithm = pickAlgorithm(selection.independentFamilies);
    }

    return selection;
  });
}

function buildTierSelection(
  tier: Tier,
  eligible: FetchResult[]
): TierSelection {
  const byFamily: Record<string, FetchResult> = {};
  for (const model of eligible) {
    const fam = model.endpoint.family;
    if (!byFamily[fam] || model.endpoint.resolution_km < byFamily[fam].endpoint.resolution_km) {
      byFamily[fam] = model;
    }
  }

  const primary = Object.values(byFamily);
  const independentFamilies = primary.length;
  const algorithm = pickAlgorithm(independentFamilies);

  return {
    tier,
    label: TIER_CONFIG[tier].label,
    models: primary.sort((a, b) => a.endpoint.resolution_km - b.endpoint.resolution_km),
    fallbacks: [],
    independentFamilies,
    algorithm,
  };
}
