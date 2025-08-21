/**
 * Utilitaires pour le formatage des dates dans DailyCard
 * Format demandé: "Auj. 16", "D. 17", etc.
 */

/**
 * Formate une date pour l'affichage dans DailyCard
 * @param dayName - Nom du jour (ex: "Aujourd'hui", "Demain", "Lundi")
 * @param date - Date optionnelle au format string
 * @param isToday - Indique si c'est aujourd'hui
 * @param isTomorrow - Indique si c'est demain
 * @returns String formaté pour l'affichage
 */
export function formatDailyCardDate(
    dayName: string,
    date?: string,
    isToday: boolean = false,
    isTomorrow: boolean = false
): string {
    // Extraire le numéro du jour
    let dayNumber = "";
    if (date) {
        // Essayer de parser la date pour extraire le jour
        const dateObj = new Date(date);
        if (!isNaN(dateObj.getTime())) {
            dayNumber = dateObj.getDate().toString();
        } else {
            // Si c'est un format comme "16/12", extraire le premier nombre
            const match = date.match(/(\d+)/);
            if (match) {
                dayNumber = match[1];
            }
        }
    }

    // Si pas de numéro du jour, essayer d'utiliser la date actuelle + offset
    if (!dayNumber) {
        const today = new Date();
        if (isToday) {
            dayNumber = today.getDate().toString();
        } else if (isTomorrow) {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            dayNumber = tomorrow.getDate().toString();
        } else {
            // Fallback: utiliser un numéro générique
            dayNumber = "1";
        }
    }

    // Formater selon les règles
    if (isToday) {
        return `Auj. ${dayNumber}`;
    }

    // Pour les autres jours, utiliser l'initiale du jour réel (pas "Demain")
    const initial = getDayInitialFromName(dayName);
    return `${initial}. ${dayNumber}`;
}

/**
 * Extrait l'initiale d'un nom de jour
 */
function getDayInitialFromName(dayName: string): string {
    // Mapping des noms de jours vers leurs initiales
    const dayInitials: Record<string, string> = {
        "Aujourd'hui": "Auj",
        "Demain": "L", // sera corrigé par dayName réel en amont si fourni
        "Lundi": "L",
        "Mardi": "M",
        "Mercredi": "Me",
        "Jeudi": "J",
        "Vendredi": "V",
        "Samedi": "S",
        "Dimanche": "D"
    };

    // Chercher une correspondance exacte
    if (dayInitials[dayName]) {
        return dayInitials[dayName];
    }

    // Fallback: première lettre en majuscule
    return dayName.charAt(0).toUpperCase();
}

/**
 * Détermine si une date correspond à aujourd'hui
 */
export function isDateToday(date?: string): boolean {
    if (!date) return false;

    const today = new Date();
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) return false;

    return (
        dateObj.getDate() === today.getDate() &&
        dateObj.getMonth() === today.getMonth() &&
        dateObj.getFullYear() === today.getFullYear()
    );
}

/**
 * Détermine si une date correspond à demain
 */
export function isDateTomorrow(date?: string): boolean {
    if (!date) return false;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) return false;

    return (
        dateObj.getDate() === tomorrow.getDate() &&
        dateObj.getMonth() === tomorrow.getMonth() &&
        dateObj.getFullYear() === tomorrow.getFullYear()
    );
}

