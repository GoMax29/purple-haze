/**
 * Probabilité simplifiée de précipitation (PoP) suivant la formule fournie.
 */

export function computePoP(
  { totalModels, wetCount, mmAgg, forecastHour },
  config
) {
  const prob = config.probability_params || {};
  const a = typeof prob.a === "number" ? prob.a : 0.6;
  const b = typeof prob.b === "number" ? prob.b : 0.3;
  const c = typeof prob.c === "number" ? prob.c : 0.1;
  const neutral = typeof prob.neutral_mm === "number" ? prob.neutral_mm : 0.3;
  const mmMax = typeof prob.mm_max === "number" ? prob.mm_max : 3;
  const eps = typeof prob.epsilon === "number" ? prob.epsilon : 0.001;
  const dayDecay =
    typeof prob.day_decay_per_day === "number" ? prob.day_decay_per_day : 0.025;

  // proportion de modèles mouillant
  const prop = totalModels > 0 ? wetCount / totalModels : 0;

  // D'(mm) basé sur le log et la zone neutre
  const denom = Math.log(mmMax + eps) - Math.log(neutral + eps);
  const numer = Math.log(mmAgg + eps) - Math.log(neutral + eps);
  const Dp = denom !== 0 ? Math.max(-1, Math.min(1, numer / denom)) : 0;

  // Poids d'échéance (jour 1 = 1.0, -0.025/jour)
  const dayIndex = Math.max(0, Math.floor(forecastHour / 24));
  const wEcheance = Math.max(0, 1 - dayDecay * dayIndex);

  const PoP = Math.max(
    0,
    Math.min(100, Math.round(100 * (a * prop + b * Dp + c * wEcheance)))
  );
  return PoP;
}






























