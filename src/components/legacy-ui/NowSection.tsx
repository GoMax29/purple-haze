"use client";

import React, { useEffect, useState } from "react";
import { fetchCurrentWeather } from "../../lib/fetchMeteoData.js";
import { TimezoneInfo } from "@/utils/timezoneHelper";
import { getWmoFinalIconPath } from "@/utils/wmoFinalIcons";
import { getDayNightStateAt } from "@/utils/dayNight";

interface NowSectionProps {
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
  // Coordonnées + élévation (affichage sous le titre)
  latitude?: number;
  longitude?: number;
  elevation?: number | null;
  // Nouvelles props pour utiliser l'API current
  useCurrentApi?: boolean;
  spotId?: string; // Pour utiliser un spot prédéfini
  // Informations de timezone
  timezoneInfo?: TimezoneInfo;
}

interface CurrentWeatherData {
  temperature_2m: number;
  relative_humidity_2m: number;
  apparent_temperature: number;
  is_day: boolean;
  precipitation: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  weather_description: string;
  weather_emoji: string;
  wind_direction_text: string;
}

const NowSection: React.FC<NowSectionProps> = ({
  locationName = "Maintenant",
  currentTime = "--:--",
  temperature = 0,
  emoji = "🌤️",
  condition = "Chargement...",
  region,
  country,
  feelsLike = 0,
  uvIndex = 0,
  uvDescription = "--",
  humidity = 0,
  aqi = 0,
  aqiDescription = "--",
  precipitation = 0,
  windSpeed = 0,
  windDirection = "--",
  latitude,
  longitude,
  elevation,
  useCurrentApi = false,
  spotId,
  timezoneInfo,
}) => {
  const [currentWeather, setCurrentWeather] =
    useState<CurrentWeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les données current
  const fetchCurrentData = async () => {
    if (!useCurrentApi) return;

    if (!spotId && (!latitude || !longitude)) {
      setError("Coordonnées ou spotId requis pour l'API current");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let data;
      if (spotId) {
        const { fetchCurrentWeatherBySpot } = await import(
          "../../lib/fetchMeteoData.js"
        );
        data = await fetchCurrentWeatherBySpot(spotId);
      } else {
        data = await fetchCurrentWeather(latitude!, longitude!, {
          name: locationName,
          forceRefresh: false,
        });
      }

      setCurrentWeather(data.current);
    } catch (err) {
      console.error("Erreur lors de la récupération des données current:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  // useEffect pour récupérer les données au montage et lors de changements
  useEffect(() => {
    fetchCurrentData();
  }, [useCurrentApi, spotId, latitude, longitude]);

  // Nettoyer le titre pour enlever le préfixe éventuel
  const cleanCityName = (value: string): string =>
    value.replace(/^Maintenant à\s*/i, "").trim();

  // Fonction pour obtenir l'icône météo PNG selon la logique jour/nuit
  const getWeatherIcon = (weatherCode: number, isDay: boolean): string => {
    const variant = isDay ? "day" : "night";
    return getWmoFinalIconPath(weatherCode, variant);
  };

  // Déterminer les valeurs à afficher (API current ou props)
  const displayData = currentWeather
    ? {
        temperature: Math.round(currentWeather.temperature_2m),
        emoji: currentWeather.weather_emoji,
        weatherIcon: getWeatherIcon(
          currentWeather.weather_code,
          currentWeather.is_day
        ),
        condition: currentWeather.weather_description,
        feelsLike: Math.round(currentWeather.apparent_temperature),
        humidity: currentWeather.relative_humidity_2m,
        precipitation: currentWeather.precipitation,
        windSpeed: Math.round(currentWeather.wind_speed_10m),
        windDirection: currentWeather.wind_direction_text,
        isDay: currentWeather.is_day,
        weatherCode: currentWeather.weather_code,
      }
    : {
        temperature,
        emoji,
        weatherIcon: getWeatherIcon(0, true), // Code WMO 0 (ciel clair) par défaut
        condition: loading
          ? "Chargement..."
          : error
          ? `Erreur: ${error}`
          : condition,
        feelsLike,
        humidity,
        precipitation,
        windSpeed,
        windDirection,
        isDay: true, // Par défaut jour si pas de données API
        weatherCode: 0,
      };
  const getUvColor = (uv: number): string => {
    if (uv <= 2) return "#51f1e6";
    if (uv <= 5) return "#50ccaa";
    if (uv <= 7) return "#f1e741";
    if (uv <= 10) return "#ff5151";
    return "#970033";
  };

  const getAqiColor = (aqi: number): string => {
    if (aqi <= 20) return "#51f1e6";
    if (aqi <= 40) return "#50ccaa";
    if (aqi <= 60) return "#f1e741";
    if (aqi <= 80) return "#ff5151";
    return "#970033";
  };

  // Fonction pour obtenir les couleurs de fond jour/nuit
  const getBackgroundStyle = (isDay: boolean) => {
    if (isDay) {
      // Thème jour - dégradé bleu clair
      return {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      };
    } else {
      // Thème nuit - dégradé sombre
      return {
        background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
      };
    }
  };

  return (
    <div
      className="now-section"
      style={{
        background: "transparent",
        padding: "4px 4px 4px 4px",
        borderBottom: "none",
        borderRadius: "0",
        margin: "0",
        boxShadow: "none",
      }}
    >
      {/* 1) Ville - centrée (pas de coordonnées, pas d'heure) */}
      <div
        className="city-name"
        style={{
          textAlign: "center",
          fontSize: "1.8em",
          fontWeight: 700,
          color: "white",
          marginBottom: "3px", // réduit pour rapprocher le nom de la ville
          letterSpacing: "0.3px",
          fontFamily: 'Nexa, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {cleanCityName(locationName)}
      </div>
      {/* Sous-titre: région + pays */}
      {(region || country) && (
        <div
          className="city-subtitle"
          style={{
            textAlign: "center",
            fontSize: "1.05em",
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: 300,
            marginBottom: "2px",
            fontFamily:
              'Nexa, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          }}
        >
          {[region, country].filter(Boolean).join(" · ")}
        </div>
      )}

      {/* 2) Température + icône météo */}
      <div
        className="now-weather-line"
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "14px",
          marginBottom: "2px",
          marginTop: "2px",
          justifyContent: "center",
          fontFamily: 'Nexa, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        <div
          className="main-temp"
          style={{
            fontSize: "5.2em",
            fontWeight: 200,
            color: "white",
            lineHeight: 1,
            letterSpacing: "-2px",
          }}
        >
          {displayData.temperature}°
        </div>
        <div
          className="main-weather-icon"
          style={{
            width: "100px",
            height: "100px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={displayData.weatherIcon}
            alt={displayData.condition}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
      </div>

      {/* 3) Description météo */}
      <div
        className="weather-description"
        style={{
          textAlign: "center",
          fontSize: "1.15em",
          color: "rgba(255, 255, 255, 0.9)",
          fontWeight: 300,
          marginBottom: "2px",
          fontFamily: 'Nexa, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {displayData.condition}
      </div>

      {/* 4) Infos secondaires - masquées pour l'instant */}
      {false && (
        <div
          className="now-details-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px 20px",
            fontSize: "0.9em",
          }}
        >
          {/* ... contenu des infos secondaires conservé mais masqué ... */}
        </div>
      )}
    </div>
  );
};

export default NowSection;
