/**
 * Module fetchMeteoData.js
 *
 * Récupère les données météorologiques depuis trois APIs Open-Meteo en parallèle :
 * - API 1 : Données principales météo (0h à 168h) - multiple modèles
 * - API 2 : UV et qualité de l'air (heure par heure)
 * - API 3 : Données de houle (DÉSACTIVÉ temporairement pour économiser les appels)
 *
 * Fonctionnalités :
 * - Cache mémoire par coordonnées GPS avec TTL de 15 minutes
 * - Requêtes parallèles pour optimiser les performances
 * - Structure unifiée de retour
 * - Support des spots au large (pas seulement des villes)
 * - Gestion d'erreurs robuste
 * - Comptage des appels API en temps réel
 */

// Import du compteur d'appels API
let apiCallsCounter = null;
// Import dynamique pour éviter les problèmes de compatibilité Next.js
const initApiCounter = async () => {
  if (typeof window !== "undefined" && !apiCallsCounter) {
    try {
      const { apiCallsCounter: counter } = await import(
        "../services/apiCallsCounter.ts"
      );
      apiCallsCounter = counter;
    } catch (e) {
      console.warn("⚠️ Impossible de charger le compteur API:", e.message);
    }
  }
};

// Configuration des spots (temporaire - sera importée depuis config/spots.js)
const PREDEFINED_SPOTS = {
  // Villes côtières bretonnes
  brest: { lat: 48.3903, lon: -4.4863, name: "Brest", type: "ville" },
  quimper: { lat: 47.9963, lon: -4.0985, name: "Quimper", type: "ville" },
  lorient: { lat: 47.7482, lon: -3.3616, name: "Lorient", type: "ville" },
  vannes: { lat: 47.6587, lon: -2.7603, name: "Vannes", type: "ville" },
  rennes: { lat: 48.1173, lon: -1.6778, name: "Rennes", type: "ville" },
  "saint-malo": {
    lat: 48.6497,
    lon: -2.0251,
    name: "Saint-Malo",
    type: "ville",
  },
  ploumanach: {
    lat: 48.8313,
    lon: -3.4623,
    name: "Ploumanac'h",
    type: "ville",
  },
  crozon: { lat: 48.2474, lon: -4.4896, name: "Crozon", type: "ville" },
  douarnenez: { lat: 48.0926, lon: -4.3286, name: "Douarnenez", type: "ville" },
  concarneau: { lat: 47.8736, lon: -3.9179, name: "Concarneau", type: "ville" },

  // Spots de surf
  "la-torche": {
    lat: 47.8359,
    lon: -4.3722,
    name: "La Torche",
    type: "surf_spot",
  },
  "hossegor-offshore": {
    lat: 43.65,
    lon: -1.45,
    name: "Hossegor Large",
    type: "offshore",
  },
  "cap-frehel": {
    lat: 48.6833,
    lon: -2.3167,
    name: "Cap Fréhel",
    type: "surf_spot",
  },
  "pointe-du-raz": {
    lat: 48.0333,
    lon: -4.7333,
    name: "Pointe du Raz",
    type: "surf_spot",
  },
};

// Interrupteur pour activer/désactiver le cache
const USE_CACHE = true; // Mettre à false pour désactiver le cache

// Cache mémoire avec TTL
const cache = new Map();
const TTL_MINUTES = 15;
const TTL_MS = TTL_MINUTES * 60 * 1000;

/**
 * Génère les URLs pour les APIs en fonction des coordonnées GPS
 * @param {number} latitude - Latitude du spot/lieu
 * @param {number} longitude - Longitude du spot/lieu
 * @returns {Object} Objet contenant les URLs
 */
function generateApiUrls(latitude, longitude) {
  const timezone = "auto";

  // API 1 - Données principales météo (multi-modèles) + daily sunrise/sunset
  const api1Url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=sunrise,sunset&models=ecmwf_ifs025,gfs_global,gfs_graphcast025,icon_global,icon_eu,knmi_harmonie_arome_europe,meteofrance_arpege_europe,meteofrance_arome_france,meteofrance_arome_france_hd,ukmo_global_deterministic_10km,ukmo_uk_deterministic_2km&timezone=${timezone}`;

  // API 2 - UV et qualité de l'air
  const api2Url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&hourly=european_aqi,uv_index,uv_index_clear_sky&timezone=${timezone}`;

  // API 3 - Données de houle (DÉSACTIVÉ temporairement)
  const api3Url = null; // Désactivé pour économiser les appels

  return { api1Url, api2Url, api3Url };
}

/**
 * Vérifie si les données en cache sont encore valides
 * @param {Object} cacheEntry - Entrée du cache
 * @returns {boolean} True si les données sont encore valides
 */
function isCacheValid(cacheEntry) {
  return cacheEntry && Date.now() - cacheEntry.timestamp < TTL_MS;
}

/**
 * Effectue une requête HTTP avec gestion d'erreur
 * @param {string} url - URL à appeler
 * @param {string} apiName - Nom de l'API pour les logs
 * @returns {Promise<Object>} Données de l'API
 */
async function fetchWithErrorHandling(url, apiName) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `${apiName}: HTTP ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();

    if (!data || !data.hourly) {
      throw new Error(`${apiName}: Structure de données invalide`);
    }

    return data;
  } catch (error) {
    console.error(`Erreur ${apiName}:`, error.message);
    throw new Error(`${apiName}: ${error.message}`);
  }
}

/**
 * Valide les coordonnées GPS
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @throws {Error} Si les coordonnées sont invalides
 */
function validateCoordinates(latitude, longitude) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new Error("Les coordonnées doivent être des nombres");
  }

  if (latitude < -90 || latitude > 90) {
    throw new Error("La latitude doit être comprise entre -90 et 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error("La longitude doit être comprise entre -180 et 180");
  }
}

/**
 * Génère une clé de cache unique pour des coordonnées
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {string} Clé de cache formatée
 */
function generateCacheKey(latitude, longitude) {
  // Arrondir à 4 décimales pour éviter des caches différents pour des coordonnées très proches
  const latRounded = Math.round(latitude * 10000) / 10000;
  const lonRounded = Math.round(longitude * 10000) / 10000;
  return `${latRounded},${lonRounded}`;
}

/**
 * Fonction principale : récupère les données météo pour des coordonnées GPS
 * @param {number} latitude - Latitude du spot/lieu
 * @param {number} longitude - Longitude du spot/lieu
 * @param {Object} options - Options supplémentaires
 * @param {string} options.name - Nom du spot (optionnel, pour les logs)
 * @param {boolean} options.forceRefresh - Force le rafraîchissement du cache
 * @returns {Promise<Object>} Données unifiées des trois APIs
 */
export async function fetchMeteoData(latitude, longitude, options = {}) {
  // Validation des paramètres
  validateCoordinates(latitude, longitude);

  // Génération de la clé de cache
  const cacheKey = generateCacheKey(latitude, longitude);
  const cachedData = cache.get(cacheKey);

  // Nom du spot pour les logs (utilise les coordonnées si pas de nom fourni)
  const spotName =
    options.name || `${latitude.toFixed(4)},${longitude.toFixed(4)}`;

  if (USE_CACHE && !options.forceRefresh && isCacheValid(cachedData)) {
    console.log(`Cache HIT pour ${spotName} (${TTL_MINUTES}min TTL)`);
    return cachedData.data;
  }

  console.log(`Cache MISS pour ${spotName} - Récupération des données API...`);

  try {
    // Initialiser le compteur d'appels si côté client
    await initApiCounter();

    // Génération des URLs
    const { api1Url, api2Url, api3Url } = generateApiUrls(latitude, longitude);

    // Enregistrer l'appel API1 dans le compteur
    if (apiCallsCounter) {
      apiCallsCounter.recordApiCall();
    }

    // Appels parallèles aux APIs (API3 désactivée)
    const apiCalls = [
      fetchWithErrorHandling(api1Url, "API Météo Principale"),
      fetchWithErrorHandling(api2Url, "API UV/Qualité Air"),
    ];

    // Ajouter API3 seulement si activée
    if (api3Url) {
      apiCalls.push(fetchWithErrorHandling(api3Url, "API Houle/Marine"));
    }

    const results = await Promise.allSettled(apiCalls);
    const [api1Res, api2Res, api3Res] = results;

    if (api1Res.status === "rejected") {
      // Sans API1 impossible de continuer
      throw new Error(
        api1Res.reason.message || "API météo principale indisponible"
      );
    }
    const api1Data = api1Res.value;
    const api2Data = api2Res.status === "fulfilled" ? api2Res.value : null;
    const api3Data =
      api3Res && api3Res.status === "fulfilled" ? api3Res.value : null;

    // Structure unifiée de retour
    const unifiedData = {
      coordinates: { lat: latitude, lon: longitude },
      spot_name: spotName,
      timestamp: new Date().toISOString(),
      ttl_minutes: TTL_MINUTES,
      api1: {
        source: "open-meteo.com/forecast",
        description: "Données météo multi-modèles (0h-168h)",
        models: [
          "ecmwf_ifs025",
          "gfs_global",
          "gfs_graphcast025",
          "icon_global",
          "icon_eu",
          "knmi_harmonie_arome_europe",
          "meteofrance_arpege_europe",
          "meteofrance_arome_france",
          "meteofrance_arome_france_hd",
          "ukmo_global_deterministic_10km",
          "ukmo_uk_deterministic_2km",
        ],
        data: api1Data,
      },
      api2: {
        source: "air-quality-api.open-meteo.com",
        description: "UV et qualité de l'air (heure par heure)",
        parameters: ["european_aqi", "uv_index", "uv_index_clear_sky"],
        data: api2Data,
      },
      api3: {
        source: "marine-api.open-meteo.com",
        description: "Données de houle et marine (DÉSACTIVÉ temporairement)",
        models: [],
        note: "API3 désactivée pour économiser les appels. Réactivation prévue avec les fonctionnalités surf.",
        data: api3Data,
        disabled: true,
      },
    };

    // Mise en cache (si activée)
    if (USE_CACHE) {
      cache.set(cacheKey, {
        data: unifiedData,
        timestamp: Date.now(),
      });
    }

    console.log(
      `Données récupérées ${
        USE_CACHE ? "et mises en cache" : "(cache désactivé)"
      } pour ${spotName}`
    );
    return unifiedData;
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données pour ${spotName}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Fonction utilitaire : vide le cache manuellement
 */
export function clearCache() {
  cache.clear();
  console.log("Cache vidé manuellement");
}

/**
 * Fonction utilitaire : obtient les statistiques du cache
 * @returns {Object} Statistiques du cache
 */
export function getCacheStats() {
  const entries = Array.from(cache.entries());
  const validEntries = entries.filter(([, entry]) => isCacheValid(entry));

  return {
    total_entries: cache.size,
    valid_entries: validEntries.length,
    expired_entries: cache.size - validEntries.length,
    coordinates_cached: validEntries.map(([coords]) => coords),
    ttl_minutes: TTL_MINUTES,
  };
}

/**
 * Fonction utilitaire : liste les spots prédéfinis
 * @returns {Object} Objet avec les spots prédéfinis
 */
export function getPredefinedSpots() {
  return PREDEFINED_SPOTS;
}

/**
 * Fonction utilitaire : récupère les coordonnées d'un spot prédéfini
 * @param {string} spotId - Identifiant du spot
 * @returns {Object|null} Coordonnées du spot ou null si non trouvé
 */
export function getSpotCoordinates(spotId) {
  const spot = PREDEFINED_SPOTS[spotId.toLowerCase()];
  return spot
    ? { lat: spot.lat, lon: spot.lon, name: spot.name, type: spot.type }
    : null;
}

/**
 * Fonction helper : récupère les données météo par nom de spot prédéfini
 * @param {string} spotId - Identifiant du spot prédéfini
 * @returns {Promise<Object>} Données météo du spot
 */
export async function fetchMeteoDataBySpot(spotId, options = {}) {
  const spot = getSpotCoordinates(spotId);
  if (!spot) {
    const availableSpots = Object.keys(PREDEFINED_SPOTS);
    throw new Error(
      `Spot '${spotId}' non trouvé. Spots disponibles: ${availableSpots.join(
        ", "
      )}`
    );
  }

  return fetchMeteoData(spot.lat, spot.lon, { name: spot.name, ...options });
}

// Export par défaut pour compatibilité Next.js API routes
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: "Méthode non autorisée. Utilisez GET." });
  }

  const { lat, lon, latitude, longitude, spot, forceRefresh } = req.query;

  // Support multiple formats de paramètres
  const finalLat = lat || latitude;
  const finalLon = lon || longitude;

  // Si un spot prédéfini est fourni, utiliser ses coordonnées
  if (spot) {
    try {
      const options = { forceRefresh: forceRefresh === "true" };
      const data = await fetchMeteoDataBySpot(spot, options);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(400).json({
        error: error.message,
        predefined_spots: Object.keys(PREDEFINED_SPOTS),
      });
    }
  }

  // Sinon, utiliser les coordonnées directement
  if (!finalLat || !finalLon) {
    return res.status(400).json({
      error: "Paramètres requis: lat & lon (ou latitude & longitude) ou spot",
      examples: [
        "/api/fetchMeteoData?lat=48.3903&lon=-4.4863",
        "/api/fetchMeteoData?latitude=48.3903&longitude=-4.4863",
        "/api/fetchMeteoData?spot=brest",
      ],
      predefined_spots: Object.keys(PREDEFINED_SPOTS),
    });
  }

  try {
    const lat = parseFloat(finalLat);
    const lon = parseFloat(finalLon);

    if (isNaN(lat) || isNaN(lon)) {
      throw new Error("Les coordonnées doivent être des nombres valides");
    }

    const options = { forceRefresh: forceRefresh === "true" };
    const data = await fetchMeteoData(lat, lon, options);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      examples: [
        "/api/fetchMeteoData?lat=48.3903&lon=-4.4863",
        "/api/fetchMeteoData?spot=brest",
      ],
    });
  }
}
