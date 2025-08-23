import { NextResponse } from "next/server";
import { buildForecastFromCoordinates } from "@/core/forecastCore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat =
      searchParams.get("lat") || searchParams.get("latitude") || "47.8322";
    const lon =
      searchParams.get("lon") || searchParams.get("longitude") || "-4.2967";

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json(
        {
          success: false,
          error: "Les coordonnées doivent être des nombres valides",
        },
        { status: 400 }
      );
    }

    console.log(
      `🎯 [Final Params] Test complet forecastCore: ${latNum}, ${lonNum}`
    );
    const start = Date.now();
    const { hourlyData, dailyData } = await buildForecastFromCoordinates(
      latNum,
      lonNum
    );
    const processingTime = Date.now() - start;

    const stats = {
      coordinates: { lat: latNum, lon: lonNum },
      processing_time_ms: processingTime,
      data_coverage: {
        hourly_points: hourlyData.length,
        daily_points: dailyData.length,
        temperature: hourlyData.filter((h) => h.temperature !== null).length,
        apparent_temperature: hourlyData.filter(
          (h) => h.apparentTemperature !== null
        ).length,
        humidity: hourlyData.filter((h) => h.humidity !== null).length,
        wind_speed: hourlyData.filter((h) => h.wind?.speed !== null).length,
        wind_direction: hourlyData.filter((h) => h.wind?.direction !== null)
          .length,
        wind_gust: hourlyData.filter((h) => h.wind?.gust !== null).length,
        precipitation_mm: hourlyData.filter(
          (h) => (h.precipitation?.mm || 0) > 0
        ).length,
        precipitation_pop: hourlyData.filter(
          (h) => (h.precipitation?.PoP || 0) > 0
        ).length,
        wmo: hourlyData.filter((h) => h.wmo !== null && h.wmo !== 0).length,
        uv_index: hourlyData.filter((h) => h.uvIndex !== null).length,
        aqi: hourlyData.filter((h) => h.aqi !== null).length,
      },
    };

    return NextResponse.json({
      success: true,
      message: "OK",
      stats,
      data: { hourlyData, dailyData },
    });
  } catch (error) {
    console.error(`❌ [Final Params] Erreur:`, error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Erreur serveur",
        examples: [
          "/api/test-param/final-params?lat=47.8322&lon=-4.2967",
          "/api/test-param/final-params?latitude=48.3903&longitude=-4.4863",
        ],
      },
      { status: 500 }
    );
  }
}
