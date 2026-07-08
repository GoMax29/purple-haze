import { ModelDefinition, MeshTier, DedupExclusion, CascadeGroup, ActiveRange } from '../types';

export interface ExplicitDedupResult {
  kept: ModelDefinition[];
  exclusions: DedupExclusion[];
}

export interface CascadeDetectionResult {
  cascades: CascadeGroup[];
  /** modelId → active hour range (only set for cascade members) */
  activeRanges: Record<string, ActiveRange>;
}

/**
 * Explicit dedup rules (hard-coded, per algorithm design), applied on the
 * FULL candidate list before resolution classification — some rules are
 * cross-tier (DINI is fine mesh, KNMI EU is medium mesh):
 *
 *  - AROME France dropped when AROME France HD is present (same MF run, HD finer).
 *  - KNMI HARMONIE EU dropped when DMI HARMONIE DINI is present (same HARMONIE
 *    code, DINI finer with a larger domain). KNMI EU is kept as a fetch-failure
 *    fallback for DINI (see validateAndFallback).
 */
export function applyExplicitDedup(models: ModelDefinition[]): ExplicitDedupResult {
  const exclusions: DedupExclusion[] = [];
  const ids = new Set(models.map((m) => m.id));

  let kept = [...models];

  if (ids.has('arome_france') && ids.has('arome_france_hd')) {
    const excluded = kept.find((m) => m.id === 'arome_france')!;
    kept = kept.filter((m) => m.id !== 'arome_france');
    exclusions.push({
      excluded,
      reason: 'AROME France HD (1.5 km) couvre le même domaine en plus fin',
    });
  }

  if (ids.has('knmi_europe') && ids.has('dmi_harmonie')) {
    const excluded = kept.find((m) => m.id === 'knmi_europe')!;
    kept = kept.filter((m) => m.id !== 'knmi_europe');
    exclusions.push({
      excluded,
      reason: 'DMI HARMONIE DINI (2 km) couvre la même zone en plus fin',
      fallbackFor: 'dmi_harmonie',
    });
  }

  return { kept, exclusions };
}

/**
 * Intra-provider cascade ("seamless maison") within one mesh tier: models
 * sharing family + provider occupy ONE slot. The finest is active first;
 * when it expires the next one takes over (e.g. ICON CH1 H0-33 → CH2 H33-120,
 * ICON-EU H0-120 → ICON Global H120-180).
 */
export function detectCascades(
  models: ModelDefinition[],
  meshTier: MeshTier
): CascadeDetectionResult {
  const cascades: CascadeGroup[] = [];
  const activeRanges: Record<string, ActiveRange> = {};

  const byProviderFamily = new Map<string, ModelDefinition[]>();
  for (const model of models) {
    const key = `${model.provider}::${model.family}`;
    if (!byProviderFamily.has(key)) byProviderFamily.set(key, []);
    byProviderFamily.get(key)!.push(model);
  }

  for (const members of Array.from(byProviderFamily.values())) {
    if (members.length < 2) continue;

    const sorted = [...members].sort((a, b) => a.resolution_km - b.resolution_km);
    const ranges: Record<string, ActiveRange> = {};
    let cursor = 0;

    for (const member of sorted) {
      if (member.forecast_hours <= cursor) {
        // Member expires before its turn (fully shadowed) — inactive
        ranges[member.id] = { startH: 0, endH: 0 };
        continue;
      }
      ranges[member.id] = { startH: cursor, endH: member.forecast_hours };
      cursor = member.forecast_hours;
    }

    cascades.push({
      provider: sorted[0].provider,
      family: sorted[0].family,
      meshTier,
      models: sorted,
      activeRanges: ranges,
    });
    Object.assign(activeRanges, ranges);
  }

  return { cascades, activeRanges };
}
