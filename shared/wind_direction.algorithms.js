/**
 * Agrégation direction du vent via moyenne vectorielle pondérée gaussienne
 * - Convertit chaque direction (en degrés) en vecteur unitaire (cos, sin)
 * - Applique des poids gaussiens basés sur l'écart angulaire par rapport à l'angle médian
 * - Calcule la direction moyenne via atan2(sumY, sumX)
 *
 * @param {number[]} directionsDeg - Liste des directions en degrés (0-360)
 * @param {Object} options
 * @param {number} options.sigmaDeg - Ecart-type angulaire en degrés (ex: 30)
 * @returns {number} direction moyenne agrégée en degrés [0,360)
 */
export function aggregateWindDirectionGaussian(directionsDeg, options = {}) {
  const sigmaDeg =
    typeof options.sigmaDeg === "number" && options.sigmaDeg > 0
      ? options.sigmaDeg
      : 30;

  if (!Array.isArray(directionsDeg) || directionsDeg.length === 0) {
    throw new Error("Directions vides");
  }

  const valid = directionsDeg
    .filter((d) => d !== null && d !== undefined && !isNaN(d) && isFinite(d))
    .map((d) => normalizeDeg(d));

  if (valid.length === 0) {
    throw new Error("Aucune direction valide");
  }

  if (valid.length === 1) {
    return normalizeDeg(valid[0]);
  }

  // Calcul d'un centre initial par moyenne vectorielle simple (robuste à la circularité)
  let { meanDeg: centerDeg } = meanVector(valid);

  // Pondération gaussienne selon l'écart angulaire minimal
  let sumX = 0;
  let sumY = 0;
  let totalW = 0;

  const sigmaRad = (sigmaDeg * Math.PI) / 180;

  for (const deg of valid) {
    const delta = angularDifferenceDeg(deg, centerDeg); // [-180,180]
    const deltaRad = (Math.abs(delta) * Math.PI) / 180;
    const weight = Math.exp(-0.5 * Math.pow(deltaRad / sigmaRad, 2));

    const rad = (deg * Math.PI) / 180;
    sumX += Math.cos(rad) * weight;
    sumY += Math.sin(rad) * weight;
    totalW += weight;
  }

  if (totalW === 0 || (sumX === 0 && sumY === 0)) {
    // Fallback sur moyenne vectorielle simple
    return meanVector(valid).meanDeg;
  }

  const meanRad = Math.atan2(sumY, sumX);
  return normalizeDeg((meanRad * 180) / Math.PI);
}

/**
 * Moyenne vectorielle simple
 * @param {number[]} directionsDeg
 * @returns {{ meanDeg: number, R: number }}
 */
export function meanVector(directionsDeg) {
  let x = 0;
  let y = 0;
  const vals = directionsDeg.map((d) => normalizeDeg(d));
  for (const deg of vals) {
    const rad = (deg * Math.PI) / 180;
    x += Math.cos(rad);
    y += Math.sin(rad);
  }
  const meanRad = Math.atan2(y, x);
  const R = Math.sqrt(x * x + y * y) / vals.length;
  return { meanDeg: normalizeDeg((meanRad * 180) / Math.PI), R };
}

/**
 * Différence angulaire minimal en degrés (signed) dans [-180, 180]
 */
export function angularDifferenceDeg(a, b) {
  let d = normalizeDeg(a) - normalizeDeg(b);
  d = ((d + 180) % 360) - 180; // map to (-180, 180]
  return d === -180 ? 180 : d;
}

/**
 * Normalise un angle en degrés dans [0, 360)
 */
export function normalizeDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

export default aggregateWindDirectionGaussian;



