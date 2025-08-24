/**
 * Convertit une direction du vent en degrés vers une direction cardinale
 * @param degrees - Direction en degrés (0-360)
 * @returns Direction cardinale (N, NNE, NE, etc.)
 */
export function degreesToCompass(degrees: number | null | undefined): string {
    if (degrees == null || isNaN(degrees)) return "--";

    const directions = [
        "N", "NNE", "NE", "ENE",
        "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW",
        "W", "WNW", "NW", "NNW"
    ];

    const index = Math.round((degrees % 360) / 22.5) % 16;
    return directions[index];
}

/**
 * Convertit une direction du vent en format avec flèche (ex: "W • →")
 * @param degrees - Direction en degrés (0-360)
 * @returns Direction formatée avec flèche ASCII pointant dans la direction opposée
 */
export function degreesToCompassWithArrow(degrees: number | null | undefined): string {
    if (degrees == null || isNaN(degrees)) return "--";

    const direction = degreesToCompass(degrees);

    // Flèche ASCII pointant dans la direction opposée au vent
    const arrows = {
        "N": "↓", "NNE": "↙", "NE": "↙", "ENE": "←",
        "E": "←", "ESE": "↖", "SE": "↖", "SSE": "↑",
        "S": "↑", "SSW": "↗", "SW": "↗", "WSW": "→",
        "W": "→", "WNW": "↘", "NW": "↘", "NNW": "↓"
    } as const;

    const arrow = arrows[direction as keyof typeof arrows] || "→";
    return `${direction} • ${arrow}`;
}
