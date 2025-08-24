/**
 * Fonction pour déterminer la couleur d'une température selon la valeur
 * @param temp - Température en degrés Celsius
 * @returns Couleur hexadécimale correspondante
 */
export function getTemperatureColor(temp: number): string {
    if (temp <= -5) return "#6a0dad"; // Violet
    if (temp <= 0) return "#0047ab"; // Bleu foncé
    if (temp <= 5) return "#e0f7ff"; // Bleu très clair
    if (temp <= 10) return "#4fc3f7"; // Bleu clair
    if (temp <= 15) return "#4dd0e1"; // Cyan
    if (temp <= 20) return "#81c784"; // Vert
    if (temp <= 25) return "#dce775"; // Vert-jaune
    if (temp <= 30) return "#fff176"; // Jaune
    if (temp <= 35) return "#ffb74d"; // Orange
    if (temp <= 40) return "#ff7043"; // Orange-rouge
    if (temp <= 45) return "#ef5350"; // Rouge
    return "#8b0000"; // Rouge foncé (45°C+)
}

/**
 * Détermine si le texte doit être noir ou blanc selon la couleur de fond
 * @param backgroundColor - Couleur de fond en hexadécimal
 * @returns "black" ou "white"
 */
export function getContrastTextColor(backgroundColor: string): string {
    // Convertir hex en RGB
    const hex = backgroundColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculer la luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retourner noir si lumineux, blanc si sombre
    return luminance > 0.5 ? "black" : "white";
}
