/**
 * Describes the aggregation method used for a given pool size.
 * The actual choice happens per-hour inside Aggregation.ts.
 */
export function describeAlgorithm(poolSize: number): { name: string; description: string; icon: string } {
  if (poolSize >= 4) {
    return {
      name: 'winsorized_mean',
      description: `Moyenne winsorisée 20% (N=${poolSize})`,
      icon: '📊',
    };
  }
  if (poolSize >= 2) {
    return {
      name: 'gaussian_mean',
      description: `Gaussienne robuste (N=${poolSize})`,
      icon: '🔔',
    };
  }
  return {
    name: 'single_model',
    description: 'Modèle unique',
    icon: '🎯',
  };
}
