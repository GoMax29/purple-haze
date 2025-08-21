import traiterHumidite from "../../../../../traitement/humidite.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat")) || 47.8322; // Plomeur par défaut
    const lon = parseFloat(searchParams.get("lon")) || -4.2967;

    if (isNaN(lat) || isNaN(lon)) {
      return Response.json(
        { error: "Paramètres lat/lon invalides" },
        { status: 400 }
      );
    }

    const data = await traiterHumidite(lat, lon);

    return Response.json({
      success: true,
      data,
      metadata: {
        latitude: lat,
        longitude: lon,
        parameter: "humidite",
        count: data.length,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur API humidité:", error);
    return Response.json(
      {
        error: "Erreur lors du traitement de l'humidité",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
