"use client";

import React, { useState, useEffect } from "react";
import NowSection from "./NowSection";
import WeeklySection from "./WeeklySection";
import HourlySlotsSection from "./HourlySlotsSection";
import { DailyWeatherData } from "@/types/dailyData";
import { fetchFullForecastData } from "@/services/forecastService";
import { fetchMeteoData } from "@/lib/fetchMeteoData";
import {
  TimezoneInfo,
  getCurrentTimeInTimezone,
  extractTimezoneInfo,
} from "@/utils/timezoneHelper";

interface WeatherSummaryProps {
  // Props pour NowSection
  locationName?: string;
  currentTime?: string;
  temperature?: number;
  emoji?: string;
  condition?: string;
  region?: string;
  country?: string;
  feelsLike?: number;
  uvIndex?: number;
  uvDescription?: string;
  humidity?: number;
  aqi?: number;
  aqiDescription?: string;
  precipitation?: number;
  windSpeed?: number;
  windDirection?: string;

  // Nouvelles props pour l'API current
  latitude?: number;
  longitude?: number;
  useCurrentApi?: boolean;
  isDay?: boolean;

  // Props pour WeeklySection
  dailyData?: DailyWeatherData[];
  selectedDayIndex?: number;
  onDaySelect?: (index: number) => void;

  // Props pour HourlySlotsSection
  currentLocation?: { lat: number; lon: number } | null;
}

const WeatherSummary: React.FC<WeatherSummaryProps> = ({
  // Props pour NowSection
  locationName,
  currentTime,
  temperature,
  emoji,
  condition,
  region,
  country,
  feelsLike,
  uvIndex,
  uvDescription,
  humidity,
  aqi,
  aqiDescription,
  precipitation,
  windSpeed,
  windDirection,

  // Nouvelles props pour l'API current
  latitude,
  longitude,
  useCurrentApi,
  isDay,

  // Props pour WeeklySection
  dailyData,
  selectedDayIndex,
  onDaySelect,

  // Props pour HourlySlotsSection
  currentLocation,
}) => {
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneInfo>({});
  const [currentUvIndex, setCurrentUvIndex] = useState<number | undefined>(
    uvIndex
  );
  const [currentAqi, setCurrentAqi] = useState<number | undefined>(aqi);
  const [currentTimeInLocation, setCurrentTimeInLocation] = useState<string>(
    currentTime || "--:--"
  );

  // Récupérer les données horaires une seule fois par localisation
  useEffect(() => {
    if (currentLocation?.lat && currentLocation?.lon) {
      console.log(
        `🔄 [WeatherSummary] useEffect triggered for: ${currentLocation.lat}, ${currentLocation.lon}`
      );
      loadHourlyDataOnce();
    }
  }, [currentLocation?.lat, currentLocation?.lon]); // Dépendances spécifiques

  // Mettre à jour l'heure courante selon la timezone de la location
  useEffect(() => {
    if (!timezoneInfo.timezone) return;

    const updateTime = () => {
      const timeInLocation = getCurrentTimeInTimezone(timezoneInfo.timezone);
      setCurrentTimeInLocation(timeInLocation);
    };

    // Mise à jour initiale
    updateTime();

    // Mise à jour chaque minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [timezoneInfo.timezone]);

  const loadHourlyDataOnce = async () => {
    if (!currentLocation) return;

    setIsLoadingHourly(true);
    try {
      console.log(
        `🔄 [WeatherSummary] Récupération unique des données horaires pour ${currentLocation.lat}, ${currentLocation.lon}`
      );

      // Appeler en parallèle les données de prévisions et les données brutes
      const [forecastData, rawMeteoData] = await Promise.all([
        fetchFullForecastData(currentLocation.lat, currentLocation.lon),
        fetchMeteoData(currentLocation.lat, currentLocation.lon),
      ]);

      setHourlyData(forecastData.forecastData.hourlyData);

      // Extraire les informations de timezone depuis les données brutes API1
      const rawApiData = rawMeteoData?.api1?.data;
      if (rawApiData) {
        const timezone = extractTimezoneInfo(rawApiData);
        setTimezoneInfo(timezone);
        console.log(
          `🌍 [WeatherSummary] Timezone détectée: ${timezone.timezone}`
        );
      }

      // Extraire UV et AQI depuis les données brutes API2 (utiliser current si disponible, sinon hourly[0])
      const uvAqiData = rawMeteoData?.api2?.data;
      if (uvAqiData) {
        // Priorité aux données current si disponibles
        let currentUV, currentAQI;

        if (uvAqiData.current) {
          currentUV = uvAqiData.current.uv_index;
          currentAQI = uvAqiData.current.european_aqi;
          console.log(
            `☀️ [WeatherSummary] UV/AQI depuis current: ${currentUV}/${currentAQI}`
          );
        } else if (uvAqiData.hourly) {
          // Fallback vers hourly[0] si pas de current
          currentUV = uvAqiData.hourly.uv_index?.[0];
          currentAQI = uvAqiData.hourly.european_aqi?.[0];
          console.log(
            `☀️ [WeatherSummary] UV/AQI depuis hourly[0]: ${currentUV}/${currentAQI}`
          );
        }

        if (currentUV !== undefined)
          setCurrentUvIndex(Math.round(currentUV * 10) / 10); // Garder 1 décimale pour UV
        if (currentAQI !== undefined) setCurrentAqi(Math.round(currentAQI));
      }

      console.log(
        `✅ [WeatherSummary] Données horaires chargées: ${forecastData.forecastData.hourlyData.length} heures`
      );
    } catch (error) {
      console.error(
        "❌ [WeatherSummary] Erreur chargement données horaires:",
        error
      );
      setHourlyData([]);
    } finally {
      setIsLoadingHourly(false);
    }
  };
  return (
    <div
      className="weather-summary"
      style={{
        background: "transparent",
        borderRadius: "0",
        margin: "0",
        overflow: "visible",
        boxShadow: "none",
        color: "white",
      }}
    >
      {/* Section conditions actuelles */}
      <div
        style={{
          background: "transparent",
        }}
      >
        <NowSection
          locationName={locationName}
          currentTime={currentTimeInLocation}
          temperature={temperature}
          emoji={emoji}
          condition={condition}
          region={region}
          country={country}
          feelsLike={feelsLike}
          uvIndex={currentUvIndex}
          uvDescription={uvDescription}
          humidity={humidity}
          aqi={currentAqi}
          aqiDescription={aqiDescription}
          precipitation={precipitation}
          windSpeed={windSpeed}
          windDirection={windDirection}
          // Coordonnées pour l'API current
          latitude={latitude}
          longitude={longitude}
          elevation={undefined}
          // Nouvelles props pour l'API current
          useCurrentApi={useCurrentApi}
          // Informations de timezone
          timezoneInfo={timezoneInfo}
        />
      </div>

      {/* Section Horaire - Nouveau composant optimisé avec cache */}
      {dailyData && hourlyData.length > 0 && !isLoadingHourly ? (
        <HourlySlotsSection
          selectedDayIndex={selectedDayIndex || 0}
          dailyData={dailyData}
          hourlyData={hourlyData}
          timezoneInfo={timezoneInfo}
        />
      ) : isLoadingHourly ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "white",
            background: "transparent",
            borderRadius: "0",
            margin: "0",
          }}
        >
          Chargement optimisé des prévisions horaires...
        </div>
      ) : null}

      {/* Section 7 jours - utilise WeeklySection avec DailyCard */}
      <WeeklySection
        dailyData={dailyData}
        selectedDayIndex={selectedDayIndex}
        onDaySelect={onDaySelect}
      />
    </div>
  );
};

export default WeatherSummary;
