import { FetchResult, FamilyGroup } from '../types';
import { FAMILY_LABELS } from '../data/models';

/**
 * Deduplicates models by family: keeps only the model with the finest resolution
 * (lowest km) per family. This ensures each family has exactly one voice in the
 * aggregation, preventing family bias.
 */
export function deduplicateByFamily(fetchResults: FetchResult[]): FamilyGroup[] {
  const byFamily: Record<string, FetchResult[]> = {};

  for (const result of fetchResults) {
    const fam = result.endpoint.family;
    if (!byFamily[fam]) byFamily[fam] = [];
    byFamily[fam].push(result);
  }

  const groups: FamilyGroup[] = [];

  for (const [family, members] of Object.entries(byFamily)) {
    // Sort by resolution (finest first = lowest km)
    const sorted = [...members].sort(
      (a, b) => a.endpoint.resolution_km - b.endpoint.resolution_km
    );

    const kept = sorted[0];
    const removed = sorted.slice(1);

    groups.push({
      family,
      familyLabel: FAMILY_LABELS[family] || family,
      kept,
      removed,
    });
  }

  // Sort groups by resolution of kept model
  return groups.sort((a, b) => a.kept.endpoint.resolution_km - b.kept.endpoint.resolution_km);
}
