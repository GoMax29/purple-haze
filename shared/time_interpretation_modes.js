/**
 * Configuration des modes d'interprétation temporelle pour les paramètres météorologiques
 *
 * - instant: La valeur correspond à l'état météorologique à l'heure pile (ex: température à 08:00)
 * - preceding_hour: La valeur correspond au cumul/moyenne de l'heure précédente (ex: précipitations à 08:00 = cumul 07:00→08:00)
 *
 * @author Assistant Claude
 * @version 1.0.0
 */

/**
 * Mapping des paramètres vers leur mode d'interprétation temporelle
 */
export const TIME_INTERPRETATION_MODES = {
  // Paramètres instantanés (état à l'heure pile)
  weather_code: "instant", // Code WMO à l'heure exacte
  temperature: "instant", // Température à l'heure exacte
  temperature_apparent: "instant", // Température apparente à l'heure exacte
  humidity: "instant", // Humidité à l'heure exacte
  wind_speed: "instant", // Vitesse du vent à l'heure exacte
  wind_direction: "instant", // Direction du vent à l'heure exacte
  wind_gust: "instant", // Rafales à l'heure exacte
  uv_index: "instant", // Index UV à l'heure exacte
  air_quality: "instant", // Qualité de l'air à l'heure exacte
  pressure: "instant", // Pression atmosphérique à l'heure exacte

  // Paramètres cumulatifs (somme/moyenne de l'heure précédente)
  precipitation: "preceding_hour", // Précipitations cumul heure précédente
  radiation: "preceding_hour", // Radiation cumul heure précédente
  evapotranspiration: "preceding_hour", // Évapotranspiration cumul heure précédente
};

/**
 * Fonction pour obtenir le mode d'interprétation d'un paramètre
 * @param {string} parameter - Nom du paramètre
 * @returns {string} Mode d'interprétation ("instant" ou "preceding_hour")
 */
export function getTimeInterpretationMode(parameter) {
  return TIME_INTERPRETATION_MODES[parameter] || "instant"; // Par défaut: instant
}

/**
 * Fonction pour vérifier si un paramètre utilise la règle "preceding_hour"
 * @param {string} parameter - Nom du paramètre
 * @returns {boolean} True si le paramètre utilise preceding_hour
 */
export function isPrecedingHourParameter(parameter) {
  return getTimeInterpretationMode(parameter) === "preceding_hour";
}

/**
 * Fonction pour ajuster les indices temporels selon le mode d'interprétation
 * @param {Array} hourlyData - Données horaires
 * @param {string} parameter - Nom du paramètre
 * @param {number} slotStart - Heure de début de la tranche (0-23)
 * @param {number} slotEnd - Heure de fin de la tranche (0-23)
 * @returns {Array} Indices des heures à inclure dans l'agrégation
 */
export function getRelevantHourIndices(
  hourlyData,
  parameter,
  slotStart,
  slotEnd
) {
  const mode = getTimeInterpretationMode(parameter);
  const indices = [];

  for (let i = 0; i < hourlyData.length; i++) {
    const item = hourlyData[i];
    if (!item.time) continue;

    const hour = new Date(item.time).getHours();
    let includeHour = false;

    if (mode === "instant") {
      // Mode instant: inclure les heures de la tranche
      if (slotStart < slotEnd) {
        includeHour = hour >= slotStart && hour < slotEnd;
      } else {
        // Cas 18-00 (18h à minuit)
        includeHour = hour >= slotStart || hour < slotEnd;
      }
    } else if (mode === "preceding_hour") {
      // Mode preceding_hour: décaler d'une heure vers l'avant
      // Pour la tranche 06-12h, on veut les précipitations de 07, 08, 09, 10, 11, 12
      // (car 07:00 = cumul 06→07h, 08:00 = cumul 07→08h, etc.)
      const adjustedStart = (slotStart + 1) % 24;
      const adjustedEnd = slotEnd % 24; // Pas de +1 car slotEnd est exclusif

      if (adjustedStart <= adjustedEnd) {
        includeHour = hour >= adjustedStart && hour <= adjustedEnd;
      } else {
        // Cas spécial qui chevauche minuit
        includeHour = hour >= adjustedStart || hour <= adjustedEnd;
      }
    }

    if (includeHour) {
      indices.push(i);
    }
  }

  return indices;
}

/**
 * Fonction utilitaire pour créer un résumé des règles temporelles
 * @returns {Object} Résumé des règles par catégorie
 */
export function getTimeRulesSummary() {
  const instant = [];
  const precedingHour = [];

  Object.entries(TIME_INTERPRETATION_MODES).forEach(([param, mode]) => {
    if (mode === "instant") {
      instant.push(param);
    } else if (mode === "preceding_hour") {
      precedingHour.push(param);
    }
  });

  return {
    instant: {
      parameters: instant,
      description:
        "Valeur instantanée à l'heure pile (ex: temp à 08:00 = temp à 8h exactement)",
    },
    preceding_hour: {
      parameters: precedingHour,
      description:
        "Cumul/moyenne de l'heure précédente (ex: précip à 08:00 = cumul 07:00→08:00)",
    },
  };
}

console.log(
  "[Time Interpretation] Module chargé avec modes:",
  Object.keys(TIME_INTERPRETATION_MODES).length,
  "paramètres"
);
