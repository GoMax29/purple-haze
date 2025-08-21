/**
 * Calcule la moyenne pondérée d'un ensemble de valeurs avec leurs modèles
 * Utilisé pour combiner les prévisions de différents modèles météo selon leur fiabilité
 * @param {Array<{model: string, value: number}>} modelValues - Valeurs avec leurs modèles
 * @param {Object} weights - Poids par modèle {model: weight}
 * @returns {number} Moyenne pondérée
 */
export function weighted_average(modelValues, weights) {
  if (!Array.isArray(modelValues) || modelValues.length === 0) {
    throw new Error("Le tableau de valeurs avec modèles ne peut pas être vide");
  }

  if (!weights || typeof weights !== "object") {
    throw new Error(
      "Les poids doivent être fournis sous forme d'objet {model: weight}"
    );
  }

  // Filtrer les valeurs valides et qui ont un poids défini
  const validItems = modelValues.filter(
    (item) =>
      item &&
      typeof item.value === "number" &&
      !isNaN(item.value) &&
      isFinite(item.value) &&
      typeof item.model === "string" &&
      weights[item.model] !== undefined &&
      typeof weights[item.model] === "number" &&
      !isNaN(weights[item.model]) &&
      isFinite(weights[item.model])
  );

  if (validItems.length === 0) {
    throw new Error("Aucune valeur valide avec poids trouvée");
  }

  // Calculer la somme pondérée et la somme des poids
  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of validItems) {
    const weight = weights[item.model];
    weightedSum += item.value * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    throw new Error("La somme des poids est nulle");
  }

  return weightedSum / totalWeight;
}

/**
 * Calcule la moyenne pondérée simple à partir de valeurs et poids parallèles
 * @param {number[]} values - Tableau de valeurs numériques
 * @param {number[]} weights - Tableau de poids correspondants
 * @returns {number} Moyenne pondérée
 */
export function weightedAverage(values, weights) {
  if (!Array.isArray(values) || !Array.isArray(weights)) {
    throw new Error("Les valeurs et poids doivent être des tableaux");
  }

  if (values.length !== weights.length) {
    throw new Error(
      "Les tableaux de valeurs et de poids doivent avoir la même longueur"
    );
  }

  if (values.length === 0) {
    throw new Error("Les tableaux ne peuvent pas être vides");
  }

  // Filtrer les paires valides
  const validPairs = [];
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const weight = weights[i];

    if (
      typeof value === "number" &&
      !isNaN(value) &&
      isFinite(value) &&
      typeof weight === "number" &&
      !isNaN(weight) &&
      isFinite(weight) &&
      weight >= 0
    ) {
      validPairs.push({ value, weight });
    }
  }

  if (validPairs.length === 0) {
    throw new Error("Aucune paire valeur/poids valide trouvée");
  }

  // Calculer la moyenne pondérée
  const weightedSum = validPairs.reduce(
    (sum, pair) => sum + pair.value * pair.weight,
    0
  );
  const totalWeight = validPairs.reduce((sum, pair) => sum + pair.weight, 0);

  if (totalWeight === 0) {
    throw new Error("La somme des poids est nulle");
  }

  return weightedSum / totalWeight;
}

/**
 * Calcule la moyenne pondérée avec normalisation automatique des poids
 * @param {Array<{value: number, weight: number}>} items - Items avec valeur et poids
 * @returns {number} Moyenne pondérée normalisée
 */
export function normalizedWeightedAverage(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Le tableau d'items ne peut pas être vide");
  }

  // Filtrer les items valides
  const validItems = items.filter(
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

  if (validItems.length === 0) {
    throw new Error("Aucun item valide trouvé");
  }

  // Calculer la somme des poids pour normalisation
  const totalWeight = validItems.reduce((sum, item) => sum + item.weight, 0);

  // Calculer la moyenne pondérée normalisée
  const weightedSum = validItems.reduce((sum, item) => {
    const normalizedWeight = item.weight / totalWeight;
    return sum + item.value * normalizedWeight;
  }, 0);

  return weightedSum;
}

/**
 * Calcule la moyenne pondérée avec des poids adaptatifs basés sur la fiabilité
 * @param {Array<{model: string, value: number, confidence?: number, timestamp?: string}>} modelData - Données des modèles
 * @param {Object} baseWeights - Poids de base par modèle
 * @param {Object} options - Options pour l'adaptation des poids
 * @returns {number} Moyenne pondérée adaptative
 */
export function adaptiveWeightedAverage(modelData, baseWeights, options = {}) {
  const {
    useConfidence = true,
    useRecency = true,
    maxAge = 3600000, // 1 heure en ms
    confidenceWeight = 0.3,
    recencyWeight = 0.2,
  } = options;

  if (!Array.isArray(modelData) || modelData.length === 0) {
    throw new Error("Les données de modèles ne peuvent pas être vides");
  }

  const now = new Date().getTime();

  // Calculer les poids adaptatifs
  const adaptedItems = modelData
    .filter(
      (item) =>
        item &&
        typeof item.value === "number" &&
        !isNaN(item.value) &&
        isFinite(item.value) &&
        baseWeights[item.model] !== undefined
    )
    .map((item) => {
      let adaptedWeight = baseWeights[item.model] || 0;

      // Ajustement basé sur la confiance
      if (
        useConfidence &&
        typeof item.confidence === "number" &&
        !isNaN(item.confidence)
      ) {
        const confidenceFactor = Math.max(0, Math.min(1, item.confidence));
        adaptedWeight *= 1 + confidenceWeight * (confidenceFactor - 0.5) * 2;
      }

      // Ajustement basé sur la récence
      if (useRecency && item.timestamp) {
        const timestamp = new Date(item.timestamp).getTime();
        const age = now - timestamp;
        const recencyFactor = Math.max(0, Math.min(1, 1 - age / maxAge));
        adaptedWeight *= 1 + recencyWeight * (recencyFactor - 0.5) * 2;
      }

      return {
        value: item.value,
        weight: Math.max(0, adaptedWeight), // S'assurer que le poids n'est pas négatif
      };
    });

  if (adaptedItems.length === 0) {
    throw new Error("Aucune donnée de modèle valide après adaptation");
  }

  // Calculer la moyenne pondérée avec les poids adaptés
  return normalizedWeightedAverage(adaptedItems);
}

/**
 * Calcule la moyenne pondérée avec gestion des valeurs manquantes
 * @param {Array<{model: string, value?: number}>} modelData - Données des modèles (certaines valeurs peuvent être manquantes)
 * @param {Object} weights - Poids par modèle
 * @param {number} fallbackValue - Valeur de remplacement pour les données manquantes
 * @returns {number} Moyenne pondérée avec fallback
 */
export function robustWeightedAverage(
  modelData,
  weights,
  fallbackValue = null
) {
  if (!Array.isArray(modelData) || modelData.length === 0) {
    throw new Error("Les données de modèles ne peuvent pas être vides");
  }

  // Séparer les données disponibles et manquantes
  const availableData = [];
  const missingData = [];

  for (const item of modelData) {
    if (
      item &&
      typeof item.value === "number" &&
      !isNaN(item.value) &&
      isFinite(item.value) &&
      weights[item.model] !== undefined
    ) {
      availableData.push(item);
    } else if (item && weights[item.model] !== undefined) {
      missingData.push(item);
    }
  }

  if (availableData.length === 0) {
    if (fallbackValue !== null) {
      return fallbackValue;
    }
    throw new Error(
      "Aucune donnée valide disponible et aucune valeur de fallback fournie"
    );
  }

  // Si on a des données manquantes et une valeur de fallback
  if (missingData.length > 0 && fallbackValue !== null) {
    // Ajouter la valeur de fallback pour les modèles manquants
    for (const missing of missingData) {
      availableData.push({
        model: missing.model,
        value: fallbackValue,
      });
    }
  }

  // Calculer la moyenne pondérée avec les données disponibles
  return weighted_average(availableData, weights);
}

/**
 * Calcule plusieurs statistiques pondérées d'un coup
 * @param {Array<{value: number, weight: number}>} items - Items avec valeur et poids
 * @returns {Object} Objet contenant moyenne, variance et écart-type pondérés
 */
export function weightedStatistics(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Le tableau d'items ne peut pas être vide");
  }

  // Filtrer les items valides
  const validItems = items.filter(
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

  if (validItems.length === 0) {
    throw new Error("Aucun item valide trouvé");
  }

  // Calculer la moyenne pondérée
  const mean = normalizedWeightedAverage(validItems);

  // Calculer la variance pondérée
  const totalWeight = validItems.reduce((sum, item) => sum + item.weight, 0);
  const weightedVariance = validItems.reduce((sum, item) => {
    const normalizedWeight = item.weight / totalWeight;
    return sum + normalizedWeight * Math.pow(item.value - mean, 2);
  }, 0);

  return {
    mean,
    variance: weightedVariance,
    standardDeviation: Math.sqrt(weightedVariance),
    count: validItems.length,
    totalWeight,
  };
}

// Export par défaut
export default weighted_average;
