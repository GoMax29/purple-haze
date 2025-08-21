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


