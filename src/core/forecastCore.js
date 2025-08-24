/**
 * Orchestrateur Core — construction des données prévisionnelles à partir de coordonnées GPS
 *
 * buildForecastFromCoordinates(lat, lon) retourne:
 *  - hourlyData: tableau d'objets par heure (0h à 168h)
 *  - dailyData: tableau d'objets par jour (agrégations + WMO par tranches)
 *
 * Architecture modulaire:
 *  - Appelle fetchMeteoData(lat, lon) pour récupérer les données brutes
 *  - Appelle tous les fichiers de traitement avec ces coordonnées:
 *    * traiterTemperature(lat, lon)
 *    * traiterTemperatureApparente(lat, lon)
 *    * traiterHumidite(lat, lon)
 *    * traiterWmo(lat, lon)
 *    * traiterVent(lat, lon)
 *    * traiterPrecipitations(lat, lon)
 *  - Récupère directement UV_index et qualité de l'air depuis fetchMeteoData
 *  - Assemble toutes les données horaires
 *  - Calcule les agrégations quotidiennes:
 *    * Températures min/max
 *    * UV max
 *    * Précipitations totales
 *    * Codes WMO par tranches horaires (0-6h, 6-12h, 12-18h, 18-00h) via barycenterThreeGroups
 */

import { fetchMeteoData, getCacheStats } from "../lib/fetchMeteoData.js";
import { wmoAlgorithms } from "../../shared/wmo_algorithms.js";

// Import des modules de traitement
import { traiterTemperature } from "../../traitement/temperature.js";
import { traiterTemperatureApparente } from "../../traitement/temperature_apparente.js";
import { traiterHumidite } from "../../traitement/humidite.js";
import { traiterWmo } from "../../traitement/wmo.js";
import { traiterVent } from "../../traitement/wind.js";
import { traiterPrecipitations } from "../../traitement/precipitations.js";
import { aggregateTimeSlots } from "../../traitement/time_slots_smart_bary.js";

import path from "path";
import fs from "fs";

// Cache multi-niveaux pour optimiser les performances
// Cache niveau 2 : données traitées et standardisées (objet final 7 jours)
const processedCache = new Map();
const TTL_MINUTES = 15; // Synchronisé avec fetchMeteoData
const TTL_MS = TTL_MINUTES * 60 * 1000;

/**
 * Petit utilitaire: lit un JSON dans /config
 */
function readConfigJson(filename) {
  const absolutePath = path.resolve(process.cwd(), "config", filename);
  const content = fs.readFileSync(absolutePath, "utf-8");
  return JSON.parse(content);
}

/**
 * Génère une clé de cache unique pour des coordonnées (synchronisé avec fetchMeteoData)
 */
function generateCacheKey(latitude, longitude) {
  // Arrondir à 4 décimales pour cohérence avec fetchMeteoData
  const latRounded = Math.round(latitude * 10000) / 10000;
  const lonRounded = Math.round(longitude * 10000) / 10000;
  return `${latRounded},${lonRounded}`;
}

/**
 * Vérifie si les données du cache traité sont encore valides
 */
function isProcessedCacheValid(cacheEntry) {
  return cacheEntry && Date.now() - cacheEntry.timestamp < TTL_MS;
}

/**
 * Récupère les statistiques du cache traité
 */
export function getProcessedCacheStats() {
  const entries = Array.from(processedCache.entries());
  const validEntries = entries.filter(([, entry]) =>
    isProcessedCacheValid(entry)
  );

  return {
    cache_name: "forecastCore_processed",
    total_entries: processedCache.size,
    valid_entries: validEntries.length,
    expired_entries: processedCache.size - validEntries.length,
    coordinates_cached: validEntries.map(([coords]) => coords),
    ttl_minutes: TTL_MINUTES,
    cache_size_mb:
      Math.round(
        (JSON.stringify([...processedCache.values()]).length / 1024 / 1024) *
          100
      ) / 100,
  };
}

/**
 * Vide le cache traité manuellement
 */
export function clearProcessedCache() {
  processedCache.clear();
  console.log("📦 [ForecastCore] Cache traité vidé manuellement");
}

/**
 * Récupère les statistiques combinées des deux niveaux de cache
 */
export function getAllCacheStats() {
  try {
    const rawCacheStats = getCacheStats(); // Cache niveau 1 (brut)
    const processedCacheStats = getProcessedCacheStats(); // Cache niveau 2 (traité)

    return {
      cache_system: "multi-level",
      level_1_raw: rawCacheStats,
      level_2_processed: processedCacheStats,
      sync_status: {
        ttl_synchronized:
          rawCacheStats.ttl_minutes === processedCacheStats.ttl_minutes,
        common_coordinates: rawCacheStats.coordinates_cached.filter((coord) =>
          processedCacheStats.coordinates_cached.includes(coord)
        ),
      },
      performance: {
        total_cache_size_mb:
          (rawCacheStats.cache_size_mb || 0) +
          processedCacheStats.cache_size_mb,
        efficiency_ratio:
          processedCacheStats.valid_entries /
          Math.max(rawCacheStats.valid_entries, 1),
      },
    };
  } catch (error) {
    console.warn(
      "⚠️ [ForecastCore] Erreur lors de la récupération des stats de cache:",
      error.message
    );
    return {
      cache_system: "multi-level",
      error: error.message,
      level_2_processed: getProcessedCacheStats(),
    };
  }
}

/**
 * Utilitaire: extrait une valeur d'un tableau à un index donné
 */
function pickValueAt(series, index) {
  if (!Array.isArray(series)) return null;
  const value = series[index];
  return value === undefined || value === null ? null : value;
}

/**
 * Utilitaires pour la manipulation des dates et données
 */
function getHourLocalFromIso(iso) {
  // ISO local time string: YYYY-MM-DDTHH:mm
  return parseInt(iso.slice(11, 13), 10);
}

function getDateLocalFromIso(iso) {
  // YYYY-MM-DD
  return iso.slice(0, 10);
}

function sum(values) {
  return values.reduce((acc, v) => acc + (typeof v === "number" ? v : 0), 0);
}

/**
 * Trouve la valeur correspondante à un datetime dans un tableau de données traitées
 */
function findValueByDatetime(dataArray, targetDatetime) {
  const entry = dataArray.find((item) => item.datetime === targetDatetime);
  return entry ? entry.value : null;
}

/**
 * Trouve l'objet complet correspondant à un datetime dans un tableau de données traitées
 */
function findEntryByDatetime(dataArray, targetDatetime) {
  return dataArray.find((item) => item.datetime === targetDatetime) || null;
}

export const buildForecastFromCoordinates = async (lat, lon) => {
  try {
    // 0. Vérification du cache traité d'abord (niveau 2)
    const cacheKey = generateCacheKey(lat, lon);
    console.log(
      `🔍 [ForecastCore] Vérification cache niveau 2 pour clé: ${cacheKey}`
    );

    const cachedProcessed = processedCache.get(cacheKey);

    if (isProcessedCacheValid(cachedProcessed)) {
      console.log(
        `📦 [ForecastCore] Cache HIT niveau 2 (traité) pour ${lat}, ${lon} | clé: ${cacheKey}`
      );
      return cachedProcessed.data;
    }

    console.log(
      `🚀 [ForecastCore] Cache MISS niveau 2 - Début du traitement pour ${lat}, ${lon} | clé: ${cacheKey}`
    );

    // 1. Récupération des données brutes (cache niveau 1 géré par fetchMeteoData)
    const meteoData = await fetchMeteoData(lat, lon);
    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo principales non disponibles");
    }

    const times = meteoData.api1.data.hourly.time;
    const totalHours = times.length;
    console.log(`📊 [ForecastCore] ${totalHours} heures à traiter`);

    // 2. Récupération des données UV et AQI directement depuis fetchMeteoData
    const uvHourly = meteoData?.api2?.data?.hourly?.uv_index || [];
    const aqiHourly = meteoData?.api2?.data?.hourly?.european_aqi || [];

    // 2.1. Récupération des données GraphCast et probabilités
    const graphcastPrecipHourly =
      meteoData?.api1?.data?.hourly?.precipitation_gfs_graphcast025 || [];
    const precipProbaHourly =
      meteoData?.api_precip_proba?.data?.hourly?.precipitation_probability ||
      [];

    // 3. Appel de tous les modules de traitement en parallèle
    console.log(`🔄 [ForecastCore] Appel des modules de traitement...`);
    const [
      temperatureData,
      temperatureApparenteData,
      humiditeData,
      wmoData,
      ventData,
      precipitationsData,
    ] = await Promise.all([
      traiterTemperature(lat, lon).catch((err) => {
        console.warn(`⚠️ Erreur traitement température:`, err.message);
        return [];
      }),
      traiterTemperatureApparente(lat, lon).catch((err) => {
        console.warn(
          `⚠️ Erreur traitement température apparente:`,
          err.message
        );
        return [];
      }),
      traiterHumidite(lat, lon).catch((err) => {
        console.warn(`⚠️ Erreur traitement humidité:`, err.message);
        return [];
      }),
      traiterWmo(lat, lon).catch((err) => {
        console.warn(`⚠️ Erreur traitement WMO:`, err.message);
        return [];
      }),
      traiterVent(lat, lon).catch((err) => {
        console.warn(`⚠️ Erreur traitement vent:`, err.message);
        return [];
      }),
      traiterPrecipitations(lat, lon).catch((err) => {
        console.warn(`⚠️ Erreur traitement précipitations:`, err.message);
        return [];
      }),
    ]);

    console.log(
      `✅ [ForecastCore] Données récupérées - T:${temperatureData.length}, TA:${temperatureApparenteData.length}, H:${humiditeData.length}, WMO:${wmoData.length}, V:${ventData.length}, P:${precipitationsData.length}`
    );

    // 4. Assembly des données horaires
    const hourlyData = [];
    for (let h = 0; h < totalHours; h++) {
      const hourIso = times[h];

      // Trouver les valeurs correspondantes dans chaque dataset
      const temperature = findValueByDatetime(temperatureData, hourIso);
      const apparentTemperature = findValueByDatetime(
        temperatureApparenteData,
        hourIso
      );
      const humidity = findValueByDatetime(humiditeData, hourIso);
      const wmoEntry = findEntryByDatetime(wmoData, hourIso);
      const ventEntry = findEntryByDatetime(ventData, hourIso);
      const precipEntry = findEntryByDatetime(precipitationsData, hourIso);

      hourlyData.push({
        time: hourIso,
        temperature,
        apparentTemperature,
        humidity,
        uvIndex: pickValueAt(uvHourly, h),
        aqi: pickValueAt(aqiHourly, h),
        precipitation: {
          mm: precipEntry?.mm_agg || 0,
          CI: precipEntry?.CI || null,
          IQR: precipEntry?.IQR || null,
          PoP: precipEntry?.PoP || 0,
          graphcast_mm: pickValueAt(graphcastPrecipHourly, h),
          probability: pickValueAt(precipProbaHourly, h),
        },
        wind: {
          speed: ventEntry?.speed || null,
          direction: ventEntry?.direction || null,
          gust: ventEntry?.gust || null,
          gust_max: ventEntry?.gust_max || null,
        },
        wmo: wmoEntry?.value || 0,
        wmoRisque: wmoEntry?.risque || {
          orage: 0,
          grele: 0,
          verglas: 0,
          brouillard: 0,
        },
      });
    }

    // 5. Calcul des agrégations journalières
    console.log(`📅 [ForecastCore] Calcul des agrégations journalières...`);
    const wmoConfig = readConfigJson("wmo.json");
    const dailyData = await calculateDailyAggregations(
      hourlyData,
      wmoData,
      wmoConfig
    );

    console.log(
      `✅ [ForecastCore] Traitement terminé - ${hourlyData.length} heures, ${dailyData.length} jours`
    );
    const elevation = meteoData?.api1?.data?.elevation ?? null;
    // Propager sunrise/sunset dans dailyData si présents
    try {
      const dailyBlock = meteoData?.api1?.data?.daily;
      const dailyTime = dailyBlock?.time || [];

      // Extract sunrise/sunset arrays (may contain suffixes e.g., sunrise_ecmwf_ifs025)
      const sunriseKey = Object.keys(dailyBlock || {}).find((k) =>
        k.startsWith("sunrise")
      );
      const sunsetKey = Object.keys(dailyBlock || {}).find((k) =>
        k.startsWith("sunset")
      );

      const sunrises = sunriseKey ? dailyBlock[sunriseKey] : [];
      const sunsets = sunsetKey ? dailyBlock[sunsetKey] : [];

      if (!sunriseKey || !sunsetKey) {
        console.warn(
          `[ForecastCore] sunrise/sunset arrays not found in dailyBlock (keys: ${Object.keys(
            dailyBlock || {}
          ).join(",")})`
        );
      }

      if (dailyBlock && Array.isArray(dailyTime)) {
        for (let i = 0; i < dailyData.length; i++) {
          const targetDate = dailyData[i]?.date; // YYYY-MM-DD
          const idx = dailyTime.findIndex(
            (t) => typeof t === "string" && t.startsWith(targetDate)
          );
          if (idx >= 0) {
            dailyData[i].sunrise = sunrises[idx];
            dailyData[i].sunset = sunsets[idx];
          }
        }
      }
    } catch (e) {
      console.warn(
        "⚠️ [ForecastCore] Impossible de mapper sunrise/sunset:",
        e?.message || e
      );
    }

    // Préparer l'objet de retour
    const result = { hourlyData, dailyData, elevation };

    // 6. Mise en cache des données traitées (niveau 2)
    processedCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    console.log(
      `📦 [ForecastCore] Données traitées mises en cache niveau 2 pour ${lat}, ${lon}`
    );

    return result;
  } catch (error) {
    console.error(`❌ [ForecastCore] Erreur:`, error.message);
    throw new Error(
      `Erreur lors du traitement des prévisions: ${error.message}`
    );
  }
};

/**
 * Calcule les agrégations journalières avec WMO par tranches horaires
 */
async function calculateDailyAggregations(hourlyData, wmoData, wmoConfig) {
  const bucketsByDate = new Map();

  // Grouper les données par jour et par tranche horaire
  for (let h = 0; h < hourlyData.length; h++) {
    const hourEntry = hourlyData[h];
    const iso = hourEntry.time;
    const dateKey = getDateLocalFromIso(iso);
    const hourLocal = getHourLocalFromIso(iso);

    const rec = bucketsByDate.get(dateKey) || {
      hourIndices: [],
      trancheIndices: {
        "00-06": [],
        "06-12": [],
        "12-18": [],
        "18-00": [],
      },
    };

    rec.hourIndices.push(h);
    if (hourLocal >= 0 && hourLocal < 6) rec.trancheIndices["00-06"].push(h);
    else if (hourLocal >= 6 && hourLocal < 12)
      rec.trancheIndices["06-12"].push(h);
    else if (hourLocal >= 12 && hourLocal < 18)
      rec.trancheIndices["12-18"].push(h);
    else rec.trancheIndices["18-00"].push(h);

    bucketsByDate.set(dateKey, rec);
  }

  const dailyData = [];
  for (const [dateKey, bucket] of bucketsByDate.entries()) {
    // Températures min/max
    const temps = bucket.hourIndices
      .map((i) => hourlyData[i]?.temperature)
      .filter((v) => typeof v === "number");

    // UV max
    const uvSeries = bucket.hourIndices
      .map((i) => hourlyData[i]?.uvIndex)
      .filter((v) => typeof v === "number");

    // Précipitations totales - CORRECTION: utiliser les indices précipitations (preceding_hour)
    // Pour une journée, les précipitations incluent les valeurs des heures 1, 2, 3, ..., 24
    // car la valeur à 01:00 = cumul 00:00→01:00, etc.
    const precipSeries = [];
    for (const hourIndex of bucket.hourIndices) {
      const nextHourIndex = hourIndex + 1;
      if (nextHourIndex < hourlyData.length) {
        precipSeries.push(hourlyData[nextHourIndex]?.precipitation?.mm || 0);
      }
    }

    const tempMin = temps.length ? Math.min(...temps) : null;
    const tempMax = temps.length ? Math.max(...temps) : null;
    const uvMax = uvSeries.length ? Math.max(...uvSeries) : null;
    const precipTotal = sum(precipSeries);

    // WMO par tranches horaires en utilisant smart_bary (cohérence temporelle)
    const byTranche = {};
    for (const tranche of ["00-06", "06-12", "12-18", "18-00"]) {
      const indices = bucket.trancheIndices[tranche];

      // Collecter tous les codes WMO des heures de la tranche depuis wmoData (INSTANT)
      // Les codes WMO utilisent la règle "instant" : 06-12h inclut 06, 07, 08, 09, 10, 11
      const trancheCodes = [];
      for (const hourIndex of indices) {
        const hourIso = hourlyData[hourIndex]?.time;
        if (hourIso) {
          const wmoEntry = findEntryByDatetime(wmoData, hourIso);
          if (wmoEntry && typeof wmoEntry.value === "number") {
            trancheCodes.push(wmoEntry.value);
          }
        }
      }

      // Utiliser smart_bary pour agréger les codes WMO de la tranche
      if (trancheCodes.length > 0) {
        const agg = wmoAlgorithms.smart_bary
          ? wmoAlgorithms.smart_bary(trancheCodes, wmoConfig)
          : wmoAlgorithms.bary(trancheCodes, wmoConfig); // Fallback
        byTranche[tranche] = typeof agg?.wmo === "number" ? agg.wmo : 0;
      } else {
        byTranche[tranche] = 0;
      }
    }

    dailyData.push({
      date: dateKey,
      temperature: { min: tempMin, max: tempMax },
      uv: { max: uvMax },
      precipitation: { total_mm: precipTotal },
      wmo: { byTranche },
    });
  }

  return dailyData;
}

/**
 * Transforme les données quotidiennes en format compatible avec DailyCard
 * Utilise l'algorithme time-slot-smart-bary pour générer les tranches horaires
 */
export function generateDailyCardData(hourlyData, dailyData) {
  const dayNames = [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ];
  const result = [];

  for (let dayIndex = 0; dayIndex < dailyData.length; dayIndex++) {
    const day = dailyData[dayIndex];
    const dayDate = new Date(day.date);
    // Nom du jour robuste: toujours le jour réel (pas de "Demain")
    const dayName = dayNames[dayDate.getDay()];

    // Extraire les données horaires pour cette journée
    const startHour = dayIndex * 24;
    const endHour = Math.min(startHour + 24, hourlyData.length);
    const dayHourlyData = hourlyData.slice(startHour, endHour);

    // Générer les tranches horaires avec l'algorithme smart_bary
    const timeSlots = aggregateTimeSlots(dayHourlyData);

    // Formater la date (ex: "15 Nov")
    const formattedDate = dayDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });

    // Préparer les données pour DailyCard
    const dailyCardData = {
      dayName,
      date: formattedDate,
      tempMax: day.temperature?.max || 0,
      tempMin: day.temperature?.min || 0,
      uvIndex: day.uv?.max || undefined,
      precipitation_total: day.precipitation?.total_mm || 0,
      timeSlots: timeSlots.map((slot) => ({
        tranche: slot.tranche,
        code_wmo_final: slot.code_wmo_final,
        risques: slot.risques || [],
        precipitation_total: slot.precipitation_total || 0,
        debug: slot.debug,
      })),
      isToday: dayIndex === 0,
      sunrise: day.sunrise,
      sunset: day.sunset,
    };

    result.push(dailyCardData);
  }

  return result;
}

// Export par défaut pour compatibilité
export default buildForecastFromCoordinates;

// Export legacy pour la transition (deprecated)
export const buildForecastFromHourly = (hourly, dailyExtras = null) => {
  console.warn(
    `⚠️ [ForecastCore] buildForecastFromHourly est déprécié. Utilisez buildForecastFromCoordinates(lat, lon) à la place.`
  );
  throw new Error(
    "buildForecastFromHourly est déprécié. Utilisez buildForecastFromCoordinates(lat, lon) avec des coordonnées GPS."
  );
};
