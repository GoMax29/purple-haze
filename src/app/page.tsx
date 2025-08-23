"use client";

import { useEffect, useState } from "react";
import { NewHeader, WeatherSummary } from "@/components/legacy-ui";
import { LocationData } from "@/services/geocoding";
import {
  SelectedLocationService,
  forceMigration,
} from "@/services/localStorage";
import { fetchForecastData } from "@/services/forecastService";
import { DailyWeatherData } from "@/types/dailyData";
import { fetchCurrentWeather } from "@/lib/fetchMeteoData.js";
// Import des anciens composants (à adapter selon la structure existante)
// import NowForecast from "@/components/NowForecast";
// import HourlyForecast from "@/components/HourlyForecast";
// import WeeklyForecast from "@/components/WeeklyForecast";
// import SurfSpotMap from "@/components/SurfSpotMap";
// import { useWeatherStore } from "@/store/weatherStore";

export default function HomePage() {
  const [mode, setMode] = useState<"weather" | "surf">("weather");
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [dailyWeatherData, setDailyWeatherData] = useState<DailyWeatherData[]>(
    []
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>("--:--");
  const [currentWeatherData, setCurrentWeatherData] = useState<any>(null);
  const [loadingCurrentWeather, setLoadingCurrentWeather] = useState(false);

  const DEFAULT_LOCATION: LocationData = {
    id: "plomeur-default",
    name: "Plomeur",
    country: "FR",
    state: "Bretagne",
    lat: 47.833287,
    lon: -4.26567,
    flag: "https://flagcdn.com/24x18/fr.png",
    fullName: "Plomeur, Bretagne, FR",
  };

  useEffect(() => {
    forceMigration();
    const savedLocation = SelectedLocationService.getSelectedLocation();
    const location = savedLocation || DEFAULT_LOCATION;
    setCurrentLocation(location);
    fetchWeatherData(location.lat, location.lon);
    fetchCurrentWeatherData(location.lat, location.lon, location.name);
    // Heures côté client uniquement pour éviter les mismatches SSR/CSR
    const update = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const fetchWeatherData = async (lat: number, lon: number) => {
    try {
      const dailyData = await fetchForecastData(lat, lon);
      setDailyWeatherData(dailyData);
    } catch (e) {
      setDailyWeatherData([]);
    }
  };

  const fetchCurrentWeatherData = async (
    lat: number,
    lon: number,
    locationName: string
  ) => {
    setLoadingCurrentWeather(true);
    try {
      console.log(
        `🔄 Récupération données current pour ${locationName} (${lat}, ${lon})`
      );
      const currentData = await fetchCurrentWeather(lat, lon, {
        name: locationName,
        forceRefresh: false,
      });
      setCurrentWeatherData(currentData);
      console.log(
        `✅ Données current récupérées pour ${locationName}`,
        currentData
      );
    } catch (error) {
      console.error(
        `❌ Erreur lors de la récupération des données current:`,
        error
      );
      setCurrentWeatherData(null);
    } finally {
      setLoadingCurrentWeather(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setCurrentLocation(location);
    SelectedLocationService.setSelectedLocation(location);
    fetchWeatherData(location.lat, location.lon);
    fetchCurrentWeatherData(location.lat, location.lon, location.name);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
      {/* Header épuré (temporaire) */}
      <header className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" />
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === "weather" ? (
          <div className="space-y-8">
            <NewHeader
              onLocationSelect={handleLocationSelect}
              currentLocation={currentLocation}
              selectedCity={currentLocation?.name}
            />
            <div className="rounded-2xl p-0">
              {/* pas de cadre blanc autour */}
              <WeatherSummary
                locationName={
                  currentLocation
                    ? `Maintenant à ${currentLocation.name}`
                    : "Maintenant"
                }
                currentTime={currentTime}
                // Utiliser les données current weather si disponibles, sinon valeurs par défaut
                temperature={
                  currentWeatherData?.current?.temperature_2m
                    ? Math.round(currentWeatherData.current.temperature_2m)
                    : 21
                }
                emoji={currentWeatherData?.current?.weather_emoji || "🌤️"}
                condition={
                  currentWeatherData?.current?.weather_description ||
                  (loadingCurrentWeather
                    ? "Chargement..."
                    : "Partiellement nuageux")
                }
                feelsLike={
                  currentWeatherData?.current?.apparent_temperature
                    ? Math.round(
                        currentWeatherData.current.apparent_temperature
                      )
                    : 20
                }
                uvIndex={5}
                uvDescription="Modéré"
                humidity={
                  currentWeatherData?.current?.relative_humidity_2m || 65
                }
                aqi={42}
                aqiDescription="Correct"
                precipitation={
                  currentWeatherData?.current?.precipitation || 0.2
                }
                windSpeed={
                  currentWeatherData?.current?.wind_speed_10m
                    ? Math.round(currentWeatherData.current.wind_speed_10m)
                    : 15
                }
                windDirection={
                  currentWeatherData?.current?.wind_direction_text || "SW"
                }
                dailyData={dailyWeatherData}
                selectedDayIndex={selectedDayIndex}
                onDaySelect={setSelectedDayIndex}
                currentLocation={currentLocation}
                // Passer les coordonnées et activer l'API current
                latitude={currentLocation?.lat}
                longitude={currentLocation?.lon}
                useCurrentApi={true}
                isDay={currentWeatherData?.current?.is_day}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                🏄‍♂️ Mode Surf
              </h2>
              <p className="text-white/80 mb-6">
                Les composants surf seront développés dans les prochains
                milestones.
              </p>
              <div className="text-white/60">
                Milestone 2 : Configuration JSON • Milestone 3 : Module central
              </div>
            </div>
            {/* 
            <SurfSpotMap />
            */}
          </div>
        )}
      </div>
    </main>
  );
}
