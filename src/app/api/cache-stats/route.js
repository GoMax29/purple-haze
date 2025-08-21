import { NextResponse } from "next/server";
import { getAllCacheStats } from "../../../core/forecastCore.js";

/**
 * API Route pour récupérer les statistiques des caches multi-niveaux
 * GET /api/cache-stats
 */
export async function GET(request) {
  try {
    console.log(`📊 [API /cache-stats] Récupération des stats de cache...`);

    // Récupérer les stats combinées des deux niveaux de cache
    const stats = getAllCacheStats();

    // Ajouter des métadonnées temporelles
    const response = {
      ...stats,
      retrieved_at: new Date().toISOString(),
      request_url: request.url,
    };

    console.log(`✅ [API /cache-stats] Stats récupérées avec succès`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ [API /cache-stats] Erreur:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des stats de cache",
        details: error.message,
        cache_system: "error",
        retrieved_at: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Méthodes non supportées
export async function POST() {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: "Méthode non autorisée" }, { status: 405 });
}




