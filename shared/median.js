/**
 * Calcule la médiane d'un tableau de valeurs
 * Algorithme partagé utilisé dans les stratégies de traitement météo
 * @param {number[]} values - Tableau de valeurs numériques
 * @returns {number} Médiane des valeurs
 */
export function median(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides (supprimer null, undefined, NaN)
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur valide trouvée dans le tableau");
  }

  // Trier les valeurs par ordre croissant
  const sorted = validValues.slice().sort((a, b) => a - b);
  const length = sorted.length;

  // Calculer la médiane
  if (length % 2 === 0) {
    // Nombre pair : moyenne des deux valeurs centrales
    const mid1 = sorted[length / 2 - 1];
    const mid2 = sorted[length / 2];
    return (mid1 + mid2) / 2;
  } else {
    // Nombre impair : valeur centrale
    return sorted[Math.floor(length / 2)];
  }
}

/**
 * Calcule la médiane pondérée d'un tableau de valeurs avec leurs poids
 * @param {Array<{value: number, weight: number}>} weightedValues - Valeurs avec leurs poids
 * @returns {number} Médiane pondérée
 */
export function weightedMedian(weightedValues) {
  if (!Array.isArray(weightedValues) || weightedValues.length === 0) {
    throw new Error("Le tableau de valeurs pondérées ne peut pas être vide");
  }

  // Filtrer et valider les valeurs
  const validValues = weightedValues.filter(
    (item) =>
      item &&
      typeof item.value === "number" &&
      !isNaN(item.value) &&
      isFinite(item.value) &&
      typeof item.weight === "number" &&
      !isNaN(item.weight) &&
      isFinite(item.weight) &&
      item.weight > 0
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur pondérée valide trouvée");
  }

  // Trier par valeur
  const sorted = validValues.slice().sort((a, b) => a.value - b.value);

  // Calculer le poids total
  const totalWeight = sorted.reduce((sum, item) => sum + item.weight, 0);

  // Trouver la médiane pondérée
  let cumulativeWeight = 0;
  const halfWeight = totalWeight / 2;

  for (let i = 0; i < sorted.length; i++) {
    cumulativeWeight += sorted[i].weight;

    if (cumulativeWeight >= halfWeight) {
      // Si on atteint exactement la moitié du poids et qu'il y a un élément suivant
      if (cumulativeWeight === halfWeight && i + 1 < sorted.length) {
        return (sorted[i].value + sorted[i + 1].value) / 2;
      }
      return sorted[i].value;
    }
  }

  // Fallback (ne devrait pas arriver)
  return sorted[sorted.length - 1].value;
}

/**
 * Calcule les quartiles d'un tableau de valeurs
 * @param {number[]} values - Tableau de valeurs numériques
 * @returns {Object} Objet contenant Q1, Q2 (médiane), Q3
 */
export function quartiles(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur valide trouvée dans le tableau");
  }

  // Trier les valeurs
  const sorted = validValues.slice().sort((a, b) => a - b);
  const length = sorted.length;

  // Calculer Q2 (médiane)
  const Q2 = median(sorted);

  // Diviser le tableau pour Q1 et Q3
  const mid = Math.floor(length / 2);

  let lowerHalf, upperHalf;

  if (length % 2 === 0) {
    // Nombre pair
    lowerHalf = sorted.slice(0, mid);
    upperHalf = sorted.slice(mid);
  } else {
    // Nombre impair
    lowerHalf = sorted.slice(0, mid);
    upperHalf = sorted.slice(mid + 1);
  }

  // Calculer Q1 et Q3
  const Q1 = lowerHalf.length > 0 ? median(lowerHalf) : sorted[0];
  const Q3 =
    upperHalf.length > 0 ? median(upperHalf) : sorted[sorted.length - 1];

  return {
    Q1,
    Q2,
    Q3,
    IQR: Q3 - Q1, // Écart interquartile
  };
}

/**
 * Calcule la médiane absolue des écarts (MAD) - robuste aux outliers
 * @param {number[]} values - Tableau de valeurs numériques
 * @returns {number} Médiane absolue des écarts
 */
export function medianAbsoluteDeviation(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Calculer la médiane
  const med = median(values);

  // Calculer les écarts absolus par rapport à la médiane
  const absoluteDeviations = values
    .filter(
      (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
    )
    .map((val) => Math.abs(val - med));

  // Retourner la médiane des écarts absolus
  return median(absoluteDeviations);
}

// Exports pour compatibilité
export default median;
