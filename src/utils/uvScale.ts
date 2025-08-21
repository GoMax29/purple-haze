/**
 * Échelle UV avec couleurs selon l'image de référence
 * Correspond aux standards OMS de l'indice UV
 */

export interface UVScale {
    min: number;
    max: number;
    color: string;
    label: string;
}

export const UV_SCALE: UVScale[] = [
    { min: 0, max: 2, color: '#8BC34A', label: 'Low' },      // Vert (0-2)
    { min: 3, max: 5, color: '#FFC107', label: 'Moderate' }, // Jaune (3-5)
    { min: 6, max: 7, color: '#FF9800', label: 'High' },     // Orange (6-7)
    { min: 8, max: 10, color: '#F44336', label: 'Very High' }, // Rouge (8-10)
    { min: 11, max: 20, color: '#9C27B0', label: 'Extreme' }   // Violet (11+)
];

/**
 * Retourne la couleur correspondant à un indice UV (arrondi)
 */
export function getUVColor(uvIndex: number): string {
    const roundedUV = Math.round(uvIndex);

    if (roundedUV < 0) return '#9E9E9E'; // Gris pour valeurs invalides

    for (const scale of UV_SCALE) {
        if (roundedUV >= scale.min && roundedUV <= scale.max) {
            return scale.color;
        }
    }

    // Fallback pour valeurs très élevées (>11)
    return '#9C27B0'; // Violet pour extrême
}

/**
 * Retourne le label correspondant à un indice UV (arrondi)
 */
export function getUVLabel(uvIndex: number): string {
    const roundedUV = Math.round(uvIndex);

    if (roundedUV < 0) return 'N/A';

    for (const scale of UV_SCALE) {
        if (roundedUV >= scale.min && roundedUV <= scale.max) {
            return scale.label;
        }
    }

    return 'Extreme';
}
