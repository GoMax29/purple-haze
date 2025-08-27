/**
 * Service de gestion du localStorage pour les favoris et historique
 */

import { LocationData } from './geocoding';

const STORAGE_KEYS = {
    FAVORITES: 'weather_app_favorites',
    RECENT_SEARCHES: 'weather_app_recent_searches',
    SELECTED_LOCATION: 'weather_app_selected_location'
} as const;

const MAX_RECENT_SEARCHES = 5;
const MAX_FAVORITES = 20;

/**
 * Migre les anciennes données avec emojis vers les URLs FlagCDN
 */
function migrateFlagData(data: LocationData[]): LocationData[] {
    return data.map(location => ({
        ...location,
        flag: location.flag && location.flag.startsWith('http')
            ? location.flag
            : `https://flagcdn.com/24x18/${location.country.toLowerCase()}.png`
    }));
}

/**
 * Gestion des favoris
 */
export class FavoritesService {
    static getFavorites(): LocationData[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
            const data = stored ? JSON.parse(stored) : [];
            const migratedData = migrateFlagData(data);

            // Sauvegarder les données migrées
            if (data.length !== migratedData.length || JSON.stringify(data) !== JSON.stringify(migratedData)) {
                localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(migratedData));
            }

            return migratedData;
        } catch (error) {
            console.error('Erreur lors de la lecture des favoris:', error);
            return [];
        }
    }

    static addFavorite(location: LocationData): LocationData[] {
        try {
            const favorites = this.getFavorites();

            // Vérifier si déjà en favoris
            const exists = favorites.some(fav =>
                Math.abs(fav.lat - location.lat) < 0.001 &&
                Math.abs(fav.lon - location.lon) < 0.001
            );

            if (!exists) {
                const newFavorites = [location, ...favorites].slice(0, MAX_FAVORITES);
                localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
                return newFavorites;
            }

            return favorites;
        } catch (error) {
            console.error('Erreur lors de l\'ajout aux favoris:', error);
            return this.getFavorites();
        }
    }

    static removeFavorite(location: LocationData): LocationData[] {
        try {
            const favorites = this.getFavorites();
            const newFavorites = favorites.filter(fav =>
                !(Math.abs(fav.lat - location.lat) < 0.001 &&
                    Math.abs(fav.lon - location.lon) < 0.001)
            );

            localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(newFavorites));
            return newFavorites;
        } catch (error) {
            console.error('Erreur lors de la suppression du favori:', error);
            return this.getFavorites();
        }
    }

    static isFavorite(location: LocationData): boolean {
        const favorites = this.getFavorites();
        return favorites.some(fav =>
            Math.abs(fav.lat - location.lat) < 0.001 &&
            Math.abs(fav.lon - location.lon) < 0.001
        );
    }

    static clearFavorites(): void {
        try {
            localStorage.removeItem(STORAGE_KEYS.FAVORITES);
        } catch (error) {
            console.error('Erreur lors de la suppression des favoris:', error);
        }
    }
}

/**
 * Gestion des recherches récentes
 */
export class RecentSearchesService {
    static getRecentSearches(): LocationData[] {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES);
            const data = stored ? JSON.parse(stored) : [];
            const migratedData = migrateFlagData(data);

            // Sauvegarder les données migrées
            if (data.length !== migratedData.length || JSON.stringify(data) !== JSON.stringify(migratedData)) {
                localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(migratedData));
            }

            return migratedData;
        } catch (error) {
            console.error('Erreur lors de la lecture des recherches récentes:', error);
            return [];
        }
    }

    static addRecentSearch(location: LocationData): LocationData[] {
        try {
            const recent = this.getRecentSearches();

            // Supprimer si déjà présent
            const filtered = recent.filter(item =>
                !(Math.abs(item.lat - location.lat) < 0.001 &&
                    Math.abs(item.lon - location.lon) < 0.001)
            );

            // Ajouter en première position
            const newRecent = [location, ...filtered].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(newRecent));
            return newRecent;
        } catch (error) {
            console.error('Erreur lors de l\'ajout à l\'historique:', error);
            return this.getRecentSearches();
        }
    }

    static clearRecentSearches(): void {
        try {
            localStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES);
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'historique:', error);
        }
    }
}

/**
 * Gestion de la localisation sélectionnée
 */
export class SelectedLocationService {
    static getSelectedLocation(): LocationData | null {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_LOCATION);
            if (!stored) return null;

            const data = JSON.parse(stored);
            const migratedData = migrateFlagData([data])[0];

            // Sauvegarder la donnée migrée
            if (JSON.stringify(data) !== JSON.stringify(migratedData)) {
                localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION, JSON.stringify(migratedData));
            }

            return migratedData;
        } catch (error) {
            console.error('Erreur lors de la lecture de la localisation sélectionnée:', error);
            return null;
        }
    }

    static setSelectedLocation(location: LocationData): void {
        try {
            localStorage.setItem(STORAGE_KEYS.SELECTED_LOCATION, JSON.stringify(location));
        } catch (error) {
            console.error('Erreur lors de la sauvegarde de la localisation:', error);
        }
    }

    static clearSelectedLocation(): void {
        try {
            localStorage.removeItem(STORAGE_KEYS.SELECTED_LOCATION);
        } catch (error) {
            console.error('Erreur lors de la suppression de la localisation:', error);
        }
    }
}

/**
 * Utilitaires
 */
export function clearAllData(): void {
    FavoritesService.clearFavorites();
    RecentSearchesService.clearRecentSearches();
    SelectedLocationService.clearSelectedLocation();
}

/**
 * Force la migration de toutes les données localStorage (pour debugging)
 */
export function forceMigration(): void {
    console.log('🔄 Migration forcée des données localStorage...');

    // Forcer le rechargement et la migration de toutes les données
    FavoritesService.getFavorites();
    RecentSearchesService.getRecentSearches();
    SelectedLocationService.getSelectedLocation();

    console.log('✅ Migration terminée');
}
