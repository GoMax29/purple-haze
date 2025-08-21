/**
 * Traitement des précipitations horaires
 * - Agrégation mm via pondération gaussienne (+ log optionnel)
 * - Liste des modèles mouillant (> seuil)
 * - CI, IQR
 * - PoP simplifiée
 */

import { aggregatePrecipMm } from "../shared/precipitation_mm.algorithms.js";
import { computePoP } from "../shared/precipitation_%.algorithms.js";
import { fetchMeteoData } from "../src/lib/fetchMeteoData.js";

import fs from "fs";
import path from "path";

// fetchMeteoData importé depuis pages/api/fetchMeteoData.js

export async function traiterPrecipitations(lat, lon) {
  const configPath = path.join(process.cwd(), "config", "precipitation.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  // 1) Récupérer les données brutes (API1 multi-modèles)
  const meteoData = await fetchMeteoData(lat, lon);
  if (!meteoData?.api1?.data?.hourly) {
    throw new Error("Données météo API1 non disponibles pour précipitations");
  }
  const api1Data = meteoData.api1.data;
  const { time: hours } = api1Data.hourly;

  const modelEntries = Object.entries(config.models);
  const n = hours.length;

  const results = [];
  for (let h = 0; h < n; h++) {
    const hourIso = hours[h];
    // Construire la liste des valeurs modèles pour cette heure
    const modelsValues = [];
    for (const [modelKey, modelCfg] of modelEntries) {
      if (!modelCfg.enabled) continue;
      const [minHour, maxHour] = modelCfg.forecast_hours || [0, n - 1];
      const hourFromNow = h;
      if (hourFromNow < minHour || hourFromNow > maxHour) continue;

      const paramKey = `${config.api_parameter}_${modelKey}`; // ex: precipitation_ecmwf_ifs025
      const series = api1Data.hourly[paramKey];
      if (!series || !Array.isArray(series)) continue;
      const mm = series[h];
      if (mm === null || mm === undefined) continue;
      modelsValues.push({
        modelKey,
        short: modelCfg.short || modelKey,
        name: modelCfg.name || modelKey,
        mm,
      });
    }

    // Agrégation mm + mouillant + CI + IQR
    const { mm_agg, mouillant, CI, IQR } = aggregatePrecipMm(
      modelsValues,
      config
    );

    // PoP simplifiée
    const totalModels = modelEntries.filter(
      ([, m]) => m.enabled !== false
    ).length;
    const wetCount = mouillant.length;
    const forecastHour = h; // supposé à partir de 0
    const PoP = computePoP(
      { totalModels, wetCount, mmAgg: mm_agg, forecastHour },
      config
    );

    results.push({ datetime: hourIso, mm_agg, mouillant, CI, IQR, PoP });
  }

  return results;
}
