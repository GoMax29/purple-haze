import traiterTemperatureApparente from "../../../../../traitement/temperature_apparente.js";

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

    const data = await traiterTemperatureApparente(lat, lon);

    return Response.json({
      success: true,
      data,
      metadata: {
        latitude: lat,
        longitude: lon,
        parameter: "apparent_temperature",
        count: data.length,
        generated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erreur API température apparente:", error);
    return Response.json(
      {
        error: "Erreur lors du traitement de la température apparente",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
