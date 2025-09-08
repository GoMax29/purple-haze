import { fetchMeteoData } from "../src/lib/fetchMeteoData.js";
import {
  wmoAlgorithms,
  isValidAlgorithm,
  getAvailableAlgorithms,
} from "../shared/wmo_algorithms.js";
import fs from "fs";
import path from "path";

/**
 * Traite les données de code météo WMO avec algorithme de groupes de sévérité
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Array<{datetime: string, value: number, risque: Object, debug: Object}>>} Données WMO traitées
 */
export async function traiterWmo(lat, lon) {
  try {
    // 1. Charger la configuration
    const configPath = path.join(process.cwd(), "config", "wmo.json");
    const configData = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configData);

    // Validation de l'algorithme spécifié
    const algorithmName = config.algorithm;
    if (!isValidAlgorithm(algorithmName)) {
      throw new Error(
        `Algorithme WMO inconnu : ${algorithmName}. Algorithmes disponibles : ${getAvailableAlgorithms().join(
          ", "
        )}`
      );
    }

    const selectedAlgorithm = wmoAlgorithms[algorithmName];
    console.log(`🔥 [WMO Processing] Using algorithm: ${algorithmName}`);
    console.log(
      `🔥 [WMO Processing] Available algorithms:`,
      getAvailableAlgorithms()
    );

    // 2. Récupérer les données météo
    const meteoData = await fetchMeteoData(lat, lon);

    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo API1 non disponibles");
    }

    const api1Data = meteoData.api1.data;
    const { time: timestamps } = api1Data.hourly;

    // 3. Extraire les données WMO pour chaque modèle configuré
    const result = [];

    for (let hourIndex = 0; hourIndex < timestamps.length; hourIndex++) {
      const datetime = timestamps[hourIndex];
      const hourFromNow = hourIndex;

      // Collecter les codes WMO de tous les modèles pour cette heure
      const modelWmoCodes = [];

      Object.entries(config.models).forEach(([modelKey, modelConfig]) => {
        if (!modelConfig.enabled) return;

        // Vérifier si cette échéance est dans la plage du modèle
        const [minHour, maxHour] = modelConfig.forecast_hours;
        if (hourFromNow < minHour || hourFromNow > maxHour) return;

        // Extraire la valeur pour ce modèle et cette heure
        const realParameterKey = `${config.api_parameter}_${modelKey}`;
        const modelData = api1Data.hourly[realParameterKey];

        if (modelData && Array.isArray(modelData)) {
          const modelValue = modelData[hourIndex];

          if (modelValue !== null && modelValue !== undefined) {
            modelWmoCodes.push(modelValue);
          }
        }
      });

      // Fallback vers modèles globaux si aucun modèle configuré n'a de données (zones non couvertes)
      let fallbackUsed = null;
      if (modelWmoCodes.length === 0) {
        const fallbackModels = ["ecmwf_ifs025", "gfs_global", "icon_global"];

        for (const fallbackKey of fallbackModels) {
          const fallbackParameterKey = `${config.api_parameter}_${fallbackKey}`;
          const fallbackData = api1Data.hourly[fallbackParameterKey];

          if (fallbackData && Array.isArray(fallbackData)) {
            const fallbackValue = fallbackData[hourIndex];

            if (fallbackValue !== null && fallbackValue !== undefined) {
              modelWmoCodes.push(fallbackValue);
              fallbackUsed = fallbackKey;
              console.log(
                `[WMO] H+${hourFromNow}: Fallback ${fallbackKey} (zone non couverte par modèles configurés) → code ${fallbackValue}`
              );
              break; // Arrêter dès qu'on trouve une valeur
            }
          }
        }
      }

      // 4. Appliquer l'algorithme WMO sélectionné si on a des données
      let processedResult = null;

      if (modelWmoCodes.length > 0) {
        try {
          processedResult = selectedAlgorithm(modelWmoCodes, config);
          console.debug(
            `[WMO] H+${hourFromNow} (${datetime}): ${modelWmoCodes.length} models → code ${processedResult.wmo} (${algorithmName})`
          );
        } catch (error) {
          console.warn(
            `Erreur algorithme WMO ${algorithmName} pour l'heure ${datetime}:`,
            error.message
          );
          // Fallback: utiliser l'algorithme mode simple
          try {
            console.log(
              `[WMO] Fallback vers algorithme 'mode' pour ${datetime}`
            );
            processedResult = wmoAlgorithms.mode(modelWmoCodes, config);
            processedResult.debug.originalError = error.message;
            processedResult.debug.fallbackUsed = true;
          } catch (fallbackError) {
            console.error(
              `Erreur fallback également: ${fallbackError.message}`
            );
            // Fallback ultime: code le plus fréquent simple
            const counts = {};
            modelWmoCodes.forEach((code) => {
              counts[code] = (counts[code] || 0) + 1;
            });
            const mostFrequent = Object.entries(counts).reduce((a, b) =>
              counts[a[1]] > counts[b[1]] ? a : b
            )[0];

            processedResult = {
              wmo: parseInt(mostFrequent),
              risque: { orage: 0, grele: 0, verglas: 0, brouillard: 0 },
              debug: {
                algorithm: "emergency_fallback",
                originalError: error.message,
                fallbackError: fallbackError.message,
                totalModels: modelWmoCodes.length,
                selectionType: "emergency",
              },
            };
          }
        }
      }

      // 5. Ajouter au résultat si on a une valeur
      if (processedResult !== null) {
        // Ajouter l'information de fallback aux données de debug
        if (fallbackUsed) {
          processedResult.debug.fallbackModel = fallbackUsed;
          processedResult.debug.fallbackReason = "zone_non_couverte";
        }

        result.push({
          datetime,
          value: processedResult.wmo,
          risque: processedResult.risque,
          debug: processedResult.debug,
          rawData: modelWmoCodes, // Pour debugging et tests
        });
      }
    }

    // Décalage temporal (règle "preceding hour") :
    // Conserver les mêmes datetimes et décaler uniquement les valeurs d'1h vers l'avant.
    // Pour i ∈ [0..N-2] → prendre la valeur de i+1. La dernière entrée reste inchangée.
    if (result.length > 1) {
      for (let i = 0; i < result.length - 1; i++) {
        const src = result[i + 1];
        result[i] = {
          ...result[i],
          value: src.value,
          risque: src.risque,
          debug: {
            ...src.debug,
            shift: "preceding_hour",
            shiftedFrom: src.datetime,
          },
        };
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Erreur lors du traitement des codes WMO: ${error.message}`
    );
  }
}

/**
 * Fonction d'aide pour obtenir des statistiques sur le traitement WMO
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Statistiques du traitement
 */
export async function getWmoStats(lat, lon) {
  try {
    const config = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "config", "wmo.json"), "utf-8")
    );
    const data = await traiterWmo(lat, lon);

    const codes = data.map((item) => item.value);
    const enabledModels = Object.entries(config.models)
      .filter(([_, modelConfig]) => modelConfig.enabled)
      .map(([key, modelConfig]) => modelConfig.name);

    // Statistiques des risques
    const risqueStats = {
      orage: Math.max(...data.map((item) => item.risque.orage)),
      grele: Math.max(...data.map((item) => item.risque.grele)),
      verglas: Math.max(...data.map((item) => item.risque.verglas)),
      brouillard: Math.max(...data.map((item) => item.risque.brouillard)),
    };

    // Distribution des codes WMO
    const codeDistribution = {};
    codes.forEach((code) => {
      codeDistribution[code] = (codeDistribution[code] || 0) + 1;
    });

    return {
      parameter: config.parameter,
      unit: config.unit,
      algorithm: config.algorithm,
      enabled_models: enabledModels,
      data_points: data.length,
      code_distribution: codeDistribution,
      max_risks: risqueStats,
      time_range: {
        start: data[0]?.datetime,
        end: data[data.length - 1]?.datetime,
      },
      severity_groups: config.algorithm_params.severityGroups,
    };
  } catch (error) {
    throw new Error(
      `Erreur lors du calcul des statistiques WMO: ${error.message}`
    );
  }
}

export default traiterWmo;
