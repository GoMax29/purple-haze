/**
 * Utilitaires pour les jours de la semaine
 */

/**
 * Mapping des jours complets vers leurs initiales
 */
export const DAY_INITIALS: Record<string, string> = {
    'Lundi': 'L.',
    'Mardi': 'M.',
    'Mercredi': 'Me.',
    'Jeudi': 'J.',
    'Vendredi': 'V.',
    'Samedi': 'S.',
    'Dimanche': 'D.',
    'Aujourd\'hui': 'Auj.',
    'Demain': 'Dem.',
    'Lun': 'L.',
    'Mar': 'M.',
    'Mer': 'Me.',
    'Jeu': 'J.',
    'Ven': 'V.',
    'Sam': 'S.',
    'Dim': 'D.'
};

/**
 * Retourne l'initiale d'un jour
 */
export function getDayInitial(dayName: string): string {
    return DAY_INITIALS[dayName] || dayName.charAt(0).toUpperCase() + '.';
}

/**
 * Formate une date en initiale de jour
 */
export function formatDayFromDate(date: Date): string {
    const days = ['D.', 'L.', 'M.', 'Me.', 'J.', 'V.', 'S.'];
    return days[date.getDay()];
}


