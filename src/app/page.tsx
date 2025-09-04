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
import { getDynamicBackground } from "@/utils/dynamicBackground";
import { fetchMeteoData } from "@/lib/fetchMeteoData";
import { extractTimezoneInfo, TimezoneInfo } from "@/utils/timezoneHelper";
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
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo>({});
  const [dynamicBg, setDynamicBg] = useState(getDynamicBackground());

  const DEFAULT_LOCATION: LocationData = {
    id: "paris-default",
    name: "Paris",
    country: "FR",
    state: "Île-de-France",
    lat: 48.8566,
    lon: 2.3522,
    flag: "https://flagcdn.com/24x18/fr.png",
    fullName: "Paris, Île-de-France, FR",
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

  // Mise à jour du fond dynamique selon les données météo et timezone
  useEffect(() => {
    const newBg = getDynamicBackground(
      currentWeatherData,
      timezoneInfo?.timezone
    );
    setDynamicBg(newBg);
  }, [currentWeatherData, timezoneInfo?.timezone]);

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

      // Récupérer en parallèle les données current et la timezone
      const [currentData, meteoData] = await Promise.all([
        fetchCurrentWeather(lat, lon, {
          name: locationName,
          forceRefresh: false,
        }),
        fetchMeteoData(lat, lon),
      ]);

      setCurrentWeatherData(currentData);

      // Extraire la timezone depuis les données brutes API1
      const rawApiData = meteoData?.api1?.data;
      if (rawApiData) {
        const timezone = extractTimezoneInfo(rawApiData);
        setTimezoneInfo(timezone);
        console.log(`🌍 [HomePage] Timezone détectée: ${timezone.timezone}`);
      }

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
    <main
      className="min-h-screen transition-all duration-1000"
      style={{ background: dynamicBg.gradient }}
    >
      {/* Contenu principal - dégradé étendu jusqu'en haut */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-8">
        {mode === "weather" ? (
          <div className="space-y-1">
            <NewHeader
              onLocationSelect={handleLocationSelect}
              currentLocation={currentLocation}
              selectedCity={currentLocation?.name}
            />
            <div>
              {/* Suppression du cadre pour affichage direct sur fond global */}
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
