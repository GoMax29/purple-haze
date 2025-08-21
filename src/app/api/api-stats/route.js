import { NextResponse } from "next/server";

// Compteurs côté serveur (en mémoire, seront perdus au redémarrage)
let serverCounters = {
  minute: 0,
  hour: 0,
  day: 0,
  month: 0,
};

let serverLimits = {
  minute: 600,
  hour: 5000,
  day: 10000,
  month: 300000,
};

let lastReset = {
  minute: new Date(),
  hour: new Date(),
  day: new Date(),
  month: new Date(),
};

const COST_PER_CALL = 12.1;

/**
 * Vérifie et reset automatiquement les compteurs selon les périodes
 */
function checkAndResetCounters(now) {
  // Reset minute (chaque minute)
  if (
    now.getMinutes() !== lastReset.minute.getMinutes() ||
    now.getHours() !== lastReset.minute.getHours()
  ) {
    serverCounters.minute = 0;
    lastReset.minute = now;
    console.log(`🔄 [ServerApiCounter] Reset compteur minute`);
  }

  // Reset hour (chaque heure)
  if (
    now.getHours() !== lastReset.hour.getHours() ||
    now.getDate() !== lastReset.hour.getDate()
  ) {
    serverCounters.hour = 0;
    lastReset.hour = now;
    console.log(`🔄 [ServerApiCounter] Reset compteur heure`);
  }

  // Reset day (chaque jour à 00h)
  if (now.getDate() !== lastReset.day.getDate()) {
    serverCounters.day = 0;
    lastReset.day = now;
    console.log(`🔄 [ServerApiCounter] Reset compteur jour`);
  }

  // Reset month (chaque 1er du mois)
  if (
    now.getMonth() !== lastReset.month.getMonth() ||
    now.getFullYear() !== lastReset.month.getFullYear()
  ) {
    serverCounters.month = 0;
    lastReset.month = now;
    console.log(`🔄 [ServerApiCounter] Reset compteur mois`);
  }
}

/**
 * Calcule le prochain reset pour une période donnée
 */
function getNextResetTime(period) {
  const now = new Date();
  let next = new Date(now);

  switch (period) {
    case "minute":
      next.setMinutes(now.getMinutes() + 1, 0, 0);
      break;
    case "hour":
      next.setHours(now.getHours() + 1, 0, 0, 0);
      break;
    case "day":
      next.setDate(now.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      break;
    case "month":
      next.setMonth(now.getMonth() + 1, 1);
      next.setHours(0, 0, 0, 0);
      break;
  }

  return next.toLocaleString("fr-FR");
}

/**
 * Enregistre un appel API
 */
function recordServerApiCall() {
  const now = new Date();
  checkAndResetCounters(now);

  serverCounters.minute += COST_PER_CALL;
  serverCounters.hour += COST_PER_CALL;
  serverCounters.day += COST_PER_CALL;
  serverCounters.month += COST_PER_CALL;

  console.log(
    `📊 [ServerApiCounter] +${COST_PER_CALL} calls | Minute: ${serverCounters.minute}/${serverLimits.minute}`
  );
}

/**
 * GET - Récupère les stats des appels API
 */
export async function GET() {
  try {
    const now = new Date();
    checkAndResetCounters(now);

    const stats = {
      minute: {
        count: Math.round(serverCounters.minute * 10) / 10,
        limit: serverLimits.minute,
        resetTime: getNextResetTime("minute"),
      },
      hour: {
        count: Math.round(serverCounters.hour * 10) / 10,
        limit: serverLimits.hour,
        resetTime: getNextResetTime("hour"),
      },
      day: {
        count: Math.round(serverCounters.day * 10) / 10,
        limit: serverLimits.day,
        resetTime: getNextResetTime("day"),
      },
      month: {
        count: Math.round(serverCounters.month * 10) / 10,
        limit: serverLimits.month,
        resetTime: getNextResetTime("month"),
      },
      lastUpdate: now.toLocaleTimeString("fr-FR"),
      source: "server",
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("❌ [API /api-stats] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stats API" },
      { status: 500 }
    );
  }
}

/**
 * POST - Reset tous les compteurs (pour debug)
 */
export async function POST() {
  try {
    serverCounters = { minute: 0, hour: 0, day: 0, month: 0 };
    const now = new Date();
    lastReset = { minute: now, hour: now, day: now, month: now };

    console.log(`🔄 [ServerApiCounter] Reset manuel de tous les compteurs`);

    return NextResponse.json({
      success: true,
      message: "Compteurs réinitialisés",
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("❌ [API /api-stats] Erreur reset:", error);
    return NextResponse.json(
      { error: "Erreur lors du reset des compteurs" },
      { status: 500 }
    );
  }
}
