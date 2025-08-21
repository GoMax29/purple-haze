/**
 * Types pour les données quotidiennes avec tranches horaires
 */

export interface TimeSlotData {
    tranche: string;
    code_wmo_final: number | null;
    risques: Array<{
        tranche: string;
        type: string;
        qty: number;
    }>;
    precipitation_total: number;
    debug?: any;
    // Variante d'icône calculée (day | night). "transition" possible pour debug futur
    variant?: "day" | "night" | "transition";
}

export interface DailyWeatherData {
    dayName: string;
    date?: string;
    tempMax: number;
    tempMin: number;
    uvIndex?: number;
    precipitation_total: number;
    timeSlots: TimeSlotData[]; // 4 tranches: 00-06, 06-12, 12-18, 18-00
    isToday?: boolean;
    // Événements solaires pour la journée (ISO local auto)
    sunrise?: string;
    sunset?: string;
}


