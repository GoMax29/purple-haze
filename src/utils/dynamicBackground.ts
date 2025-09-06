/**
 * Utilitaire pour générer les fonds dégradés dynamiques selon l'heure de la journée
 */

import { getCurrentHourInTimezone } from "./timezoneHelper";

export type BackgroundTheme = "day" | "night" | "transition";

export interface BackgroundThemeData {
    theme: BackgroundTheme;
    gradient: string;
    description: string;
}

/**
 * Détermine le thème de fond selon l'heure courante et les heures de lever/coucher
 */
export const getCurrentBackgroundTheme = (
    currentHour: number,
    sunrise?: string,
    sunset?: string
): BackgroundTheme => {
    // Si pas de données sunrise/sunset, utiliser des valeurs par défaut
    const sunriseHour = sunrise ? extractHourFromTime(sunrise) : 7;
    const sunsetHour = sunset ? extractHourFromTime(sunset) : 19;

    // Transition seulement à l'heure exacte du lever/coucher (comme dans dayNight.ts)
    if (currentHour === sunriseHour || currentHour === sunsetHour) {
        return "transition";
    }

    // Jour entre sunrise et sunset (exclusifs)
    if (currentHour > sunriseHour && currentHour < sunsetHour) {
        return "day";
    }

    return "night";
};

/**
 * Extrait l'heure d'un string au format ISO ou "HH:MM"
 */
const extractHourFromTime = (timeString: string): number => {
    // Si c'est un format ISO (2024-01-01T07:30:00)
    if (timeString.includes("T")) {
        return parseInt(timeString.split("T")[1].split(":")[0], 10);
    }
    // Si c'est un format HH:MM
    return parseInt(timeString.split(":")[0], 10);
};

/**
 * Retourne les données du thème de fond selon le type
 */
export const getBackgroundThemeData = (theme: BackgroundTheme): BackgroundThemeData => {
    switch (theme) {
        case "day":
            return {
                theme: "day",
                gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                description: "Dégradé clair de jour",
            };
        case "night":
            return {
                theme: "night",
                gradient: "linear-gradient(135deg, #2e1968 0%, #1a1f3a 50%, #0f172a 100%)",
                description: "Dégradé sombre de nuit basé sur #2e1968",
            };
        case "transition":
            return {
                theme: "transition",
                gradient: "linear-gradient(135deg, #667eea 0%, #2e1968 50%, #1a1f3a 100%)",
                description: "Dégradé intermédiaire pour transitions matin/soir",
            };
        default:
            return getBackgroundThemeData("day");
    }
};

/**
 * Hook-like function pour obtenir le fond dynamique selon les données météo courantes
 */
export const getDynamicBackground = (
    currentWeatherData?: any,
    timezone?: string
): BackgroundThemeData => {
    // Utiliser l'heure locale de la ville sélectionnée au lieu de l'heure du navigateur
    const currentHour = timezone ? getCurrentHourInTimezone(timezone) : new Date().getHours();

    // Utiliser les données sunrise/sunset si disponibles
    const sunrise = currentWeatherData?.sunrise;
    const sunset = currentWeatherData?.sunset;

    const theme = getCurrentBackgroundTheme(currentHour, sunrise, sunset);
    const backgroundData = getBackgroundThemeData(theme);

    return backgroundData;
};

/**
 * Version simplifiée basée seulement sur l'heure (fallback)
 */
export const getSimpleDynamicBackground = (): BackgroundThemeData => {
    const currentHour = new Date().getHours();

    // Logique simplifiée : 6h-8h et 18h-20h = transition, 8h-18h = jour, reste = nuit
    if ((currentHour >= 6 && currentHour <= 8) || (currentHour >= 18 && currentHour <= 20)) {
        return getBackgroundThemeData("transition");
    }

    if (currentHour > 8 && currentHour < 18) {
        return getBackgroundThemeData("day");
    }

    return getBackgroundThemeData("night");
};
