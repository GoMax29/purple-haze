export type DayNightVariant = "day" | "night" | "transition";

/**
 * Construit le chemin vers l'icône PNG finale selon le code WMO et la variante jour/nuit.
 * Les fichiers sont attendus dans `public/icons/final_wmo/transparent/{day|night}/{code}.png`.
 * Si `transition` est fourni, on applique un fallback visuel vers `day` par défaut.
 */
export function getWmoFinalIconPath(wmoCode: number, variant: DayNightVariant = "day"): string {
    const normalizedVariant = variant === "transition" ? "day" : variant;
    const code = typeof wmoCode === "number" ? wmoCode : 0;
    return `/icons/final_wmo/transparent/${normalizedVariant}/${code}.png`;
}


/**
 * Mapping emoji pour la journée
 */
const emojiMapDay: Record<number, string> = {
    0: "☀️",   // Clear sky
    1: "🌤️",  // Mainly clear
    2: "⛅️",  // Partly cloudy
    3: "☁️",  // Overcast
    45: "🌫️", // Fog
    48: "🌫️", // Rime fog
    51: "🌦️", // Drizzle light
    53: "🌦️", // Drizzle moderate
    55: "🌧️", // Drizzle dense
    56: "🌦️", // Freezing drizzle light
    57: "🌧️", // Freezing drizzle dense
    61: "🌧️", // Rain slight
    63: "🌧️", // Rain moderate
    65: "🌧️", // Rain heavy
    66: "🌧️", // Freezing rain light
    67: "🌧️", // Freezing rain heavy
    71: "🌨️", // Snow slight
    73: "🌨️", // Snow moderate
    75: "❄️",  // Snow heavy
    77: "❄️",  // Snow grains
    80: "🌧️", // Showers slight
    81: "🌧️", // Showers moderate
    82: "🌧️", // Showers violent
    85: "🌨️", // Snow showers slight
    86: "❄️",  // Snow showers heavy
    95: "⛈️",  // Thunderstorm slight/moderate
    96: "⛈️",  // Thunderstorm w/ hail slight
    99: "⛈️",  // Thunderstorm w/ hail heavy
};

/**
 * Mapping emoji pour la nuit
 */
const emojiMapNight: Record<number, string> = {
    0: "🌙️",  // Clear sky
    1: "🌙️",  // Mainly clear
    2: "☁️",  // Partly cloudy
    3: "☁️",  // Overcast
    45: "🌫️",
    48: "🌫️",
    51: "🌧️",
    53: "🌧️",
    55: "🌧️",
    56: "🌧️",
    57: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "❄️",
    77: "❄️",
    80: "🌧️",
    81: "🌧️",
    82: "🌧️",
    85: "🌨️",
    86: "❄️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
};

/**
 * Expose une fonction générique retournant soit un emoji (string), soit un chemin PNG (string)
 * selon le flag useEmoji.
 *
 * Note: la logique jour/nuit en amont peut décider de passer isNight.
 */
export function getWeatherIcon(wmoCode: number, isNight: boolean, useEmoji: boolean): string {
    const code = typeof wmoCode === "number" ? wmoCode : 0;
    if (useEmoji) {
        const table = isNight ? emojiMapNight : emojiMapDay;
        return table[code] ?? (isNight ? "🌙️" : "🌤️");
    }
    const variant: DayNightVariant = isNight ? "night" : "day";
    return getWmoFinalIconPath(code, variant);
}


