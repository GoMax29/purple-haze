import { AlgorithmChoice } from '../types';

/**
 * Selects the aggregation algorithm based on the number of independent families.
 * Mirrors the logic from model-coverage.html.
 */
export function pickAlgorithm(independentFamilies: number): AlgorithmChoice {
  if (independentFamilies >= 4) {
    return {
      name: 'winsorized_mean',
      description: `Winsorised Mean (N=${independentFamilies})`,
      icon: '📊',
    };
  }
  if (independentFamilies >= 2) {
    return {
      name: 'weighted_mean',
      description: `Weighted Mean (N=${independentFamilies})`,
      icon: '⚖️',
    };
  }
  if (independentFamilies === 1) {
    return {
      name: 'single_model',
      description: 'Single Model',
      icon: '🎯',
    };
  }
  return {
    name: 'best_match',
    description: 'Best Match (fallback)',
    icon: '🔄',
  };
}
