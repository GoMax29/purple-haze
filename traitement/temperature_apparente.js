import { fetchMeteoData } from "../src/lib/fetchMeteoData.js";
import { gaussian_weighted } from "../shared/gaussian_weighted.js";
import fs from "fs";
import path from "path";

/**
 * Traite les données de température apparente avec pondération gaussienne
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Array<{datetime: string, value: number}>>} Données de température apparente traitées
 */
export async function traiterTemperatureApparente(lat, lon) {
  try {
    // 1. Charger la configuration
    const configPath = path.join(
      process.cwd(),
      "config",
      "temperature_apparente.json"
    );
    const configData = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(configData);

    // 2. Récupérer les données météo
    const meteoData = await fetchMeteoData(lat, lon);

    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo API1 non disponibles");
    }

    const api1Data = meteoData.api1.data;
    const { time: timestamps } = api1Data.hourly;

    // 3. Extraire les données de température apparente pour chaque modèle configuré
    const result = [];

    for (let hourIndex = 0; hourIndex < timestamps.length; hourIndex++) {
      const datetime = timestamps[hourIndex];
      const hourFromNow = hourIndex;

      // Collecter les valeurs de tous les modèles pour cette heure
      const modelValues = [];

      Object.entries(config.models).forEach(([modelKey, modelConfig]) => {
        if (!modelConfig.enabled) return;

        // Vérifier si cette échéance est dans la plage du modèle
        const [minHour, maxHour] = modelConfig.forecast_hours;
        if (hourFromNow < minHour || hourFromNow > maxHour) return;

        // Extraire la valeur pour ce modèle et cette heure
        // La clé réelle est "parameter_modelname" (ex: "apparent_temperature_meteofrance_arome_france")
        const realParameterKey = `${config.api_parameter}_${modelKey}`;
        const modelData = api1Data.hourly[realParameterKey];

        if (modelData && Array.isArray(modelData)) {
          const modelValue = modelData[hourIndex];

          if (modelValue !== null && modelValue !== undefined) {
            modelValues.push({
              value: modelValue,
              weight: modelConfig.weight,
            });
          }
        }
      });

      // 4. Appliquer l'algorithme gaussien si on a des données
      let processedValue = null;

      if (modelValues.length > 0) {
        // Extraire uniquement les valeurs pour l'algorithme gaussien
        const values = modelValues.map((item) => item.value);

        try {
          // Appliquer la pondération gaussienne avec les paramètres de config
          processedValue = gaussian_weighted(
            values,
            config.algorithm_params.sigma
          );
        } catch (error) {
          console.warn(
            `Erreur algorithme gaussien pour l'heure ${datetime}:`,
            error.message
          );
          // Fallback: moyenne simple
          processedValue =
            values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      }

      // 5. Ajouter au résultat si on a une valeur
      if (processedValue !== null) {
        result.push({
          datetime,
          value: Math.round(processedValue * 10) / 10, // Arrondir à 1 décimale
        });
      }
    }

    return result;
  } catch (error) {
    throw new Error(
      `Erreur lors du traitement de la température apparente: ${error.message}`
    );
  }
}

/**
 * Fonction d'aide pour obtenir des statistiques sur le traitement
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Statistiques du traitement
 */
export async function getTemperatureApparenteStats(lat, lon) {
  try {
    const config = JSON.parse(
      fs.readFileSync(
        path.join(process.cwd(), "config", "temperature_apparente.json"),
        "utf-8"
      )
    );
    const data = await traiterTemperatureApparente(lat, lon);

    const values = data.map((item) => item.value);
    const enabledModels = Object.entries(config.models)
      .filter(([_, modelConfig]) => modelConfig.enabled)
      .map(([key, modelConfig]) => modelConfig.name);

    return {
      parameter: config.parameter,
      unit: config.unit,
      algorithm: config.algorithm,
      sigma: config.algorithm_params.sigma,
      enabled_models: enabledModels,
      data_points: data.length,
      min_value: Math.min(...values),
      max_value: Math.max(...values),
      avg_value:
        Math.round(
          (values.reduce((sum, val) => sum + val, 0) / values.length) * 10
        ) / 10,
      time_range: {
        start: data[0]?.datetime,
        end: data[data.length - 1]?.datetime,
      },
    };
  } catch (error) {
    throw new Error(`Erreur lors du calcul des statistiques: ${error.message}`);
  }
}

export default traiterTemperatureApparente;
