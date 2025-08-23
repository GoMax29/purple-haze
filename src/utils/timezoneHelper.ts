/**
 * Helper pour la gestion des fuseaux horaires avec les données Open-Meteo
 */

/**
 * Formate une date selon la timezone fournie par l'API Open-Meteo
 * @param date Date ISO string ou objet Date
 * @param timezone Timezone de l'API (ex: "America/New_York", "Europe/Paris")
 * @param options Options de formatage Intl.DateTimeFormat
 * @returns Date formatée selon la timezone
 */
export function formatInTimezone(
    date: string | Date,
    timezone?: string,
    options: Intl.DateTimeFormatOptions = {}
): string {
    if (!timezone) {
        // Fallback vers la timezone du navigateur si pas de timezone API
        return new Date(date).toLocaleString("fr-FR", options);
    }

    try {
        const dateObj = typeof date === "string" ? new Date(date) : date;
        return new Intl.DateTimeFormat("fr-FR", {
            timeZone: timezone,
            ...options,
        }).format(dateObj);
    } catch (error) {
        console.warn(`⚠️ Erreur formatage timezone ${timezone}:`, error);
        // Fallback vers la timezone du navigateur
        return new Date(date).toLocaleString("fr-FR", options);
    }
}

/**
 * Formate l'heure courante selon la timezone de l'API
 * @param timezone Timezone de l'API
 * @returns Heure formatée "HH:mm"
 */
export function getCurrentTimeInTimezone(timezone?: string): string {
    return formatInTimezone(new Date(), timezone, {
        hour: "2-digit",
        minute: "2-digit",
    });
}

/**
 * Obtient l'heure locale dans la timezone de l'API
 * @param timezone Timezone de l'API
 * @returns Objet Date ajusté à la timezone
 */
export function getCurrentDateInTimezone(timezone?: string): Date {
    if (!timezone) return new Date();

    try {
        // Créer une date dans la timezone spécifiée
        const nowInTimezone = new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }).format(new Date());

        // Convertir en format ISO et créer un objet Date
        const isoString = nowInTimezone.replace(", ", "T");
        return new Date(isoString);
    } catch (error) {
        console.warn(`⚠️ Erreur date timezone ${timezone}:`, error);
        return new Date();
    }
}

/**
 * Retourne la date courante au format YYYY-MM-DD pour une timezone
 */
export function getCurrentDateStringInTimezone(timezone?: string): string {
    try {
        return new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).format(new Date());
    } catch (error) {
        console.warn(`⚠️ Erreur date (string) timezone ${timezone}:`, error);
        return new Date().toISOString().slice(0, 10);
    }
}

/**
 * Obtient l'heure courante dans la timezone de l'API (0-23)
 * @param timezone Timezone de l'API
 * @returns Heure courante (0-23)
 */
export function getCurrentHourInTimezone(timezone?: string): number {
    if (!timezone) return new Date().getHours();

    try {
        const hour = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone,
            hour: "numeric",
            hour12: false,
        }).format(new Date());

        return parseInt(hour, 10);
    } catch (error) {
        console.warn(`⚠️ Erreur heure timezone ${timezone}:`, error);
        return new Date().getHours();
    }
}

/**
 * Formate une heure pour l'affichage dans les slots horaires
 * @param date Date ISO string ou objet Date
 * @param timezone Timezone de l'API
 * @param isCurrentHour Si c'est l'heure courante
 * @returns Heure formatée ("14h" ou "maint.")
 */
export function formatHourSlot(
    date: string | Date,
    timezone?: string,
    isCurrentHour: boolean = false
): string {
    if (isCurrentHour) return "maint.";

    // NE PAS convertir de fuseau: l'ISO de l'API est déjà en heure locale de la ville
    try {
        if (typeof date === "string") {
            const hh = parseInt(date.slice(11, 13), 10);
            return `${hh}h`;
        }
        return `${date.getHours()}h`;
    } catch (error) {
        console.warn(`⚠️ Erreur formatage heure slot:`, error);
        return "--h";
    }
}

/**
 * Vérifie si une date ISO correspond à l'heure courante dans la timezone
 * @param isoDate Date ISO string
 * @param timezone Timezone de l'API
 * @returns true si c'est l'heure courante
 */
export function isCurrentHourInTimezone(
    isoDate: string,
    timezone?: string
): boolean {
    try {
        const slotDate = isoDate.slice(0, 10);
        const slotHour = parseInt(isoDate.slice(11, 13), 10);

        const currentDate = getCurrentDateStringInTimezone(timezone);
        const currentHour = getCurrentHourInTimezone(timezone);

        return slotDate === currentDate && slotHour === currentHour;
    } catch (error) {
        console.warn(`⚠️ Erreur comparaison heure timezone:`, error);
        return false;
    }
}

/**
 * Extrait les informations de timezone depuis les données Open-Meteo
 * @param apiData Données de l'API Open-Meteo
 * @returns Informations de timezone
 */
export interface TimezoneInfo {
    timezone?: string;
    timezone_abbreviation?: string;
    utc_offset_seconds?: number;
}

export function extractTimezoneInfo(apiData: any): TimezoneInfo {
    return {
        timezone: apiData?.timezone,
        timezone_abbreviation: apiData?.timezone_abbreviation,
        utc_offset_seconds: apiData?.utc_offset_seconds,
    };
}

/**
 * Formate une date complète avec jour et heure selon la timezone
 * @param date Date ISO string ou objet Date
 * @param timezone Timezone de l'API
 * @returns Date formatée "Lundi 22 Août, 14h30"
 */
export function formatFullDateTime(
    date: string | Date,
    timezone?: string
): string {
    return formatInTimezone(date, timezone, {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    });
}
