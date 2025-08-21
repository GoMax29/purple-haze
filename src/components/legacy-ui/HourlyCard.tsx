"use client";

import React from "react";

interface HourlyCardProps {
  time: string;
  temperature: number;
  emoji: string;
  feelsLike?: number;
  windSpeed?: number;
  windDirection?: string;
  precipitation?: number;
  precipitationProbability?: number;
  humidity?: number;
  uvIndex?: number;
  aqi?: number;
  isSelected?: boolean;
  isCurrent?: boolean;
  onClick?: () => void;
}

const HourlyCard: React.FC<HourlyCardProps> = ({
  time,
  temperature,
  emoji,
  feelsLike,
  windSpeed = 0,
  windDirection = "--",
  precipitation = 0,
  precipitationProbability = 0,
  humidity = 0,
  uvIndex = 0,
  aqi,
  isSelected = false,
  isCurrent = false,
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

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      style={{
        minWidth: "140px",
        background:
          isSelected || isCurrent
            ? "linear-gradient(135deg, #7c3aed, #9333ea)"
            : "rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        padding: "12px 8px",
        textAlign: "center",
        border:
          isSelected || isCurrent
            ? "2px solid #fbbf24"
            : "2px solid transparent",
        transition: "all 0.3s ease",
        backdropFilter: "blur(10px)",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        cursor: onClick ? "pointer" : "default",
        boxShadow:
          isSelected || isCurrent ? "0 0 15px rgba(251, 191, 36, 0.4)" : "none",
        position: "relative",
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
          color: "white",
        }}
      >
        {temperature}°
      </div>

      {/* Température ressentie */}
      {feelsLike !== undefined && (
        <div
          className="hour-feels-like"
          style={{
            fontSize: "0.7em",
            opacity: "0.8",
            margin: "1px 0",
            color: "#ffa500",
          }}
        >
          {feelsLike}°
        </div>
      )}

      {/* Vent */}
      <div
        className="hour-wind"
        style={{
          fontSize: "0.7em",
          opacity: "0.7",
          color: "white",
        }}
      >
        <div
          className="hour-wind-dir"
          style={{
            color: "#4caf50",
            fontWeight: "500",
          }}
        >
          {windDirection}
        </div>
        <div
          className="hour-wind-speed"
          style={{
            color: "#4caf50",
            fontWeight: "500",
          }}
        >
          {windSpeed}km/h
        </div>
      </div>

      {/* Précipitations */}
      <div
        className="hour-precip"
        style={{
          fontSize: "0.7em",
          opacity: "0.8",
          margin: "1px 0",
          color: "#64b5f6",
        }}
      >
        {precipitation}mm
      </div>

      {/* Probabilité précipitations */}
      <div
        className="hour-precip-prob"
        style={{
          fontSize: "0.7em",
          opacity: "0.8",
          margin: "1px 0",
          color: "#90caf9",
        }}
      >
        {precipitationProbability}%
      </div>

      {/* Humidité */}
      <div
        className="hour-humidity"
        style={{
          fontSize: "0.7em",
          opacity: "0.8",
          margin: "1px 0",
          color: "white",
        }}
      >
        {humidity}%
      </div>

      {/* UV Index si > 0 */}
      {uvIndex > 0 && (
        <div
          className="uv-badge-small"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            color: "white",
            fontWeight: "bold",
            fontSize: "10px",
            textShadow: "0 1px 1px rgba(0, 0, 0, 0.3)",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            margin: "2px auto 0",
            background: getUvColor(uvIndex),
          }}
        >
          {uvIndex}
        </div>
      )}

      {/* AQI si disponible */}
      {aqi !== undefined && (
        <div
          className="aqi-badge-small"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            color: "white",
            fontWeight: "bold",
            fontSize: "10px",
            textShadow: "0 1px 1px rgba(0, 0, 0, 0.3)",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            margin: "2px auto 0",
            background: getAqiColor(aqi),
          }}
        >
          {aqi}
        </div>
      )}
    </div>
  );
};

export default HourlyCard;
