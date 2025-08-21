import { fetchMeteoData } from "../src/lib/fetchMeteoData.js";
import { gaussian_weighted } from "../shared/gaussian_weighted.js";
import { aggregateWindDirectionGaussian } from "../shared/wind_direction.algorithms.js";
import fs from "fs";
import path from "path";

/**
 * Traite les données de vent (force, rafales, direction)
 * Sortie horaire: { datetime, speed, gust, gust_max, direction }
 * - speed: vent moyen agrégé (km/h)
 * - gust: rafales agrégées (km/h)
 * - gust_max: rafale maximale parmi les modèles (km/h)
 * - direction: direction agrégée (degrés 0-360)
 */
export async function traiterVent(lat, lon) {
  try {
    // 1. Charger la configuration
    const configPath = path.join(process.cwd(), "config", "wind.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    // 2. Récupérer les données météo
    const meteoData = await fetchMeteoData(lat, lon);
    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo API1 non disponibles");
    }
    const api1 = meteoData.api1.data;
    const hours = api1.hourly.time;

    const results = [];
    const modelEntries = Object.entries(config.models);

    for (let h = 0; h < hours.length; h++) {
      const datetime = hours[h];
      const hourFromNow = h;

      const valuesSpeed = [];
      const valuesGust = [];
      const valuesDir = [];

      let gustMax = null;

      for (const [modelKey, modelCfg] of modelEntries) {
        if (!modelCfg.enabled) continue;
        const [minHour, maxHour] = modelCfg.forecast_hours;
        if (hourFromNow < minHour || hourFromNow > maxHour) continue;

        const speedKey = `${config.api_parameters.speed}_${modelKey}`;
        const gustKey = `${config.api_parameters.gust}_${modelKey}`;
        const dirKey = `${config.api_parameters.direction}_${modelKey}`;

        const speedSeries = api1.hourly[speedKey];
        const gustSeries = api1.hourly[gustKey];
        const dirSeries = api1.hourly[dirKey];

        const s = Array.isArray(speedSeries) ? speedSeries[h] : null;
        const g = Array.isArray(gustSeries) ? gustSeries[h] : null;
        const d = Array.isArray(dirSeries) ? dirSeries[h] : null;

        if (s !== null && s !== undefined) valuesSpeed.push(s);
        if (g !== null && g !== undefined) {
          valuesGust.push(g);
          if (gustMax === null || g > gustMax) gustMax = g;
        }
        if (d !== null && d !== undefined) valuesDir.push(d);
      }

      // Agrégation
      let speedAgg = null;
      let gustAgg = null;
      let directionAgg = null;

      if (valuesSpeed.length > 0) {
        try {
          speedAgg = gaussian_weighted(
            valuesSpeed,
            config.algorithm_params.sigma_speed
          );
        } catch {
          speedAgg =
            valuesSpeed.reduce((a, b) => a + b, 0) / valuesSpeed.length;
        }
      }

      if (valuesGust.length > 0) {
        try {
          gustAgg = gaussian_weighted(
            valuesGust,
            config.algorithm_params.sigma_gust
          );
        } catch {
          gustAgg = valuesGust.reduce((a, b) => a + b, 0) / valuesGust.length;
        }
      }

      if (valuesDir.length > 0) {
        try {
          directionAgg = aggregateWindDirectionGaussian(valuesDir, {
            sigmaDeg: config.algorithm_params.sigma_direction_deg,
          });
        } catch {
          // fallback: moyenne vectorielle simple via algo utilitaire
          directionAgg = aggregateWindDirectionGaussian(valuesDir, {
            sigmaDeg: 180,
          });
        }
      }

      if (speedAgg !== null || gustAgg !== null || directionAgg !== null) {
        results.push({
          datetime,
          speed: speedAgg !== null ? Math.round(speedAgg * 10) / 10 : null,
          gust: gustAgg !== null ? Math.round(gustAgg * 10) / 10 : null,
          gust_max: gustMax !== null ? Math.round(gustMax * 10) / 10 : null,
          direction: directionAgg !== null ? Math.round(directionAgg) : null,
        });
      }
    }

    return results;
  } catch (error) {
    throw new Error(`Erreur traitement vent: ${error.message}`);
  }
}

export async function getVentStats(lat, lon) {
  const config = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "config", "wind.json"), "utf-8")
  );
  const data = await traiterVent(lat, lon);
  const speeds = data.map((d) => d.speed).filter((v) => v !== null);
  const gusts = data.map((d) => d.gust).filter((v) => v !== null);
  return {
    parameter: config.parameter,
    units: config.unit,
    algorithm: config.algorithm,
    sigma_speed: config.algorithm_params.sigma_speed,
    sigma_gust: config.algorithm_params.sigma_gust,
    sigma_direction_deg: config.algorithm_params.sigma_direction_deg,
    data_points: data.length,
    speed: speeds.length
      ? { min: Math.min(...speeds), max: Math.max(...speeds) }
      : null,
    gust: gusts.length
      ? { min: Math.min(...gusts), max: Math.max(...gusts) }
      : null,
  };
}

export default traiterVent;
