import { NextRequest, NextResponse } from "next/server";
import { traiterWmo } from "../../../../../../traitement/wmo.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lon = parseFloat(searchParams.get("lon"));

    // Validation des paramètres
    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        {
          success: false,
          error: "Paramètres lat et lon requis et doivent être des nombres",
        },
        { status: 400 }
      );
    }

    // Validation des plages
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return NextResponse.json(
        {
          success: false,
          error: "Coordonnées invalides (lat: -90 à 90, lon: -180 à 180)",
        },
        { status: 400 }
      );
    }

    console.log(`🔥 [API WMO Agrégé] Traitement pour lat=${lat}, lon=${lon}`);

    // Appeler la fonction de traitement WMO (même fonction mais endpoint dédié pour l'agrégation)
    const data = await traiterWmo(lat, lon);

    console.log(`🔥 [API WMO Agrégé] ${data.length} points de données traités`);

    // Lire la configuration pour obtenir l'algorithme réel
    const fs = require("fs");
    const path = require("path");
    let actualAlgorithm = "unknown";
    let configData = null;
    try {
      const configPath = path.join(process.cwd(), "config", "wmo.json");
      const rawConfigData = fs.readFileSync(configPath, "utf-8");
      configData = JSON.parse(rawConfigData);
      actualAlgorithm = configData.algorithm;
      console.log(`🔥 [API WMO Agrégé] Algorithme utilisé: ${actualAlgorithm}`);
    } catch (configError) {
      console.error(
        "❌ [API WMO Agrégé] Erreur lecture config:",
        configError.message
      );
    }

    // Calculer des statistiques spécifiques pour l'agrégation
    const validData = data.filter(
      (d) => d.value !== null && d.value !== undefined
    );
    const codes = validData.map((d) => d.value);
    const algorithms = validData.map((d) => d.debug?.algorithm).filter(Boolean);

    // Distribution des codes
    const codeDistribution = {};
    codes.forEach((code) => {
      codeDistribution[code] = (codeDistribution[code] || 0) + 1;
    });

    // Distribution des algorithmes
    const algorithmDistribution = {};
    algorithms.forEach((algo) => {
      algorithmDistribution[algo] = (algorithmDistribution[algo] || 0) + 1;
    });

    // Modèles actifs
    const enabledModels = configData
      ? Object.entries(configData.models)
          .filter(([key, model]) => model.enabled)
          .map(([key, model]) => ({ key, name: model.name }))
      : [];

    return NextResponse.json({
      success: true,
      data: data,
      metadata: {
        algorithm: actualAlgorithm,
        data_points: data.length,
        valid_points: validData.length,
        time_range: {
          start: data[0]?.datetime,
          end: data[data.length - 1]?.datetime,
        },
        coordinates: { lat, lon },
        statistics: {
          code_distribution: codeDistribution,
          algorithm_distribution: algorithmDistribution,
        },
        enabled_models: enabledModels,
        total_models: configData ? Object.keys(configData.models).length : 0,
      },
    });
  } catch (error) {
    console.error("❌ [API WMO Agrégé] Erreur:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
