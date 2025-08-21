/**
 * Calcule la moyenne pondérée en utilisant une distribution gaussienne
 * Les poids sont calculés selon une fonction gaussienne centrée sur la médiane
 * Utile pour donner plus de poids aux valeurs proches de la tendance centrale
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} sigma - Écart-type de la gaussienne (défaut: 1.0)
 * @returns {number} Moyenne pondérée gaussienne
 */
export function gaussian_weighted(values, sigma = 1.0) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  if (typeof sigma !== "number" || sigma <= 0) {
    throw new Error("Sigma doit être un nombre positif");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur valide trouvée dans le tableau");
  }

  // Si une seule valeur, la retourner
  if (validValues.length === 1) {
    return validValues[0];
  }

  // Calculer la médiane comme centre de la gaussienne
  const sortedValues = validValues.slice().sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedValues.length / 2);
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
      : sortedValues[medianIndex];

  // Calculer les poids gaussiens pour chaque valeur
  let weightedSum = 0;
  let totalWeight = 0;

  for (const value of validValues) {
    // Calcul du poids gaussien: exp(-0.5 * ((x - μ) / σ)²)
    const distance = Math.abs(value - median);
    const weight = Math.exp(-0.5 * Math.pow(distance / sigma, 2));

    weightedSum += value * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    throw new Error("La somme des poids gaussiens est nulle");
  }

  return weightedSum / totalWeight;
}

/**
 * Calcule la moyenne pondérée gaussienne avec sigma adaptatif
 * Le sigma est calculé automatiquement selon la dispersion des données
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} sigmaMultiplier - Multiplicateur pour le sigma calculé (défaut: 1.0)
 * @returns {number} Moyenne pondérée gaussienne adaptative
 */
export function adaptiveGaussianWeighted(values, sigmaMultiplier = 1.0) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length <= 1) {
    return validValues[0] || 0;
  }

  // Calculer l'écart-type comme estimation du sigma
  const mean =
    validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  const variance =
    validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    validValues.length;
  const standardDeviation = Math.sqrt(variance);

  // Utiliser l'écart-type comme sigma (avec multiplicateur)
  const adaptiveSigma = Math.max(standardDeviation * sigmaMultiplier, 0.1); // Minimum pour éviter sigma trop petit

  return gaussian_weighted(validValues, adaptiveSigma);
}

/**
 * Calcule la moyenne pondérée gaussienne robuste
 * Utilise l'écart absolu médian (MAD) pour estimer le sigma de façon robuste
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} madMultiplier - Multiplicateur pour le MAD (défaut: 1.4826 pour équivalence avec l'écart-type)
 * @returns {number} Moyenne pondérée gaussienne robuste
 */
export function robustGaussianWeighted(values, madMultiplier = 1.4826) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length <= 1) {
    return validValues[0] || 0;
  }

  // Calculer la médiane
  const sortedValues = validValues.slice().sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedValues.length / 2);
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
      : sortedValues[medianIndex];

  // Calculer l'écart absolu médian (MAD)
  const absoluteDeviations = validValues.map((val) => Math.abs(val - median));
  const sortedDeviations = absoluteDeviations.sort((a, b) => a - b);
  const madIndex = Math.floor(sortedDeviations.length / 2);
  const mad =
    sortedDeviations.length % 2 === 0
      ? (sortedDeviations[madIndex - 1] + sortedDeviations[madIndex]) / 2
      : sortedDeviations[madIndex];

  // Convertir MAD en estimation robuste de l'écart-type
  const robustSigma = Math.max(mad * madMultiplier, 0.1);

  return gaussian_weighted(validValues, robustSigma);
}

/**
 * Calcule la moyenne pondérée avec plusieurs gaussiennes (mélange de gaussiennes)
 * Utile quand les données peuvent avoir plusieurs modes
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} numGaussians - Nombre de gaussiennes à utiliser (défaut: 2)
 * @param {number} sigma - Écart-type des gaussiennes (défaut: auto)
 * @returns {number} Moyenne pondérée avec mélange de gaussiennes
 */
export function mixtureGaussianWeighted(
  values,
  numGaussians = 2,
  sigma = null
) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length <= numGaussians) {
    // Pas assez de données pour un mélange, utiliser la gaussienne simple
    return gaussian_weighted(validValues, sigma || 1.0);
  }

  // Trier les valeurs
  const sortedValues = validValues.slice().sort((a, b) => a - b);

  // Diviser en groupes pour initialiser les centres
  const groupSize = Math.floor(sortedValues.length / numGaussians);
  const centers = [];

  for (let i = 0; i < numGaussians; i++) {
    const startIndex = i * groupSize;
    const endIndex =
      i === numGaussians - 1 ? sortedValues.length : (i + 1) * groupSize;
    const group = sortedValues.slice(startIndex, endIndex);
    const center = group.reduce((sum, val) => sum + val, 0) / group.length;
    centers.push(center);
  }

  // Calculer le sigma automatiquement si non fourni
  if (sigma === null) {
    const overallMean =
      validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    const variance =
      validValues.reduce(
        (sum, val) => sum + Math.pow(val - overallMean, 2),
        0
      ) / validValues.length;
    sigma = Math.max(Math.sqrt(variance) / numGaussians, 0.1);
  }

  // Calculer les poids pour chaque valeur comme maximum des gaussiennes
  let weightedSum = 0;
  let totalWeight = 0;

  for (const value of validValues) {
    // Calculer le poids maximum parmi toutes les gaussiennes
    let maxWeight = 0;

    for (const center of centers) {
      const distance = Math.abs(value - center);
      const weight = Math.exp(-0.5 * Math.pow(distance / sigma, 2));
      maxWeight = Math.max(maxWeight, weight);
    }

    weightedSum += value * maxWeight;
    totalWeight += maxWeight;
  }

  if (totalWeight === 0) {
    throw new Error("La somme des poids du mélange gaussien est nulle");
  }

  return weightedSum / totalWeight;
}

/**
 * Calcule la moyenne pondérée gaussienne avec contraintes sur les valeurs extrêmes
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} sigma - Écart-type de la gaussienne
 * @param {number} maxDeviation - Écart maximum autorisé par rapport à la médiane (en unités de sigma)
 * @returns {number} Moyenne pondérée gaussienne contrainte
 */
export function constrainedGaussianWeighted(
  values,
  sigma = 1.0,
  maxDeviation = 3.0
) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur valide trouvée");
  }

  if (validValues.length === 1) {
    return validValues[0];
  }

  // Calculer la médiane
  const sortedValues = validValues.slice().sort((a, b) => a - b);
  const medianIndex = Math.floor(sortedValues.length / 2);
  const median =
    sortedValues.length % 2 === 0
      ? (sortedValues[medianIndex - 1] + sortedValues[medianIndex]) / 2
      : sortedValues[medianIndex];

  // Filtrer les valeurs dans la plage acceptable
  const maxDistance = maxDeviation * sigma;
  const constrainedValues = validValues.filter(
    (val) => Math.abs(val - median) <= maxDistance
  );

  // Si aucune valeur dans la contrainte, utiliser la médiane
  if (constrainedValues.length === 0) {
    return median;
  }

  // Appliquer la pondération gaussienne sur les valeurs contraintes
  return gaussian_weighted(constrainedValues, sigma);
}

/**
 * Fonction utilitaire pour calculer la fonction de densité gaussienne
 * @param {number} x - Valeur
 * @param {number} mu - Moyenne (centre)
 * @param {number} sigma - Écart-type
 * @returns {number} Densité de probabilité gaussienne
 */
export function gaussianPDF(x, mu = 0, sigma = 1) {
  const coefficient = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
  return coefficient * Math.exp(exponent);
}

// Export par défaut
export default gaussian_weighted;
