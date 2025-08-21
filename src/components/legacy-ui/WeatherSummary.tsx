"use client";

import React, { useState, useEffect } from "react";
import NowSection from "./NowSection";
import WeeklySection from "./WeeklySection";
import HourlySlotsSection from "./HourlySlotsSection";
import { DailyWeatherData } from "@/types/dailyData";
import { fetchFullForecastData } from "@/services/forecastService";

interface WeatherSummaryProps {
  // Props pour NowSection
  locationName?: string;
  currentTime?: string;
  temperature?: number;
  emoji?: string;
  condition?: string;
  feelsLike?: number;
  uvIndex?: number;
  uvDescription?: string;
  humidity?: number;
  aqi?: number;
  aqiDescription?: string;
  precipitation?: number;
  windSpeed?: number;
  windDirection?: string;

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
  feelsLike,
  uvIndex,
  uvDescription,
  humidity,
  aqi,
  aqiDescription,
  precipitation,
  windSpeed,
  windDirection,

  // Props pour WeeklySection
  dailyData,
  selectedDayIndex,
  onDaySelect,

  // Props pour HourlySlotsSection
  currentLocation,
}) => {
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [isLoadingHourly, setIsLoadingHourly] = useState(false);

  // Récupérer les données horaires une seule fois par localisation
  useEffect(() => {
    if (currentLocation?.lat && currentLocation?.lon) {
      console.log(
        `🔄 [WeatherSummary] useEffect triggered for: ${currentLocation.lat}, ${currentLocation.lon}`
      );
      loadHourlyDataOnce();
    }
  }, [currentLocation?.lat, currentLocation?.lon]); // Dépendances spécifiques

  const loadHourlyDataOnce = async () => {
    if (!currentLocation) return;

    setIsLoadingHourly(true);
    try {
      console.log(
        `🔄 [WeatherSummary] Récupération unique des données horaires pour ${currentLocation.lat}, ${currentLocation.lon}`
      );

      const data = await fetchFullForecastData(
        currentLocation.lat,
        currentLocation.lon
      );
      setHourlyData(data.forecastData.hourlyData);

      console.log(
        `✅ [WeatherSummary] Données horaires chargées: ${data.forecastData.hourlyData.length} heures`
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
        background:
          "linear-gradient(145deg, #1a1f3a 0%, #2d1b69 50%, #3b0764 100%)",
        borderRadius: "20px",
        margin: "20px 0",
        overflow: "hidden",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
        color: "white",
      }}
    >
      {/* Section conditions actuelles */}
      <div
        style={{
          background:
            "linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #9333ea 100%)",
        }}
      >
        <NowSection
          locationName={locationName}
          currentTime={currentTime}
          temperature={temperature}
          emoji={emoji}
          condition={condition}
          feelsLike={feelsLike}
          uvIndex={uvIndex}
          uvDescription={uvDescription}
          humidity={humidity}
          aqi={aqi}
          aqiDescription={aqiDescription}
          precipitation={precipitation}
          windSpeed={windSpeed}
          windDirection={windDirection}
          // Coordonnées + élévation (si disponibles dans metadata côté appelant)
          latitude={undefined}
          longitude={undefined}
          elevation={undefined}
        />
      </div>

      {/* Section Horaire - Nouveau composant optimisé avec cache */}
      {dailyData && hourlyData.length > 0 && !isLoadingHourly ? (
        <HourlySlotsSection
          selectedDayIndex={selectedDayIndex || 0}
          dailyData={dailyData}
          hourlyData={hourlyData}
        />
      ) : isLoadingHourly ? (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            color: "white",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "16px",
            margin: "20px 0",
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
