import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface Location {
    lat: number
    lng: number
    name: string
    region: string
}

interface WeatherPreferences {
    temperatureUnit: 'celsius' | 'fahrenheit'
    windSpeedUnit: 'kmh' | 'ms' | 'mph'
    pressureUnit: 'hpa' | 'mmhg' | 'inhg'
    timeFormat: '12h' | '24h'
}

interface ForecastStrategy {
    temperature: any
    precipitation: any
    wind: any
    pressure: any
}

interface WeatherState {
    // Location
    currentLocation: Location | null
    favoriteLocations: Location[]

    // Preferences
    preferences: WeatherPreferences

    // App state
    isLoading: boolean
    lastUpdate: string | null
    error: string | null

    // Forecast strategy
    forecastStrategy: ForecastStrategy | null

    // Actions
    setLocation: (location: Location) => void
    addFavoriteLocation: (location: Location) => void
    removeFavoriteLocation: (locationName: string) => void
    setPreferences: (preferences: Partial<WeatherPreferences>) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    setLastUpdate: (timestamp: string) => void
    setForecastStrategy: (strategy: ForecastStrategy) => void
    resetState: () => void
}

const defaultPreferences: WeatherPreferences = {
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    pressureUnit: 'hpa',
    timeFormat: '24h'
}

const defaultLocation: Location = {
    lat: 48.2020471,
    lng: -2.9326435,
    name: 'Saint-Brieuc',
    region: 'Bretagne'
}

export const useWeatherStore = create<WeatherState>()(
    devtools(
        persist(
            (set, get) => ({
                // Initial state
                currentLocation: defaultLocation,
                favoriteLocations: [
                    defaultLocation,
                    {
                        lat: 48.3905283,
                        lng: -4.4860088,
                        name: 'Brest',
                        region: 'Bretagne'
                    },
                    {
                        lat: 47.2173404,
                        lng: -1.5534036,
                        name: 'Nantes',
                        region: 'Pays de la Loire'
                    },
                    {
                        lat: 48.6905283,
                        lng: -3.4860088,
                        name: 'Lannion',
                        region: 'Bretagne'
                    }
                ],
                preferences: defaultPreferences,
                isLoading: false,
                lastUpdate: null,
                error: null,
                forecastStrategy: null,

                // Actions
                setLocation: (location) =>
                    set({ currentLocation: location }, false, 'setLocation'),

                addFavoriteLocation: (location) =>
                    set((state) => {
                        const exists = state.favoriteLocations.some(
                            loc => loc.name === location.name
                        )
                        if (!exists) {
                            return {
                                favoriteLocations: [...state.favoriteLocations, location]
                            }
                        }
                        return state
                    }, false, 'addFavoriteLocation'),

                removeFavoriteLocation: (locationName) =>
                    set((state) => ({
                        favoriteLocations: state.favoriteLocations.filter(
                            loc => loc.name !== locationName
                        )
                    }), false, 'removeFavoriteLocation'),

                setPreferences: (newPreferences) =>
                    set((state) => ({
                        preferences: { ...state.preferences, ...newPreferences }
                    }), false, 'setPreferences'),

                setLoading: (loading) =>
                    set({ isLoading: loading }, false, 'setLoading'),

                setError: (error) =>
                    set({ error }, false, 'setError'),

                setLastUpdate: (timestamp) =>
                    set({ lastUpdate: timestamp }, false, 'setLastUpdate'),

                setForecastStrategy: (strategy) =>
                    set({ forecastStrategy: strategy }, false, 'setForecastStrategy'),

                resetState: () =>
                    set({
                        currentLocation: defaultLocation,
                        favoriteLocations: [defaultLocation],
                        preferences: defaultPreferences,
                        isLoading: false,
                        lastUpdate: null,
                        error: null,
                        forecastStrategy: null
                    }, false, 'resetState')
            }),
            {
                name: 'weather-store',
                partialize: (state) => ({
                    currentLocation: state.currentLocation,
                    favoriteLocations: state.favoriteLocations,
                    preferences: state.preferences,
                    forecastStrategy: state.forecastStrategy
                })
            }
        ),
        {
            name: 'weather-store'
        }
    )
) 