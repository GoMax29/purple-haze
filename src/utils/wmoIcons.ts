/**
 * Mapping temporaire des codes WMO vers icônes émoji
 * Basé sur le snippet fourni depuis public/test-algo/js/final_params.js
 * 
 * TODO: Remplacer par un fichier de mapping robuste plus tard
 */

export const WMO_EMOJIS: Record<number, string> = {
    0: "☀️",   // Ciel dégagé
    1: "🌤️",   // Principalement dégagé
    2: "⛅",   // Partiellement nuageux
    3: "☁️",   // Couvert
    45: "🌫️",  // Brouillard
    48: "🌫️",  // Brouillard givrant
    51: "🌦️",  // Bruine légère
    52: "🌦️",  // Bruine modérée
    53: "🌧️",  // Bruine dense
    54: "🌧️",  // Bruine verglaçante légère
    55: "🌧️",  // Bruine verglaçante dense
    56: "🌨️",  // Bruine verglaçante légère
    57: "🌨️",  // Bruine verglaçante dense
    61: "🌧️",  // Pluie légère
    62: "🌧️",  // Pluie modérée
    63: "🌧️",  // Pluie forte
    64: "🌨️",  // Pluie verglaçante légère
    65: "🌨️",  // Pluie verglaçante forte
    66: "🌨️",  // Pluie verglaçante légère
    67: "🌨️",  // Pluie verglaçante forte
    71: "🌨️",  // Chute de neige légère
    72: "❄️",   // Chute de neige modérée
    73: "❄️",   // Chute de neige forte
    74: "🌨️",  // Grains de glace
    75: "❄️",   // Chute de neige légère
    76: "❄️",   // Chute de neige forte
    77: "🌨️",  // Grains de neige
    80: "🌦️",  // Averses de pluie légères
    81: "🌧️",  // Averses de pluie modérées
    82: "⛈️",   // Averses de pluie violentes
    85: "🌨️",  // Averses de neige légères
    86: "❄️",   // Averses de neige fortes
    95: "⛈️",   // Orage léger ou modéré
    96: "⛈️",   // Orage avec grêle légère
    99: "⛈️"    // Orage avec grêle forte
};

/**
 * Retourne l'icône correspondant à un code WMO
 */
export function getWMOIcon(wmoCode: number): string {
    return WMO_EMOJIS[wmoCode] || "❓"; // Point d'interrogation pour codes inconnus
}

/**
 * Retourne les icônes des 4 tranches horaires
 */
export function getTimeSlotIcons(timeSlots: Array<{ code_wmo_final: number | null }>): string[] {
    return timeSlots.map(slot =>
        slot.code_wmo_final !== null ? getWMOIcon(slot.code_wmo_final) : "❓"
    );
}


