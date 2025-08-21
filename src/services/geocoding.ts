/**
 * Service de géocodage utilisant l'API Open-Meteo
 * 
 * Documentation: https://open-meteo.com/en/docs/geocoding-api
 * 
 * Ancien système OpenWeatherMap conservé mais non utilisé
 */

import { API_KEYS } from '../../config/api-keys';

// Types pour l'API Open-Meteo
export interface OpenMeteoGeocodingResult {
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    elevation?: number;
    feature_code?: string;
    country_code: string;
    country: string;
    admin1?: string;
    admin2?: string;
    admin3?: string;
    admin4?: string;
    timezone?: string;
    population?: number;
    postcodes?: string[];
}

// Types pour l'ancien système OpenWeatherMap (conservé)
export interface GeocodingResult {
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string;
    local_names?: Record<string, string>;
}

export interface LocationData {
    id: string;
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
    flag?: string;
    fullName: string;
}

/**
 * Détecte la langue du navigateur pour l'affichage des résultats
 */
function getBrowserLanguage(): string {
    if (typeof window !== 'undefined') {
        const lang = navigator.language || navigator.languages?.[0] || 'fr';
        return lang.split('-')[0]; // Prendre seulement le code langue (ex: 'fr' de 'fr-FR')
    }
    return 'fr'; // Fallback français côté serveur
}

/**
 * Recherche de villes via l'API Open-Meteo Geocoding
 * Documentation: https://open-meteo.com/en/docs/geocoding-api
 */
export async function searchLocations(query: string, limit: number = 5): Promise<LocationData[]> {
    if (!query.trim() || query.length < 2) {
        return [];
    }

    try {
        const encodedQuery = encodeURIComponent(query.trim());
        const browserLang = getBrowserLanguage();

        // API Open-Meteo - gratuite et plus complète
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodedQuery}&count=${limit}&language=${browserLang}&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Vérifier si des résultats existent
        if (!data.results || !Array.isArray(data.results)) {
            return [];
        }

        const results: OpenMeteoGeocodingResult[] = data.results;

        return results.map((result, index) => ({
            id: `${result.latitude}_${result.longitude}_${result.id}`,
            name: result.name,
            country: result.country_code,
            state: result.admin1 || result.admin2, // Région/État
            lat: result.latitude,
            lon: result.longitude,
            flag: getCountryFlag(result.country_code),
            fullName: formatOpenMeteoLocationName(result)
        }));

    } catch (error) {
        console.error('Erreur lors de la recherche de géolocalisation:', error);
        throw new Error('Impossible de rechercher les villes. Vérifiez votre connexion.');
    }
}

/**
 * ANCIEN SYSTÈME OpenWeatherMap (conservé mais non utilisé)
 * Recherche de villes via l'API OpenWeatherMap Geocoding
 */
export async function searchLocationsLegacy(query: string, limit: number = 5): Promise<LocationData[]> {
    if (!query.trim() || query.length < 2) {
        return [];
    }

    try {
        const encodedQuery = encodeURIComponent(query.trim());
        const browserLang = getBrowserLanguage();
        const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodedQuery}&limit=${limit}&appid=${API_KEYS.OPENWEATHER}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const results: GeocodingResult[] = await response.json();

        return results.map((result, index) => ({
            id: `${result.lat}_${result.lon}_${index}`,
            name: getLocalizedName(result, browserLang),
            country: result.country,
            state: result.state,
            lat: result.lat,
            lon: result.lon,
            flag: getCountryFlag(result.country),
            fullName: formatLocationName(result, browserLang)
        }));

    } catch (error) {
        console.error('Erreur lors de la recherche de géolocalisation (legacy):', error);
        throw new Error('Impossible de rechercher les villes. Vérifiez votre connexion.');
    }
}

/**
 * Récupère le nom localisé d'une ville selon la langue du navigateur
 */
function getLocalizedName(result: GeocodingResult, browserLang: string): string {
    // Utiliser le nom local si disponible pour la langue du navigateur
    if (result.local_names && result.local_names[browserLang]) {
        return result.local_names[browserLang];
    }

    // Fallback français si différent de la langue demandée
    if (browserLang !== 'fr' && result.local_names && result.local_names['fr']) {
        return result.local_names['fr'];
    }

    // Fallback nom par défaut
    return result.name;
}

/**
 * Formatte le nom complet pour l'API Open-Meteo
 */
function formatOpenMeteoLocationName(result: OpenMeteoGeocodingResult): string {
    const parts = [result.name];

    // Ajouter la région administrative si disponible
    if (result.admin1) {
        parts.push(result.admin1);
    } else if (result.admin2) {
        parts.push(result.admin2);
    }

    // Ajouter le code pays pour distinguer les homonymes
    parts.push(result.country_code);

    return parts.join(', ');
}

/**
 * ANCIEN - Formatte le nom complet d'une localisation avec localisation (OpenWeatherMap)
 */
function formatLocationName(result: GeocodingResult, browserLang: string = 'fr'): string {
    const localizedName = getLocalizedName(result, browserLang);
    const parts = [localizedName];

    if (result.state) {
        parts.push(result.state);
    }

    // Toujours inclure le code pays pour distinguer les homonymes
    parts.push(result.country);

    return parts.join(', ');
}

/**
 * Retourne l'URL du drapeau pour un code pays ISO via FlagCDN
 * Documentation: https://flagpedia.net/download/api
 */
function getCountryFlag(countryCode: string): string {
    // Utilise FlagCDN pour afficher un petit drapeau fiable (24x18)
    // Le code pays doit être en minuscules selon la documentation
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
}

/**
 * Recherche inversée (coordonnées -> ville) - utilise encore OpenWeatherMap car plus précis
 * L'API Open-Meteo ne propose pas de géocodage inversé
 */
export async function reverseGeocode(lat: number, lon: number): Promise<LocationData | null> {
    try {
        const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEYS.OPENWEATHER}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const results: GeocodingResult[] = await response.json();

        if (results.length === 0) {
            return null;
        }

        const result = results[0];
        const browserLang = getBrowserLanguage();
        return {
            id: `${result.lat}_${result.lon}_reverse`,
            name: getLocalizedName(result, browserLang),
            country: result.country,
            state: result.state,
            lat: result.lat,
            lon: result.lon,
            flag: getCountryFlag(result.country),
            fullName: formatLocationName(result, browserLang)
        };

    } catch (error) {
        console.error('Erreur lors du géocodage inversé:', error);
        return null;
    }
}
