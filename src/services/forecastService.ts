/**
 * Service pour appeler l'API de prévisions météo
 * Remplace l'import direct de forecastCore qui causait des erreurs avec les modules Node.js
 * Intègre le système de cache multi-niveaux pour optimiser les performances
 */

import { DailyWeatherData } from "@/types/dailyData";

export interface ForecastResponse {
    success: boolean;
    forecastData: {
        hourlyData: any[];
        dailyData: any[];
    };
    dailyCardData: DailyWeatherData[];
    metadata: {
        latitude: number;
        longitude: number;
        elevation?: number | null;
        hourly_count: number;
        daily_count: number;
        daily_card_count: number;
        generated_at: string;
        algorithm: string;
    };
}

export interface ForecastError {
    error: string;
    details?: string;
}

/**
 * Récupère les données de prévisions pour des coordonnées données
 */
export async function fetchForecastData(lat: number, lon: number): Promise<DailyWeatherData[]> {
    try {
        console.log(`🌍 [ForecastService] Appel API pour ${lat}, ${lon}`);

        const response = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);

        if (!response.ok) {
            const errorData: ForecastError = await response.json();
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }

        const data: ForecastResponse = await response.json();

        console.log(`✅ [ForecastService] Données reçues: ${data.metadata.daily_card_count} jours`);
        console.log(`📊 [ForecastService] Algorithme: ${data.metadata.algorithm}`);

        return data.dailyCardData;

    } catch (error) {
        console.error("❌ [ForecastService] Erreur:", error);
        throw new Error(`Impossible de récupérer les prévisions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

/**
 * Récupère les données complètes de prévisions (pour usage avancé)
 */
export async function fetchFullForecastData(lat: number, lon: number): Promise<ForecastResponse> {
    try {
        const response = await fetch(`/api/forecast?lat=${lat}&lon=${lon}`);

        if (!response.ok) {
            const errorData: ForecastError = await response.json();
            throw new Error(errorData.error || `Erreur HTTP ${response.status}`);
        }

        return await response.json();

    } catch (error) {
        console.error("❌ [ForecastService] Erreur complète:", error);
        throw new Error(`Impossible de récupérer les prévisions complètes: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
}

/**
 * Récupère les statistiques des caches multi-niveaux pour debug
 */
export async function fetchCacheStats(): Promise<any> {
    try {
        console.log(`📊 [ForecastService] Récupération des stats de cache...`);

        const response = await fetch(`/api/cache-stats`);

        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}`);
        }

        const stats = await response.json();
        console.log(`✅ [ForecastService] Stats de cache reçues`);
        
        return stats;

    } catch (error) {
        console.error("❌ [ForecastService] Erreur stats cache:", error);
        return {
            error: error instanceof Error ? error.message : 'Erreur inconnue',
            cache_system: "unavailable"
        };
    }
}


