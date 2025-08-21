import { traiterPrecipitations } from "../../../../../traitement/precipitations.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat"));
    const lon = parseFloat(searchParams.get("lon"));

    if (isNaN(lat) || isNaN(lon)) {
      return Response.json(
        { success: false, error: "lat et lon requis (nombre)" },
        { status: 400 }
      );
    }

    console.log(`[API] Précipitations pour ${lat}, ${lon}`);
    const data = await traiterPrecipitations(lat, lon);

    return Response.json(
      {
        success: true,
        data,
        meta: {
          lat,
          lon,
          algorithm: "gaussian_weighted_log_optional",
          data_points: data.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] Erreur précipitations:", error);
    return Response.json(
      {
        success: false,
        error: error.message || "Erreur traitement précipitations",
      },
      { status: 500 }
    );
  }
}
