import { NextResponse } from "next/server";
import buildForecastFromCoordinates, {
  generateDailyCardData,
} from "../../../core/forecastCore.js";
// import { recordServerApiCall } from "../api-stats/route.js"; // Fonction non accessible depuis API route

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");

    if (!latStr || !lonStr) {
      return NextResponse.json({ error: "lat et lon requis" }, { status: 400 });
    }

    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json(
        { error: "Coordonnées invalides" },
        { status: 400 }
      );
    }

    console.log(`📡 [API /forecast] Traitement pour ${lat}, ${lon}`);

    // Enregistrer l'appel API dans le compteur serveur
    // recordServerApiCall(); // Pas disponible depuis API route

    // Utiliser la nouvelle fonction buildForecastFromCoordinates
    const forecastData = await buildForecastFromCoordinates(lat, lon);

    // Générer les données pour DailyCard avec timeSlots
    const dailyCardData = generateDailyCardData(
      forecastData.hourlyData,
      forecastData.dailyData
    );

    const response = {
      success: true,
      forecastData: {
        hourlyData: forecastData.hourlyData,
        dailyData: forecastData.dailyData,
      },
      dailyCardData: dailyCardData,
      metadata: {
        latitude: lat,
        longitude: lon,
        elevation: forecastData.elevation ?? null,
        hourly_count: forecastData.hourlyData?.length || 0,
        daily_count: forecastData.dailyData?.length || 0,
        daily_card_count: dailyCardData?.length || 0,
        generated_at: new Date().toISOString(),
        algorithm: "time-slot-smart-bary",
      },
    };

    console.log(
      `✅ [API /forecast] Données générées: ${response.metadata.daily_card_count} jours avec timeSlots`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ [API /forecast] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la génération des prévisions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
