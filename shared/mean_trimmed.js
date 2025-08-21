/**
 * Calcule la moyenne tronquée d'un tableau de valeurs
 * Supprime un pourcentage des valeurs extrêmes avant de calculer la moyenne
 * Utile pour éliminer les outliers dans les prévisions météo
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} trimPercent - Pourcentage à supprimer de chaque extrémité (0 à 0.5)
 * @returns {number} Moyenne tronquée
 */
export function mean_trimmed(values, trimPercent = 0.2) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  if (
    typeof trimPercent !== "number" ||
    trimPercent < 0 ||
    trimPercent >= 0.5
  ) {
    throw new Error(
      "Le pourcentage de troncature doit être entre 0 et 0.5 (exclus)"
    );
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur valide trouvée dans le tableau");
  }

  // Si on a moins de 3 valeurs, retourner la moyenne simple
  if (validValues.length <= 2) {
    console.warn(
      "Moins de 3 valeurs disponibles, utilisation de la moyenne simple"
    );
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  // Trier les valeurs par ordre croissant
  const sorted = validValues.slice().sort((a, b) => a - b);
  const length = sorted.length;

  // Calculer le nombre de valeurs à supprimer de chaque côté
  const trimCount = Math.floor(length * trimPercent);

  // Si trimCount est 0, retourner la moyenne simple
  if (trimCount === 0) {
    return sorted.reduce((sum, val) => sum + val, 0) / length;
  }

  // Extraire la partie centrale (sans les extrêmes)
  const trimmedValues = sorted.slice(trimCount, length - trimCount);

  if (trimmedValues.length === 0) {
    throw new Error("Toutes les valeurs ont été supprimées par la troncature");
  }

  // Calculer la moyenne des valeurs tronquées
  const sum = trimmedValues.reduce((acc, val) => acc + val, 0);
  return sum / trimmedValues.length;
}

/**
 * Calcule la moyenne tronquée adaptative
 * Ajuste automatiquement le pourcentage de troncature selon la dispersion des données
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} maxTrimPercent - Pourcentage maximum de troncature (défaut: 0.3)
 * @returns {number} Moyenne tronquée adaptative
 */
export function adaptiveTrimmedMean(values, maxTrimPercent = 0.3) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length <= 2) {
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  // Calculer l'écart-type pour évaluer la dispersion
  const mean =
    validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  const variance =
    validValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
    validValues.length;
  const stdDev = Math.sqrt(variance);

  // Calculer le coefficient de variation
  const coefficientOfVariation = stdDev / Math.abs(mean);

  // Ajuster le pourcentage de troncature selon la dispersion
  let trimPercent;
  if (coefficientOfVariation > 0.5) {
    // Forte dispersion : troncature importante
    trimPercent = maxTrimPercent;
  } else if (coefficientOfVariation > 0.3) {
    // Dispersion modérée
    trimPercent = maxTrimPercent * 0.7;
  } else if (coefficientOfVariation > 0.1) {
    // Faible dispersion
    trimPercent = maxTrimPercent * 0.4;
  } else {
    // Très faible dispersion : peu de troncature
    trimPercent = maxTrimPercent * 0.1;
  }

  return mean_trimmed(validValues, trimPercent);
}

/**
 * Calcule la moyenne tronquée winsorisée
 * Remplace les valeurs extrêmes par les valeurs aux percentiles de coupure
 * plutôt que de les supprimer complètement
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} trimPercent - Pourcentage à winsoriser de chaque extrémité
 * @returns {number} Moyenne winsorisée
 */
export function winsorizedMean(values, trimPercent = 0.2) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  if (
    typeof trimPercent !== "number" ||
    trimPercent < 0 ||
    trimPercent >= 0.5
  ) {
    throw new Error(
      "Le pourcentage de winsorisation doit être entre 0 et 0.5 (exclus)"
    );
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length === 0) {
    throw new Error("Aucune valeur valide trouvée dans le tableau");
  }

  if (validValues.length <= 2) {
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  // Trier les valeurs
  const sorted = validValues.slice().sort((a, b) => a - b);
  const length = sorted.length;

  // Calculer les indices de coupure
  const lowerIndex = Math.floor(length * trimPercent);
  const upperIndex = Math.floor(length * (1 - trimPercent));

  // Valeurs de remplacement
  const lowerReplacement = sorted[lowerIndex];
  const upperReplacement = sorted[upperIndex - 1];

  // Créer le tableau winsorisé
  const winsorized = sorted.map((value, index) => {
    if (index < lowerIndex) {
      return lowerReplacement;
    } else if (index >= upperIndex) {
      return upperReplacement;
    } else {
      return value;
    }
  });

  // Calculer la moyenne
  return winsorized.reduce((sum, val) => sum + val, 0) / winsorized.length;
}

/**
 * Calcule une moyenne tronquée robuste en utilisant l'IQR pour identifier les outliers
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number} iqrMultiplier - Multiplicateur pour l'IQR (défaut: 1.5)
 * @returns {number} Moyenne robuste sans outliers
 */
export function robustTrimmedMean(values, iqrMultiplier = 1.5) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("Le tableau de valeurs ne peut pas être vide");
  }

  // Filtrer les valeurs valides
  const validValues = values.filter(
    (val) => val !== null && val !== undefined && !isNaN(val) && isFinite(val)
  );

  if (validValues.length <= 2) {
    return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
  }

  // Calculer les quartiles
  const sorted = validValues.slice().sort((a, b) => a - b);
  const length = sorted.length;

  const Q1Index = Math.floor(length * 0.25);
  const Q3Index = Math.floor(length * 0.75);
  const Q1 = sorted[Q1Index];
  const Q3 = sorted[Q3Index];
  const IQR = Q3 - Q1;

  // Définir les bornes pour les outliers
  const lowerBound = Q1 - iqrMultiplier * IQR;
  const upperBound = Q3 + iqrMultiplier * IQR;

  // Filtrer les outliers
  const filteredValues = validValues.filter(
    (val) => val >= lowerBound && val <= upperBound
  );

  if (filteredValues.length === 0) {
    // Si tous les points sont des outliers, utiliser les quartiles
    return (Q1 + Q3) / 2;
  }

  // Calculer la moyenne des valeurs filtrées
  return (
    filteredValues.reduce((sum, val) => sum + val, 0) / filteredValues.length
  );
}

// Export par défaut
export default mean_trimmed;
