import { NextRequest, NextResponse } from "next/server";
import { traiterVent } from "../../../../../traitement/wind.js";

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

    console.log(`🌪️ [API Wind] Traitement pour lat=${lat}, lon=${lon}`);

    // Appeler la fonction de traitement Vent
    const data = await traiterVent(lat, lon);

    console.log(`🌪️ [API Wind] ${data.length} points de données traités`);

    // Lire la configuration pour obtenir l'algorithme réel
    const fs = require("fs");
    const path = require("path");
    let actualAlgorithm = "unknown";
    try {
      const configPath = path.join(process.cwd(), "config", "wind.json");
      const configData = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configData);
      actualAlgorithm = config.algorithm;
      console.log(`🌪️ [API Wind] Algorithme utilisé: ${actualAlgorithm}`);
    } catch (configError) {
      console.error(
        "❌ [API Wind] Erreur lecture config:",
        configError.message
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      metadata: {
        parameter: "wind",
        algorithm: actualAlgorithm,
        total_points: data.length,
        coordinates: { lat, lon },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("❌ [API Wind] Erreur:", error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}



