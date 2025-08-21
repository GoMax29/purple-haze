/**
 * Module partagé des algorithmes de traitement WMO
 * Permet la sélection dynamique d'algorithmes d'agrégation de codes météo
 *
 * Algorithmes disponibles :
 * - mode : Sélection par fréquence (code le plus fréquent)
 * - severityGroups : Groupes de sévérité avec ajustement intelligent basé sur les groupes adjacents
 * - maxSeverity : Sélection du code le plus sévère
 * - median/simpleMedian : Médiane simple des codes triés
 * - remappedMedian/severityMedian : Médiane remappée sur échelle de sévérité 1-28
 *
 * @author Assistant Claude
 * @version 2.0.0 - Amélioration algorithe severityGroups + nouveaux algorithmes médiane
 */

/**
 * Algorithme par mode (code le plus fréquent)
 * En cas d'ex-aequo, sélectionne le code de sévérité la plus élevée (valeur numérique la plus grande)
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO
 * @returns {Object} Résultat de l'agrégation
 */
function wmoModeAlgorithm(wmoCodes, config) {
  console.debug(`[WMO Mode] Processing ${wmoCodes.length} codes:`, wmoCodes);

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "mode",
        totalModels: 0,
        selectedCode: null,
        frequency: 0,
        selectionType: "empty",
      },
    };
  }

  // Compter les occurrences
  const counts = {};
  wmoCodes.forEach((code) => {
    counts[code] = (counts[code] || 0) + 1;
  });

  // Trouver la fréquence maximale
  const maxCount = Math.max(...Object.values(counts));

  // Trouver tous les codes ayant la fréquence maximale
  const mostFrequentCodes = Object.keys(counts)
    .filter((code) => counts[code] === maxCount)
    .map(Number)
    .sort((a, b) => b - a); // Tri décroissant pour sélectionner le plus sévère

  const selectedCode = mostFrequentCodes[0];
  const frequency = maxCount;
  const percentage = Math.round((frequency / wmoCodes.length) * 1000) / 10;

  // Calculer les risques spécifiques
  const totalModels = wmoCodes.length;
  const risques = {
    orage: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
      ),
      5
    ),
    grele: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
          totalModels
      ),
      5
    ),
    verglas: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
      ),
      5
    ),
    brouillard: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
          totalModels
      ),
      5
    ),
  };

  const selectionType =
    mostFrequentCodes.length > 1 ? "severity_tiebreak" : "dominant";

  console.debug(
    `[WMO Mode] Selected code ${selectedCode} (${frequency}/${totalModels} = ${percentage}%) - ${selectionType}`
  );

  return {
    wmo: selectedCode,
    risque: risques,
    debug: {
      algorithm: "mode",
      totalModels,
      selectedCode,
      frequency,
      percentage,
      selectionType,
      allCounts: counts,
      tieBreakCodes: mostFrequentCodes,
      threshold: "N/A",
      selectedGroup: "N/A",
    },
  };
}

/**
 * Algorithme par groupes de sévérité avec seuil dynamique
 * Implémentation de l'algorithme actuel avec fallback et médiane
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO
 * @returns {Object} Résultat de l'agrégation
 */
function wmoSeverityGroupsAlgorithm(wmoCodes, config) {
  console.debug(
    `[WMO Severity] Processing ${wmoCodes.length} codes:`,
    wmoCodes
  );

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "severityGroups",
        totalModels: 0,
        selectedGroup: null,
        threshold: "N/A",
        selectionType: "empty",
      },
    };
  }

  const { severityGroups, dynamicThresholdBase } = config.algorithm_params;

  // 1. Compter les occurrences par groupe de sévérité
  const groupCounts = {};
  const totalModels = wmoCodes.length;

  // Initialiser les compteurs
  Object.keys(severityGroups).forEach((groupId) => {
    groupCounts[groupId] = {
      count: 0,
      codes: [],
      severity: severityGroups[groupId].severity,
      description: severityGroups[groupId].description,
    };
  });

  // Compter les codes par groupe
  wmoCodes.forEach((wmoCode) => {
    for (const [groupId, groupData] of Object.entries(severityGroups)) {
      if (groupData.codes.includes(wmoCode)) {
        groupCounts[groupId].count++;
        groupCounts[groupId].codes.push(wmoCode);
        break;
      }
    }
  });

  // 2. Calculer le seuil dynamique
  const activeGroups = Object.values(groupCounts).filter(
    (group) => group.count > 0
  );
  const nbGroups = activeGroups.length;
  const dynamicThreshold =
    nbGroups > 0 ? dynamicThresholdBase / nbGroups / 100 : 0.8;

  // 3. Parcourir les groupes par ordre de sévérité décroissante
  const sortedGroups = Object.entries(groupCounts)
    .filter(([_, group]) => group.count > 0)
    .sort((a, b) => b[1].severity - a[1].severity); // Décroissant

  let selectedGroup = null;
  let selectionType = "dominant";

  // Chercher le premier groupe qui dépasse le seuil
  for (const [groupId, group] of sortedGroups) {
    const percentage = group.count / totalModels;
    if (percentage >= dynamicThreshold) {
      selectedGroup = { groupId, ...group };
      break;
    }
  }

  // Si aucun groupe ne dépasse le seuil, prendre celui avec le plus d'occurrences
  if (!selectedGroup && sortedGroups.length > 0) {
    const maxCount = Math.max(...sortedGroups.map(([_, group]) => group.count));
    const [groupId, group] = sortedGroups.find(
      ([_, group]) => group.count === maxCount
    );
    selectedGroup = { groupId, ...group };
    selectionType = "fallback";
  }

  // 4. Ajustement basé sur les groupes supérieurs/inférieurs
  let wmoCode = 0;
  if (selectedGroup && selectedGroup.codes.length > 0) {
    const selectedSeverity = selectedGroup.severity;

    // Compter les modèles dans les groupes supérieurs et inférieurs
    let upperGroupCount = 0;
    let lowerGroupCount = 0;

    Object.values(groupCounts).forEach((group) => {
      if (group.severity > selectedSeverity) {
        upperGroupCount += group.count;
      } else if (group.severity < selectedSeverity) {
        lowerGroupCount += group.count;
      }
    });

    const sortedCodes = [...selectedGroup.codes].sort((a, b) => a - b);
    const length = sortedCodes.length;

    // Logique d'ajustement selon les groupes adjacents
    let adjustmentType = "median";

    if (upperGroupCount > lowerGroupCount) {
      // Plus de modèles dans les groupes supérieurs → choisir valeur haute
      wmoCode = sortedCodes[length - 1];
      adjustmentType = "upper_bias";
    } else if (lowerGroupCount > upperGroupCount) {
      // Plus de modèles dans les groupes inférieurs → choisir valeur basse
      wmoCode = sortedCodes[0];
      adjustmentType = "lower_bias";
    } else {
      // Groupes équilibrés → médiane (haute si pair)
      if (length % 2 === 0) {
        wmoCode = sortedCodes[length / 2];
      } else {
        wmoCode = sortedCodes[Math.floor(length / 2)];
      }
      adjustmentType = "balanced_median";
    }

    console.debug(
      `[WMO Severity] Adjustment: upper=${upperGroupCount}, lower=${lowerGroupCount}, type=${adjustmentType}, final=${wmoCode}`
    );
  }

  // 5. Calculer les risques spécifiques
  const risques = {
    orage: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
      ),
      5
    ),
    grele: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
          totalModels
      ),
      5
    ),
    verglas: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
      ),
      5
    ),
    brouillard: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
          totalModels
      ),
      5
    ),
  };

  const thresholdPercent = Math.round(dynamicThreshold * 1000) / 10;
  const selectedGroupName = selectedGroup ? selectedGroup.description : "Aucun";

  console.debug(
    `[WMO Severity] Selected group "${selectedGroupName}" (threshold: ${thresholdPercent}%) - code: ${wmoCode} (${selectionType})`
  );

  // Informations d'ajustement pour le debug
  let adjustmentInfo = {};
  if (selectedGroup && selectedGroup.codes.length > 0) {
    const selectedSeverity = selectedGroup.severity;
    let upperGroupCount = 0;
    let lowerGroupCount = 0;

    Object.values(groupCounts).forEach((group) => {
      if (group.severity > selectedSeverity) {
        upperGroupCount += group.count;
      } else if (group.severity < selectedSeverity) {
        lowerGroupCount += group.count;
      }
    });

    adjustmentInfo = {
      upperGroupCount,
      lowerGroupCount,
      selectedGroupCodes: selectedGroup.codes.sort((a, b) => a - b),
    };
  }

  return {
    wmo: wmoCode,
    risque: risques,
    debug: {
      algorithm: "severityGroups",
      groupCounts,
      selectedGroup: selectedGroup ? selectedGroup.groupId : null,
      threshold: thresholdPercent,
      totalModels,
      selectionType,
      adjustmentInfo,
      sortedGroups: sortedGroups.map(([id, group]) => ({
        id,
        count: group.count,
        percentage: Math.round((group.count / totalModels) * 1000) / 10,
      })),
    },
  };
}

/**
 * Algorithme par médiane simple des codes triés
 * Trie tous les codes WMO et retourne la médiane (haute si nombre pair)
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO
 * @returns {Object} Résultat de l'agrégation
 */
function wmoMedianAlgorithm(wmoCodes, config) {
  console.debug(`[WMO Median] Processing ${wmoCodes.length} codes:`, wmoCodes);

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "median",
        totalModels: 0,
        medianCode: null,
        selectionType: "empty",
      },
    };
  }

  const sortedCodes = [...wmoCodes].sort((a, b) => a - b);
  const length = sortedCodes.length;
  const totalModels = wmoCodes.length;

  let medianCode;
  let selectionType;

  if (length % 2 === 0) {
    // Pair : médiane haute (valeur supérieure des deux du milieu)
    medianCode = sortedCodes[length / 2];
    selectionType = "median_high_even";
  } else {
    // Impair : médiane classique
    medianCode = sortedCodes[Math.floor(length / 2)];
    selectionType = "median_odd";
  }

  // Calculer les risques spécifiques
  const risques = {
    orage: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
      ),
      5
    ),
    grele: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
          totalModels
      ),
      5
    ),
    verglas: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
      ),
      5
    ),
    brouillard: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
          totalModels
      ),
      5
    ),
  };

  console.debug(
    `[WMO Median] Selected median code ${medianCode} from sorted codes [${sortedCodes.join(
      ", "
    )}] - ${selectionType}`
  );

  return {
    wmo: medianCode,
    risque: risques,
    debug: {
      algorithm: "median",
      totalModels,
      medianCode,
      sortedCodes,
      selectionType,
      threshold: "N/A",
      selectedGroup: "N/A",
    },
  };
}

/**
 * Algorithme par médiane remappée sur échelle de sévérité (1-28)
 * Mappe chaque code WMO sur une échelle 1-28, calcule la médiane, puis revient au code WMO
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO
 * @returns {Object} Résultat de l'agrégation
 */
function wmoRemappedMedianAlgorithm(wmoCodes, config) {
  console.debug(
    `[WMO RemappedMedian] Processing ${wmoCodes.length} codes:`,
    wmoCodes
  );

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "remappedMedian",
        totalModels: 0,
        medianSeverity: null,
        finalCode: null,
        selectionType: "empty",
      },
    };
  }

  // Mapping WMO codes vers échelle 1-28
  const wmoToSeverityMap = {
    0: 1, // Clear sky
    1: 2,
    2: 3,
    3: 4, // Mainly clear, partly cloudy, and overcast
    45: 5,
    48: 6, // Fog and depositing rime fog
    51: 7,
    53: 8,
    55: 9, // Drizzle: Light, moderate, and dense intensity
    56: 10,
    57: 11, // Freezing Drizzle: Light and dense intensity
    61: 12,
    63: 13,
    65: 14, // Rain: Slight, moderate and heavy intensity
    66: 15,
    67: 16, // Freezing Rain: Light and heavy intensity
    71: 17,
    73: 18,
    75: 19, // Snow fall: Slight, moderate, and heavy intensity
    77: 20, // Snow grains
    80: 21,
    81: 22,
    82: 23, // Rain showers: Slight, moderate, and violent
    85: 24,
    86: 25, // Snow showers slight and heavy
    95: 26, // Thunderstorm: Slight or moderate
    96: 27,
    99: 28, // Thunderstorm with slight and heavy hail
  };

  // Mapping inverse sévérité vers WMO
  const severityToWmoMap = {};
  Object.entries(wmoToSeverityMap).forEach(([wmo, severity]) => {
    severityToWmoMap[severity] = parseInt(wmo);
  });

  // Convertir les codes WMO en valeurs de sévérité
  const severityValues = wmoCodes.map((code) => {
    const severity = wmoToSeverityMap[code];
    if (severity === undefined) {
      console.warn(
        `[WMO RemappedMedian] Unknown WMO code: ${code}, treating as severity 1`
      );
      return 1; // Fallback pour codes inconnus
    }
    return severity;
  });

  // Calculer la médiane des valeurs de sévérité
  const sortedSeverities = [...severityValues].sort((a, b) => a - b);
  const length = sortedSeverities.length;
  const totalModels = wmoCodes.length;

  let medianSeverity;
  let selectionType;

  if (length % 2 === 0) {
    // Pair : médiane haute (valeur supérieure des deux du milieu)
    medianSeverity = sortedSeverities[length / 2];
    selectionType = "median_high_even";
  } else {
    // Impair : médiane classique
    medianSeverity = sortedSeverities[Math.floor(length / 2)];
    selectionType = "median_odd";
  }

  // Convertir la médiane de sévérité vers le code WMO correspondant
  const finalCode = severityToWmoMap[medianSeverity] || 0;

  // Calculer les risques spécifiques
  const risques = {
    orage: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
      ),
      5
    ),
    grele: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
          totalModels
      ),
      5
    ),
    verglas: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
      ),
      5
    ),
    brouillard: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
          totalModels
      ),
      5
    ),
  };

  console.debug(
    `[WMO RemappedMedian] Codes: ${wmoCodes.join(
      ","
    )} → Severities: ${severityValues.join(
      ","
    )} → Median: ${medianSeverity} → Final code: ${finalCode}`
  );

  return {
    wmo: finalCode,
    risque: risques,
    debug: {
      algorithm: "remappedMedian",
      totalModels,
      originalCodes: wmoCodes,
      severityValues,
      sortedSeverities,
      medianSeverity,
      finalCode,
      selectionType,
      mapping: "WMO codes mapped to 1-28 severity scale",
      threshold: "N/A",
      selectedGroup: "N/A",
    },
  };
}

/**
 * Algorithme par sévérité maximale (code le plus sévère présent)
 * Sélectionne simplement le code WMO ayant la valeur numérique la plus élevée
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO
 * @returns {Object} Résultat de l'agrégation
 */
function wmoMaxSeverityAlgorithm(wmoCodes, config) {
  console.debug(
    `[WMO MaxSeverity] Processing ${wmoCodes.length} codes:`,
    wmoCodes
  );

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "maxSeverity",
        totalModels: 0,
        maxCode: null,
        selectionType: "empty",
      },
    };
  }

  const maxCode = Math.max(...wmoCodes);
  const totalModels = wmoCodes.length;

  // Calculer les risques spécifiques
  const risques = {
    orage: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
      ),
      5
    ),
    grele: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
          totalModels
      ),
      5
    ),
    verglas: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
      ),
      5
    ),
    brouillard: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
          totalModels
      ),
      5
    ),
  };

  console.debug(
    `[WMO MaxSeverity] Selected max code ${maxCode} from ${totalModels} models`
  );

  return {
    wmo: maxCode,
    risque: risques,
    debug: {
      algorithm: "maxSeverity",
      totalModels,
      maxCode,
      allCodes: wmoCodes.sort((a, b) => b - a),
      threshold: "N/A",
      selectedGroup: "N/A",
      selectionType: "max_severity",
    },
  };
}

/**
 * Algorithme barycentrique sur 3 groupes (tempéré, brouillard, glacé)
 * - Si le groupe dominant est le brouillard, retourne le mode entre 45 et 48
 * - Sinon, construit une règle avec les codes du groupe dominant, pondère linéairement 1→P,
 *   empile selon les occurrences, calcule le barycentre et arrondit normalement
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO (utilise config.bary_max_pond)
 * @returns {Object} Résultat de l'agrégation
 */
function barycenterThreeGroups(wmoCodes, config) {
  console.debug(`[WMO Bary] Processing ${wmoCodes.length} codes:`, wmoCodes);

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "bary",
        totalModels: 0,
        selectedGroup: null,
        selectionType: "empty",
        bary: null,
      },
    };
  }

  // Récupère P depuis config.bary_max_pond (prioritaire) ou config.algorithm_params.bary_max_pond
  const P = (() => {
    const rootP =
      typeof config?.bary_max_pond === "number" && config.bary_max_pond > 0
        ? config.bary_max_pond
        : null;
    const paramsP =
      typeof config?.algorithm_params?.bary_max_pond === "number" &&
      config.algorithm_params.bary_max_pond > 0
        ? config.algorithm_params.bary_max_pond
        : null;
    return rootP ?? paramsP ?? 1;
  })();

  // Groupes définis
  const groupTemperate = [0, 1, 2, 3, 51, 53, 55, 61, 63, 65, 80, 81, 82, 95];
  const groupFog = [45, 48];
  const groupIcy = [56, 57, 66, 67, 71, 73, 75, 77, 85, 86, 96, 99];

  const inArray = (arr, x) => arr.includes(x);
  const totalModels = wmoCodes.length;

  // Compter par groupe
  const groupCounts = {
    tempere: wmoCodes.filter((c) => inArray(groupTemperate, c)).length,
    brouillard: wmoCodes.filter((c) => inArray(groupFog, c)).length,
    glace: wmoCodes.filter((c) => inArray(groupIcy, c)).length,
  };

  // Détermine le groupe dominant (max occurrences). Tie-break: glace > brouillard > tempere (comme l'UI)
  const dominance = [
    { key: "tempere", val: groupCounts.tempere, prio: 0 },
    { key: "brouillard", val: groupCounts.brouillard, prio: 1 },
    { key: "glace", val: groupCounts.glace, prio: 2 },
  ].sort((a, b) => b.val - a.val || b.prio - a.prio);
  const dominant = dominance[0];

  // Aucun groupe actif → ciel clair par défaut
  if (!dominant || dominant.val === 0) {
    return {
      wmo: 0,
      risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
      debug: {
        algorithm: "bary",
        totalModels,
        selectedGroup: null,
        selectionType: "no_group",
        groupCounts,
      },
    };
  }

  // Cas brouillard: mode sur [45, 48]
  if (dominant.key === "brouillard") {
    const c45 = wmoCodes.filter((c) => c === 45).length;
    const c48 = wmoCodes.filter((c) => c === 48).length;
    const selectedCode = c48 > c45 ? 48 : 45;

    const risques = {
      orage: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
        ),
        5
      ),
      grele: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
            totalModels
        ),
        5
      ),
      verglas: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
        ),
        5
      ),
      brouillard: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
            totalModels
        ),
        5
      ),
    };

    return {
      wmo: selectedCode,
      risque: risques,
      debug: {
        algorithm: "bary",
        totalModels,
        selectedGroup: "brouillard",
        selectionType: "fog_mode",
        groupCounts,
        selectedCode,
      },
    };
  }

  // Sinon, construire la règle pour le groupe dominant
  const codes =
    dominant.key === "tempere" ? [...groupTemperate] : [...groupIcy];
  codes.sort((a, b) => a - b);
  const n = codes.length;

  // Pondération linéaire 1 → P
  const weights = Array.from({ length: n }, (_, i) => {
    if (n <= 1) return 1;
    const t = i / (n - 1);
    return 1 + (P - 1) * t;
  });

  // Occurrences par position du groupe
  const occ = Array(n).fill(0);
  const codeToIndex = new Map(codes.map((c, idx) => [c, idx]));
  wmoCodes.forEach((c) => {
    const idx = codeToIndex.get(c);
    if (idx !== undefined) occ[idx] += 1;
  });

  // Déterminer les bornes actives [imin..imax] comme dans l'outil UI
  let imin = -1;
  let imax = -1;
  for (let i = 0; i < n; i++) {
    if (occ[i] > 0) {
      imin = i;
      break;
    }
  }
  for (let i = n - 1; i >= 0; i--) {
    if (occ[i] > 0) {
      imax = i;
      break;
    }
  }

  // Calcul barycentre uniquement sur la portion utile
  let sumMass = 0;
  let sumMoment = 0;
  for (let i = imin; i <= imax; i++) {
    if (i < 0) continue;
    const mass = occ[i] * weights[i];
    sumMass += mass;
    sumMoment += (i + 1) * mass; // positions 1..n
  }

  // Si aucune occurrence dans le groupe, fallback au mode global
  if (sumMass === 0) {
    const counts = {};
    wmoCodes.forEach((code) => (counts[code] = (counts[code] || 0) + 1));
    const selected = Object.keys(counts).sort(
      (a, b) => counts[b] - counts[a] || Number(b) - Number(a)
    )[0];

    const risques = {
      orage: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
        ),
        5
      ),
      grele: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
            totalModels
        ),
        5
      ),
      verglas: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
        ),
        5
      ),
      brouillard: Math.min(
        Math.round(
          (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
            totalModels
        ),
        5
      ),
    };

    return {
      wmo: Number(selected),
      risque: risques,
      debug: {
        algorithm: "bary",
        totalModels,
        selectedGroup: dominant.key,
        selectionType: "fallback_mode",
        groupCounts,
      },
    };
  }

  const bary = sumMoment / sumMass;
  // Arrondi "normal" avec seuil strict sur la 1ère décimale:
  // - en dessous si 1ère décimale ∈ [0..5]
  // - au dessus si > 5
  const base = Math.floor(bary);
  const firstDecimal = Math.floor((bary - base) * 10 + 1e-9);
  const roundedCustom = firstDecimal > 5 ? Math.ceil(bary) : Math.floor(bary);
  const roundedPos = Math.min(n, Math.max(1, roundedCustom));
  const selectedCode = codes[roundedPos - 1];

  // Risques spécifiques (même logique que les autres algorithmes)
  const risques = {
    orage: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 95).length) / totalModels
      ),
      5
    ),
    grele: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [96, 99].includes(code)).length) /
          totalModels
      ),
      5
    ),
    verglas: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => code === 67).length) / totalModels
      ),
      5
    ),
    brouillard: Math.min(
      Math.round(
        (5 * wmoCodes.filter((code) => [45, 48].includes(code)).length) /
          totalModels
      ),
      5
    ),
  };

  return {
    wmo: selectedCode,
    risque: risques,
    debug: {
      algorithm: "bary",
      totalModels,
      selectedGroup: dominant.key,
      selectionType: "barycenter",
      groupCounts,
      codes,
      weights: weights.map((w) => Math.round(w * 100) / 100),
      occurrences: occ,
      imin,
      imax,
      bary: Math.round(bary * 1000) / 1000,
      roundedPos,
      P,
    },
  };
}

/**
 * Algorithme smart barycentre sur 11 groupes avec gestion des risques
 * Implémente un barycentre discret sur des groupes de codes WMO avec priorités et gestion des risques
 *
 * @param {number[]} wmoCodes - Codes WMO bruts des modèles
 * @param {Object} config - Configuration du paramètre WMO
 * @returns {Object} Résultat de l'agrégation avec risks au lieu de risque
 */
function smartBarycenter11Groups(wmoCodes, config) {
  console.debug(
    `[WMO Smart Bary] Processing ${wmoCodes.length} codes:`,
    wmoCodes
  );

  if (!wmoCodes || wmoCodes.length === 0) {
    return {
      wmo: 0,
      risks: null,
      debug: {
        algorithm: "smart_barycentre_11_groups",
        totalModels: 0,
        dominantGroup: null,
        selectionType: "empty",
        baryCenter: null,
      },
    };
  }

  // Définition des groupes dans l'ordre de priorité (plus prioritaire en premier)
  const groups = {
    THUNDER_HAIL: {
      codes: [96, 99],
      description: "Orage grêle",
      priority: 1,
      isRisk: true,
    },
    THUNDER: { codes: [95], description: "Orage", priority: 2, isRisk: true },
    FREEZING_RAIN: {
      codes: [56, 57, 66, 67],
      description: "Pluie glaçante",
      priority: 3,
      isRisk: true,
    },
    FREEZING_FOG: {
      codes: [48],
      description: "Brouillard givrant",
      priority: 4,
      isRisk: true,
    },
    SNOW_CONV: {
      codes: [85, 86],
      description: "Neige convective",
      priority: 5,
      isRisk: true,
    },
    SNOW: {
      codes: [71, 73, 75],
      description: "Neige continue",
      priority: 6,
      isRisk: false,
    },
    RAIN_CONV: {
      codes: [80, 81, 82],
      description: "Pluie convective",
      priority: 7,
      isRisk: true,
    },
    RAIN_CONT: {
      codes: [0, 1, 2, 3, 51, 53, 55, 61, 63, 65],
      description: "Temps sec/Pluie continue",
      priority: 9,
      isRisk: false,
    },
    FOG: { codes: [45], description: "Brouillard", priority: 8, isRisk: false },
    // DRY: {
    //   codes: [0, 1, 2, 3],
    //   description: "Temps sec",
    //   priority: 10,
    //   isRisk: false,
    // },
  };

  const totalModels = wmoCodes.length;

  // 1. Comptage des occurrences par groupe
  const groupCounts = {};
  const riskCounts = {};

  // Initialiser les compteurs
  Object.keys(groups).forEach((groupKey) => {
    groupCounts[groupKey] = 0;
    if (groups[groupKey].isRisk) {
      riskCounts[groups[groupKey].description] = 0;
    }
  });

  // Compter les codes par groupe
  wmoCodes.forEach((wmoCode) => {
    for (const [groupKey, groupData] of Object.entries(groups)) {
      if (groupData.codes.includes(wmoCode)) {
        groupCounts[groupKey]++;
        if (groupData.isRisk) {
          riskCounts[groupData.description]++;
        }
        break; // Un code appartient à un seul groupe
      }
    }
  });

  // 2. Détermination du groupe dominant (max count, puis priorité en cas d'égalité)
  const maxCount = Math.max(...Object.values(groupCounts));
  let dominantGroup = null;

  // Trouver le groupe avec le max count et la priorité la plus élevée (valeur la plus faible)
  for (const [groupKey, groupData] of Object.entries(groups)) {
    if (groupCounts[groupKey] === maxCount) {
      dominantGroup = groupKey;
      break; // Premier groupe trouvé dans l'ordre de priorité
    }
  }

  if (!dominantGroup || groupCounts[dominantGroup] === 0) {
    return {
      wmo: 0,
      risks: null,
      debug: {
        algorithm: "smart_barycentre_11_groups",
        totalModels,
        dominantGroup: null,
        selectionType: "no_dominant_group",
        groupCounts,
      },
    };
  }

  // 3. Calcul du barycentre discret sur le groupe dominant
  const dominantGroupData = groups[dominantGroup];
  const dominantCodes = dominantGroupData.codes; // Déjà ordonnés dans la définition

  // Ne conserver que les codes du groupe dominant
  const dominantGroupCodes = wmoCodes.filter((code) =>
    dominantCodes.includes(code)
  );

  // Calculer les poids sur chaque position (index) de la règle
  const weights = Array(dominantCodes.length).fill(0);
  dominantGroupCodes.forEach((code) => {
    const index = dominantCodes.indexOf(code);
    if (index !== -1) {
      weights[index]++;
    }
  });

  // Calcul du barycentre: b = Σ(i * n_i) / Σ(n_i)
  let sumNumerator = 0;
  let sumDenominator = 0;

  for (let i = 0; i < dominantCodes.length; i++) {
    sumNumerator += i * weights[i];
    sumDenominator += weights[i];
  }

  const baryCenter = sumDenominator > 0 ? sumNumerator / sumDenominator : 0;

  // Arrondi "half-up": si exactement à mi-chemin (fraction = 0.5), choisir le supérieur
  let selectedIndex;
  if (baryCenter % 1 === 0.5) {
    // Exactement à mi-chemin -> prendre le supérieur
    selectedIndex = Math.ceil(baryCenter);
  } else {
    // Arrondi normal
    selectedIndex = Math.round(baryCenter);
  }

  // S'assurer que l'index est dans les bornes
  selectedIndex = Math.max(
    0,
    Math.min(dominantCodes.length - 1, selectedIndex)
  );
  const selectedCode = dominantCodes[selectedIndex];

  // 4. Construction des risques (format différent de risque) avec priorité en cas d'égalité
  let risks = null;
  const activeRisks = Object.entries(riskCounts).filter(
    ([_, count]) => count > 0
  );

  if (activeRisks.length > 0) {
    // Ordre de priorité des risques (plus prioritaire en premier)
    const riskPriority = [
      "Orage grêle",
      "Orage",
      "Pluie glaçante",
      "Brouillard givrant",
      "Neige convective",
      "Neige continue",
      "Pluie convective",
      "Pluie continue",
      "Brouillard",
      "Temps sec",
    ];

    // Trouver le risque avec le plus d'occurrences
    const maxRiskCount = Math.max(...activeRisks.map(([_, count]) => count));

    // Filtrer les risques ayant le max d'occurrences et les trier par priorité
    const topRisks = activeRisks
      .filter(([_, count]) => count === maxRiskCount)
      .map(([type, qty]) => ({
        type,
        qty,
        priority:
          riskPriority.indexOf(type) !== -1 ? riskPriority.indexOf(type) : 999,
      }))
      .sort((a, b) => a.priority - b.priority); // Plus petit index = plus prioritaire

    const primaryRisk = topRisks[0];
    risks = {
      type: primaryRisk.type,
      qty: primaryRisk.qty,
    };
  }

  console.debug(
    `[WMO Smart Bary] Dominant group: ${dominantGroup} (${
      groupCounts[dominantGroup]
    }/${totalModels}), baryCenter: ${baryCenter.toFixed(
      3
    )}, selected index: ${selectedIndex}, code: ${selectedCode}`
  );

  return {
    wmo: selectedCode,
    risks: risks,
    debug: {
      algorithm: "smart_barycentre_11_groups",
      totalModels,
      dominantGroup,
      dominantGroupData: {
        codes: dominantCodes,
        count: groupCounts[dominantGroup],
        description: dominantGroupData.description,
      },
      baryCenter: Math.round(baryCenter * 1000) / 1000,
      selectedIndex,
      selectedCode,
      weights,
      groupCounts,
      riskCounts,
      selectionType: "barycenter_discrete",
      threshold: "N/A",
      selectedGroup: dominantGroup,
    },
  };
}

/**
 * Export des algorithmes disponibles
 * Chaque clé correspond au nom utilisé dans le fichier de configuration
 */
export const wmoAlgorithms = {
  mode: wmoModeAlgorithm,
  severityGroups: wmoSeverityGroupsAlgorithm,
  wmoSeverityGroups: wmoSeverityGroupsAlgorithm, // Alias pour compatibilité
  maxSeverity: wmoMaxSeverityAlgorithm,
  median: wmoMedianAlgorithm,
  simpleMedian: wmoMedianAlgorithm, // Alias pour clarté
  remappedMedian: wmoRemappedMedianAlgorithm,
  severityMedian: wmoRemappedMedianAlgorithm, // Alias pour clarté
  bary: barycenterThreeGroups,
  smart_barycentre_11_groups: smartBarycenter11Groups,
  smart_bary: smartBarycenter11Groups, // Alias
};

/**
 * Fonction utilitaire pour valider qu'un algorithme existe
 * @param {string} algorithmName - Nom de l'algorithme
 * @returns {boolean} True si l'algorithme existe
 */
export function isValidAlgorithm(algorithmName) {
  return algorithmName in wmoAlgorithms;
}

/**
 * Fonction utilitaire pour obtenir la liste des algorithmes disponibles
 * @returns {string[]} Liste des noms d'algorithmes
 */
export function getAvailableAlgorithms() {
  return Object.keys(wmoAlgorithms);
}

console.log(
  `[WMO Algorithms] Module loaded with algorithms: ${getAvailableAlgorithms().join(
    ", "
  )}`
);
