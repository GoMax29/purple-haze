import { NextResponse } from "next/server";
import { fetchMeteoData } from "../../../../lib/fetchMeteoData.js";
import { buildForecastFromHourly } from "../../../../core/forecastCore.js";

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

    // Récupération des données unifiées (API1/2)
    const unified = await fetchMeteoData(lat, lon);

    // Données horaires API1 (objet avec time + séries par modèle)
    const hourlySeries = unified?.api1?.data?.hourly;
    const uv = unified?.api2?.data?.hourly?.uv_index || [];
    const aqi = unified?.api2?.data?.hourly?.european_aqi || [];

    const dailyExtras = { hourly: { uv_index: uv, european_aqi: aqi } };

    // Construire via le core
    const coreResult = buildForecastFromHourly(hourlySeries, dailyExtras);

    // Normaliser pour supporter les deux variantes demandées par l’UI
    const response = {
      hourlyData: coreResult.hourlyData || coreResult.hourly || [],
      dailyData: coreResult.dailyData || coreResult.days || [],
      hourly: coreResult.hourlyData || coreResult.hourly || [],
      days: coreResult.dailyData || coreResult.days || [],
      meta: {
        lat,
        lon,
        generated_at: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("results_all API error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne" },
      { status: 500 }
    );
  }
}
