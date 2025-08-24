"use client";

import React from "react";
import {
  getTemperatureColor,
  getContrastTextColor,
} from "../../utils/temperatureColors";
import PrecipitationWidget from "../ui/PrecipitationWidget";

interface HourlyCardProps {
  time: string;
  temperature: number;
  emoji: string;
  feelsLike?: number;
  windSpeed?: number;
  windDirection?: string;
  windDirectionDegrees?: number;
  precipitation?: number;
  precipitationProbability?: number;
  graphcastPrecipitation?: number;
  graphcastProbability?: number;
  humidity?: number;
  uvIndex?: number;
  aqi?: number;
  isSelected?: boolean;
  isCurrent?: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
}

const HourlyCard: React.FC<HourlyCardProps> = ({
  time,
  temperature,
  emoji,
  feelsLike,
  windSpeed = 0,
  windDirection = "--",
  windDirectionDegrees,
  precipitation = 0,
  precipitationProbability = 0,
  graphcastPrecipitation = 0,
  graphcastProbability = 0,
  humidity = 0,
  uvIndex = 0,
  aqi,
  isSelected = false,
  isCurrent = false,
  isExpanded = false,
  onClick,
}) => {
  const getAqiColor = (aqi: number): string => {
    if (aqi <= 20) return "#51f1e6";
    if (aqi <= 40) return "#50ccaa";
    if (aqi <= 60) return "#f1e741";
    if (aqi <= 80) return "#ff5151";
    return "#970033";
  };

  const getUvColor = (uv: number): string => {
    if (uv <= 2) return "#51f1e6";
    if (uv <= 5) return "#50ccaa";
    if (uv <= 7) return "#f1e741";
    if (uv <= 10) return "#ff5151";
    return "#970033";
  };

  const cardClasses = [
    "hourly-card",
    isSelected ? "current" : "",
    isCurrent ? "current-time" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // Déterminer la couleur de fond basée sur la température
  const tempColor = getTemperatureColor(temperature);
  const textColor = getContrastTextColor(tempColor);

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      style={{
        minWidth: isExpanded ? "160px" : "140px",
        maxHeight: isExpanded ? "auto" : "350px",
        background:
          isSelected || isCurrent
            ? "linear-gradient(135deg, #7c3aed, #9333ea)"
            : "rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: isExpanded ? "16px 12px" : "12px 8px",
        textAlign: "center",
        border:
          isSelected || isCurrent
            ? "2px solid #fbbf24"
            : "2px solid transparent",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: isExpanded ? "8px" : "3px",
        cursor: onClick ? "pointer" : "default",
        boxShadow:
          isSelected || isCurrent ? "0 0 15px rgba(251, 191, 36, 0.4)" : "none",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (onClick && !isSelected && !isCurrent) {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !isSelected && !isCurrent) {
          e.currentTarget.style.borderColor = "transparent";
          e.currentTarget.style.transform = "none";
        }
      }}
    >
      {/* Indicateur heure actuelle */}
      {isCurrent && (
        <div
          style={{
            content: '""',
            position: "absolute",
            top: "-8px",
            right: "-8px",
            fontSize: "0.9em",
            background: "#fbbf24",
            borderRadius: "50%",
            width: "20px",
            height: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
          }}
        >
          🕐
        </div>
      )}

      {/* Heure */}
      <div
        className="hour-time"
        style={{
          fontSize: "0.8em",
          opacity: "0.8",
          marginBottom: "8px",
          fontWeight: "500",
          color: "white",
        }}
      >
        {time}
      </div>

      {/* Icône météo */}
      <div
        className="hour-icon"
        style={{
          fontSize: "1.8em",
          margin: "8px 0",
        }}
      >
        {emoji}
      </div>

      {/* Température */}
      <div
        className={`hour-temp ${isCurrent ? "current-temp" : ""}`}
        style={{
          fontSize: "1em",
          fontWeight: isCurrent ? "800" : "700",
          marginBottom: "4px",
          color: tempColor,
          backgroundColor: isExpanded ? `${tempColor}20` : "transparent",
          borderRadius: isExpanded ? "8px" : "0",
          padding: isExpanded ? "4px 8px" : "0",
          textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)",
        }}
      >
        {temperature}°
      </div>

      {isExpanded ? (
        // Mode étendu - afficher toutes les informations détaillées
        <>
          {/* Température ressentie */}
          {feelsLike !== undefined && (
            <div className="text-xs opacity-80 text-orange-300">
              Ressenti: {feelsLike}°
            </div>
          )}

          {/* Direction du vent */}
          <div className="text-xs opacity-80 text-green-300">
            Direction: {windDirection}
          </div>

          {/* Vitesse du vent */}
          <div className="text-xs opacity-80 text-green-300">
            Vent: {windSpeed} km/h
          </div>

          {/* Probabilité précipitations */}
          <div className="text-xs opacity-80 text-blue-300">
            Probabilité: {precipitationProbability}%
          </div>

          {/* Précipitations avec widget Mix/GraphCast */}
          <PrecipitationWidget
            mixMm={precipitation}
            graphcastMm={graphcastPrecipitation}
            isExpanded={true}
          />

          {/* Humidité */}
          <div className="text-xs opacity-80 text-white">
            Humidité: {humidity}%
          </div>

          {/* UV Index */}
          <div className="text-xs opacity-80 text-yellow-300">
            UV: {uvIndex > 0 ? uvIndex : "N/A"}
          </div>

          {/* Indice qualité de l'air */}
          {aqi !== undefined && (
            <div className="text-xs opacity-80 text-purple-300">AQI: {aqi}</div>
          )}
        </>
      ) : (
        // Mode compact - afficher uniquement les précipitations
        <PrecipitationWidget
          mixMm={precipitation}
          graphcastMm={graphcastPrecipitation}
          isExpanded={false}
        />
      )}
    </div>
  );
};

export default HourlyCard;
