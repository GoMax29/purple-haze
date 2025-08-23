/**
 * Agrégation des précipitations (mm) avec pondération gaussienne et log optionnel
 * Retourne, pour une heure, la quantité agrégée mm_agg, la liste des modèles mouillant,
 * le Consensus Index (CI) et l'IQR.
 */

function quantile(sortedValues, q) {
  if (!sortedValues.length) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedValues[base + 1] !== undefined) {
    return (
      sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base])
    );
  }
  return sortedValues[base];
}

export function aggregatePrecipMm(modelsValues, config) {
  const agg = config.aggregation_params || {};
  const wetThreshold =
    typeof agg.wet_threshold_mm === "number" ? agg.wet_threshold_mm : 0.0;
  const useLog = !!agg.use_log_transform;
  const eps = typeof agg.epsilon === "number" ? agg.epsilon : 0.001;
  const sigmaRatio =
    typeof agg.sigma_ratio === "number" ? agg.sigma_ratio : 0.2;

  // modelsValues: Array<{ modelKey, name, short, mm }>
  const wet = modelsValues.filter((v) => (v.mm ?? 0) > wetThreshold);

  // Liste mouillant
  const mouillant = wet.map((v) => ({
    model: v.short || v.modelKey,
    mm: v.mm,
  }));

  if (wet.length === 0) {
    return { mm_agg: 0, mouillant, CI: 0, IQR: 0 };
  }

  // Valeurs brutes pour CI/IQR
  const raw = wet.map((v) => v.mm).sort((a, b) => a - b);
  const medianRaw = quantile(raw, 0.5);
  const q1 = quantile(raw, 0.25);
  const q3 = quantile(raw, 0.75);
  const IQR = Math.max(0, q3 - q1);

  // CI: proportion de valeurs dans ±20% de la médiane (non transformée)
  const band = 0.2 * medianRaw;
  const minBand = medianRaw - band;
  const maxBand = medianRaw + band;
  const inBand = raw.filter((v) => v >= minBand && v <= maxBand).length;
  const CI = Math.round((inBand / wet.length) * 100);

  // Transformation pour l'agrégation
  const valsT = useLog
    ? wet.map((v) => Math.log((v.mm ?? 0) + eps))
    : wet.map((v) => v.mm ?? 0);
  const medianT = quantile(
    [...valsT].sort((a, b) => a - b),
    0.5
  );
  const sigma = Math.max(1e-9, sigmaRatio * Math.max(medianT, 1e-9));

  // Poids gaussien et moyenne pondérée
  let sumW = 0;
  let sumWV = 0;
  valsT.forEach((val) => {
    const w = Math.exp(-0.5 * Math.pow((val - medianT) / sigma, 2));
    sumW += w;
    sumWV += w * val;
  });
  const meanT = sumW > 0 ? sumWV / sumW : medianT;
  const mm_agg = useLog
    ? Math.max(0, Math.exp(meanT) - eps)
    : Math.max(0, meanT);

  return { mm_agg, mouillant, CI, IQR };
}
