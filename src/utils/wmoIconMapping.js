/**
 * Mapping des codes WMO vers les icônes animées
 * Basé sur les fichiers disponibles dans /docs/animated/
 */

export const WMO_ICON_MAPPING = {
  // Groupe 0: Ciel clair
  0: "day.svg", // Ciel clair jour

  // Groupe 1: Peu nuageux, couvert
  1: "cloudy-day-1.svg", // Peu nuageux
  2: "cloudy-day-2.svg", // Partiellement nuageux
  3: "cloudy.svg", // Couvert

  // Groupe 2: Brouillard
  45: "cloudy.svg", // Brouillard (utilise nuageux épais)
  48: "cloudy.svg", // Brouillard givrant

  // Groupe 3: Bruine + Pluie légère à modérée
  51: "rainy-1.svg", // Bruine légère
  52: "rainy-2.svg", // Bruine modérée
  53: "rainy-3.svg", // Bruine forte
  54: "rainy-1.svg", // Bruine légère verglaçante
  55: "rainy-2.svg", // Bruine modérée verglaçante
  61: "rainy-4.svg", // Pluie légère
  62: "rainy-5.svg", // Pluie modérée
  63: "rainy-6.svg", // Pluie forte
  64: "rainy-5.svg", // Pluie légère verglaçante
  65: "rainy-6.svg", // Pluie modérée verglaçante

  // Groupe 4: Pluie/bruine verglaçante forte
  56: "rainy-3.svg", // Bruine verglaçante légère
  57: "rainy-6.svg", // Bruine verglaçante forte
  66: "rainy-5.svg", // Pluie verglaçante légère
  67: "rainy-7.svg", // Pluie verglaçante forte

  // Groupe 5: Averses de pluie
  80: "rainy-5.svg", // Averses légères
  81: "rainy-6.svg", // Averses modérées
  82: "rainy-7.svg", // Averses violentes

  // Groupe 6: Neige
  71: "snowy-1.svg", // Chute de neige légère
  72: "snowy-2.svg", // Chute de neige modérée
  73: "snowy-3.svg", // Chute de neige forte
  74: "snowy-4.svg", // Grains de glace légère
  75: "snowy-5.svg", // Chute de neige légère
  76: "snowy-6.svg", // Chute de neige modérée
  77: "snowy-3.svg", // Grains de neige
  85: "snowy-5.svg", // Averses de neige légères
  86: "snowy-6.svg", // Averses de neige fortes

  // Groupe 7: Orage
  95: "thunder.svg", // Orage

  // Groupe 8: Orage avec grêle
  96: "thunder.svg", // Orage avec grêle légère
  99: "thunder.svg", // Orage avec grêle forte
};

/**
 * Descriptions textuelles des codes WMO
 */
export const WMO_DESCRIPTIONS = {
  0: "Ciel clair",
  1: "Principalement clair",
  2: "Partiellement nuageux",
  3: "Couvert",
  45: "Brouillard",
  48: "Brouillard givrant",
  51: "Bruine légère",
  52: "Bruine modérée",
  53: "Bruine forte",
  54: "Bruine verglaçante légère",
  55: "Bruine verglaçante modérée",
  56: "Bruine verglaçante légère",
  57: "Bruine verglaçante forte",
  61: "Pluie légère",
  62: "Pluie modérée",
  63: "Pluie forte",
  64: "Pluie verglaçante légère",
  65: "Pluie verglaçante modérée",
  66: "Pluie verglaçante légère",
  67: "Pluie verglaçante forte",
  71: "Chute de neige légère",
  72: "Chute de neige modérée",
  73: "Chute de neige forte",
  74: "Grains de glace",
  75: "Chute de neige légère",
  76: "Chute de neige modérée",
  77: "Grains de neige",
  80: "Averses légères",
  81: "Averses modérées",
  82: "Averses violentes",
  85: "Averses de neige légères",
  86: "Averses de neige fortes",
  95: "Orage",
  96: "Orage avec grêle légère",
  99: "Orage avec grêle forte",
};

/**
 * Couleurs de fond par niveau de sévérité
 */
export const SEVERITY_COLORS = {
  0: "bg-yellow-100 text-yellow-800", // Ciel clair
  1: "bg-gray-100 text-gray-800", // Nuageux
  2: "bg-gray-200 text-gray-900", // Brouillard
  3: "bg-blue-100 text-blue-800", // Pluie légère
  4: "bg-blue-200 text-blue-900", // Pluie verglaçante
  5: "bg-blue-300 text-blue-900", // Averses
  6: "bg-indigo-200 text-indigo-900", // Neige
  7: "bg-purple-200 text-purple-900", // Orage
  8: "bg-red-200 text-red-900", // Orage + grêle
};

/**
 * Retourne l'icône correspondant au code WMO
 * @param {number} wmoCode - Code WMO
 * @returns {string} Nom du fichier SVG
 */
export function getWmoIcon(wmoCode) {
  return WMO_ICON_MAPPING[wmoCode] || "cloudy.svg";
}

/**
 * Retourne la description du code WMO
 * @param {number} wmoCode - Code WMO
 * @returns {string} Description textuelle
 */
export function getWmoDescription(wmoCode) {
  return WMO_DESCRIPTIONS[wmoCode] || `Code WMO ${wmoCode}`;
}

/**
 * Retourne le groupe de sévérité d'un code WMO
 * @param {number} wmoCode - Code WMO
 * @returns {number} Niveau de sévérité (0-8)
 */
export function getWmoSeverity(wmoCode) {
  const severityGroups = {
    0: [0],
    1: [1, 2, 3],
    2: [45, 48],
    3: [51, 52, 53, 54, 55, 61, 62, 63, 64, 65],
    4: [56, 57, 66, 67],
    5: [80, 81, 82],
    6: [71, 72, 73, 74, 75, 76, 77, 85, 86],
    7: [95],
    8: [96, 99],
  };

  for (const [severity, codes] of Object.entries(severityGroups)) {
    if (codes.includes(wmoCode)) {
      return parseInt(severity);
    }
  }

  return 0; // Défaut
}

/**
 * Retourne les classes CSS de couleur selon la sévérité
 * @param {number} wmoCode - Code WMO
 * @returns {string} Classes CSS Tailwind
 */
export function getWmoSeverityColor(wmoCode) {
  const severity = getWmoSeverity(wmoCode);
  return SEVERITY_COLORS[severity] || SEVERITY_COLORS[0];
}
