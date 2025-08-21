export type DayNightState = "day" | "night" | "transition";

/**
 * Parse un ISO (sans indicateur UTC) comme heure LOCALE.
 * JS interprète "YYYY-MM-DDTHH:mm" comme UTC, donc on reconstruit manuellement.
 */
function parseIsoLocal(iso: string | undefined | null): Date | null {
    if (!iso || typeof iso !== "string") return null;

    //   0123456789012345 => longueur mini 16 (YYYY-MM-DDTHH:mm)
    //   Ex: 2025-08-18T21:27
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return null;

    const [_, y, mo, d, h, mi] = m;
    const date = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi)
    );
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Détermine si une heure (Date) est dans l'intervalle [start, end) en heures locales.
 */
export function isHourInRange(date: Date, startHour: number, endHourExclusive: number): boolean {
    const h = date.getHours();
    if (startHour <= endHourExclusive) return h >= startHour && h < endHourExclusive;
    // Plage chevauchant minuit
    return h >= startHour || h < (endHourExclusive % 24);
}

/**
 * Renvoie l'état jour/nuit/transition pour une heure donnée en fonction de sunrise/sunset.
 * Règles:
 * - heure < sunrise => night
 * - sunrise <= heure < sunset => day
 * - heure >= sunset => night
 * - Si l'heure HH correspond au HH de sunrise/sunset: transition appliquée sur l'heure exacte
 */
export function getDayNightStateAt(date: Date, sunriseIso?: string, sunsetIso?: string): DayNightState {
    const sunrise = parseIsoLocal(sunriseIso);
    const sunset = parseIsoLocal(sunsetIso);
    const hour = date.getHours();

    if (!sunrise || !sunset) {
        // Fallback simple: jour entre 06–21
        return isHourInRange(date, 6, 21) ? "day" : "night";
    }

    const hSunrise = sunrise.getHours();
    const hSunset = sunset.getHours();

    // Transition: si la HH est exactement celle de sunrise/sunset, c'est une heure de transition
    if (hour === hSunrise || hour === hSunset) {
        return "transition";
    }

    if (date < sunrise) return "night";
    if (date >= sunrise && date < sunset) return "day";
    return "night";
}

/**
 * Règle spéciale tranche 18–00: si sunset < 21h00 exact => night, si sunset >= 21h00 => day.
 */
export function getVariantForEveningSlot(sunsetIso?: string): "day" | "night" {
    const sunset = parseIsoLocal(sunsetIso);
    if (!sunset) {
        // console.debug("[dayNight] sunsetIso undefined -> fallback night");
        return "night"; // fallback conservateur
    }

    const sunsetMinutes = sunset.getHours() * 60 + sunset.getMinutes();
    const threshold = 21 * 60; // 1260 minutes

    const variant: "day" | "night" = sunsetMinutes < threshold ? "night" : "day";

    // console.debug(
    //     `[dayNight] sunset ISO=${sunsetIso} | minutes=${sunsetMinutes} | variant=${variant}`
    // );

    return variant;
}

/**
 * Renvoie la variante pour une tranche horaire ("00-06", "06-12", "12-18", "18-00")
 * Algorithme simplifié pour les icônes.
 */
export function computeSlotVariant(
    tranche: string,
    _sunriseIso?: string,
    sunsetIso?: string
): "day" | "night" {
    // Règles simplifiées :
    // - 00–06 => toujours night
    // - 06–12 => toujours day  
    // - 12–18 => toujours day
    // - 18–00 => selon sunset (>=21h00 = day, <21h00 = night)

    if (tranche === "00-06") return "night";
    if (tranche === "06-12" || tranche === "12-18") return "day";
    if (tranche === "18-00") {
        const variant = getVariantForEveningSlot(sunsetIso);
        // console.debug(`[dayNight] tranche 18-00 | sunset=${sunsetIso} -> variant=${variant}`);
        return variant;
    }

    // Fallback par défaut
    return "day";
}


