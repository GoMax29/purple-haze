"use client";

import React from "react";

interface NowSectionProps {
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
  // Coordonnées + élévation (affichage sous le titre)
  latitude?: number;
  longitude?: number;
  elevation?: number | null;
}

const NowSection: React.FC<NowSectionProps> = ({
  locationName = "Maintenant",
  currentTime = "--:--",
  temperature = 0,
  emoji = "🌤️",
  condition = "Chargement...",
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
}) => {
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

  return (
    <div
      className="now-section"
      style={{
        padding: "20px",
        borderBottom: "2px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* Ligne 1: Météo + ville à gauche, heure à droite */}
      <div
        className="now-header-line1"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            className="location-title"
            style={{
              fontSize: "1.4em",
              fontWeight: 700,
              color: "white",
            }}
          >
            {locationName}
          </div>
          {(latitude !== undefined && longitude !== undefined) ||
          elevation !== undefined ? (
            <div
              style={{ fontSize: "0.85em", color: "rgba(255,255,255,0.85)" }}
            >
              {latitude !== undefined && longitude !== undefined
                ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}${
                    elevation !== undefined && elevation !== null
                      ? ` • ${Math.round(elevation)} m`
                      : ""
                  }`
                : elevation !== undefined && elevation !== null
                ? `${Math.round(elevation)} m`
                : null}
            </div>
          ) : null}
        </div>
        <div
          className="current-time"
          style={{
            fontSize: "0.9em",
            opacity: "0.9",
            color: "rgba(255, 255, 255, 0.9)",
          }}
          suppressHydrationWarning={true}
        >
          {currentTime}
        </div>
      </div>

      {/* Ligne 2: Emoji + température + description */}
      <div
        className="now-weather-line"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          marginBottom: "20px",
          marginTop: "15px",
          justifyContent: "center",
        }}
      >
        <div className="main-emoji" style={{ fontSize: "3.2em" }}>
          {emoji}
        </div>
        <div
          className="main-temp"
          style={{
            fontSize: "3.2em",
            fontWeight: "800",
            textShadow: "2px 2px 4px rgba(0, 0, 0, 0.3)",
            color: "white",
          }}
        >
          {temperature}°
        </div>
        <div
          className="condition-desc"
          style={{
            fontSize: "1.1em",
            fontWeight: "500",
            color: "rgba(255, 255, 255, 0.95)",
          }}
        >
          {condition}
        </div>
      </div>

      {/* Grille 3x2 des informations détaillées */}
      <div
        className="now-details-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px 20px",
          fontSize: "0.9em",
        }}
      >
        <div
          className="detail-item"
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span
            className="label"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
              fontSize: "0.85em",
            }}
          >
            T° Ressentie
          </span>
          <span
            className="value feels-like-white"
            style={{
              fontWeight: "700",
              fontSize: "1em",
              color: "white",
            }}
          >
            {feelsLike}°
          </span>
        </div>

        <div
          className="detail-item"
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span
            className="label"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
              fontSize: "0.85em",
            }}
          >
            UV
          </span>
          <div
            className="uv-display"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className="uv-circle"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8em",
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                background: getUvColor(uvIndex),
              }}
            >
              {uvIndex}
            </span>
            <span
              className="uv-desc"
              style={{
                color: "white",
                fontSize: "0.9em",
                fontWeight: "600",
              }}
            >
              {uvDescription}
            </span>
          </div>
        </div>

        <div
          className="detail-item"
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span
            className="label"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
              fontSize: "0.85em",
            }}
          >
            Humidité
          </span>
          <span
            className="value humidity-blue"
            style={{
              fontWeight: "700",
              fontSize: "1em",
              color: "#87ceeb",
            }}
          >
            {humidity}%
          </span>
        </div>

        <div
          className="detail-item"
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span
            className="label"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
              fontSize: "0.85em",
            }}
          >
            Qualité de l'air
          </span>
          <div
            className="aqi-display"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              className="aqi-circle"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8em",
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 2px rgba(0, 0, 0, 0.5)",
                background: getAqiColor(aqi),
              }}
            >
              {aqi}
            </span>
            <span
              className="aqi-desc"
              style={{
                color: "white",
                fontSize: "0.9em",
                fontWeight: "600",
              }}
            >
              {aqiDescription}
            </span>
          </div>
        </div>

        <div
          className="detail-item"
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span
            className="label"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
              fontSize: "0.85em",
            }}
          >
            Précipitations
          </span>
          <span
            className="value precip-blue"
            style={{
              fontWeight: "700",
              fontSize: "1em",
              color: "#4da6ff",
            }}
          >
            {precipitation}mm
          </span>
        </div>

        <div
          className="detail-item"
          style={{ display: "flex", flexDirection: "column", gap: "5px" }}
        >
          <span
            className="label"
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontWeight: "500",
              fontSize: "0.85em",
            }}
          >
            Vent
          </span>
          <span
            className="value"
            style={{
              fontWeight: "700",
              fontSize: "1em",
              color: "white",
            }}
          >
            {windSpeed} km/h • {windDirection}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NowSection;
