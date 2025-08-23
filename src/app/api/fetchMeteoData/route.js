import { NextResponse } from "next/server";
import {
  fetchMeteoData,
  fetchMeteoDataBySpot,
  getPredefinedSpots,
} from "@/lib/fetchMeteoData";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const spot = searchParams.get("spot");
    const forceRefresh = searchParams.get("forceRefresh") === "true";
    const lat = searchParams.get("lat") || searchParams.get("latitude");
    const lon = searchParams.get("lon") || searchParams.get("longitude");

    if (spot) {
      try {
        const data = await fetchMeteoDataBySpot(spot, { forceRefresh });
        return NextResponse.json(data);
      } catch (e) {
        return NextResponse.json(
          {
            error: e?.message,
            predefined_spots: Object.keys(getPredefinedSpots()),
          },
          { status: 400 }
        );
      }
    }

    if (!lat || !lon) {
      return NextResponse.json(
        {
          error:
            "Paramètres requis: lat & lon (ou latitude & longitude) ou spot",
          examples: [
            "/api/fetchMeteoData?lat=48.3903&lon=-4.4863",
            "/api/fetchMeteoData?latitude=48.3903&longitude=-4.4863",
            "/api/fetchMeteoData?spot=brest",
          ],
        },
        { status: 400 }
      );
    }

    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    if (isNaN(latNum) || isNaN(lonNum)) {
      return NextResponse.json(
        { error: "Coordonnées invalides" },
        { status: 400 }
      );
    }

    const data = await fetchMeteoData(latNum, lonNum, { forceRefresh });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
