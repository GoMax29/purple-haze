import { NextRequest, NextResponse } from "next/server";
import { traiterWmo } from "../../../../../traitement/wmo.js";

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

    console.log(`🔥 [API WMO] Traitement pour lat=${lat}, lon=${lon}`);

    // Appeler la fonction de traitement WMO
    const data = await traiterWmo(lat, lon);

    console.log(`🔥 [API WMO] ${data.length} points de données traités`);

    // Lire la configuration pour obtenir l'algorithme réel
    const fs = require("fs");
    const path = require("path");
    let actualAlgorithm = "unknown";
    try {
      const configPath = path.join(process.cwd(), "config", "wmo.json");
      const configData = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(configData);
      actualAlgorithm = config.algorithm;
      console.log(`🔥 [API WMO] Algorithme utilisé: ${actualAlgorithm}`);
    } catch (configError) {
      console.error("❌ [API WMO] Erreur lecture config:", configError.message);
    }

    return NextResponse.json({
      success: true,
      data: data,
      metadata: {
        algorithm: actualAlgorithm,
        data_points: data.length,
        time_range: {
          start: data[0]?.datetime,
          end: data[data.length - 1]?.datetime,
        },
        coordinates: { lat, lon },
      },
    });
  } catch (error) {
    console.error("Erreur API WMO:", error);

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
