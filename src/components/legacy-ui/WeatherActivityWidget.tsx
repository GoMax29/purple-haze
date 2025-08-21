"use client";

import React, { useState } from "react";

interface WeatherSegment {
  condition:
    | "clear"
    | "partly-cloudy"
    | "cloudy"
    | "light-rain"
    | "rain"
    | "heavy-rain"
    | "storm";
  precipitation: number;
  probability: number;
}

interface WeatherActivityWidgetProps {
  selectedDuration?: number;
  onDurationChange?: (duration: number) => void;
  durations?: number[];
  recommendationEmoji?: string;
  onInfoClick?: () => void;
  weatherSegments?: WeatherSegment[];
  activityStartHour?: number; // 0-23 pour positionner le sélecteur
}

const WeatherActivityWidget: React.FC<WeatherActivityWidgetProps> = ({
  selectedDuration = 2,
  onDurationChange,
  durations = [2, 3, 4, 6],
  recommendationEmoji = "🌞",
  onInfoClick,
  weatherSegments = [],
  activityStartHour = 14, // Par défaut à 14h
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleDurationClick = (duration: number) => {
    if (onDurationChange) {
      onDurationChange(duration);
    }
  };

  const handleInfoClick = () => {
    setShowTooltip(!showTooltip);
    if (onInfoClick) {
      onInfoClick();
    }
  };

  const getWeatherSegmentStyle = (condition: string) => {
    const baseStyle = {
      flex: 1,
      position: "relative" as const,
      transition: "all 0.3s ease",
      borderRight: "1px solid rgba(255, 255, 255, 0.1)",
    };

    const backgrounds = {
      clear: "linear-gradient(45deg, #aee6ff, #87ceeb)",
      "partly-cloudy": "linear-gradient(45deg, #e0e0e0, #d0d0d0)",
      cloudy: "linear-gradient(45deg, #c0c0c0, #a0a0a0)",
      "light-rain": "linear-gradient(45deg, #999, #888)",
      rain: "linear-gradient(45deg, #666, #555)",
      "heavy-rain": "linear-gradient(45deg, #444, #333)",
      storm: "linear-gradient(45deg, #400, #300)",
    };

    return {
      ...baseStyle,
      background:
        backgrounds[condition as keyof typeof backgrounds] || backgrounds.clear,
    };
  };

  // Calculer la position du sélecteur d'activité (en pourcentage)
  const selectorPosition = (activityStartHour / 24) * 100;
  const selectorWidth = (selectedDuration / 24) * 100;

  // Générer 24 segments par défaut si pas fournis
  const defaultSegments: WeatherSegment[] = Array.from(
    { length: 24 },
    (_, i) => ({
      condition: i >= 6 && i <= 18 ? "clear" : "partly-cloudy",
      precipitation: Math.random() * 2,
      probability: Math.random() * 50,
    })
  );

  const segments =
    weatherSegments.length > 0 ? weatherSegments : defaultSegments;

  return (
    <div
      className="weather-activity-widget"
      style={{
        marginTop: "20px",
        padding: "16px",
        background: "rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      {/* En-tête avec durée et recommandation */}
      <div
        className="widget-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Sélecteur de durée */}
        <div className="activity-duration-selector">
          <label
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "0.9em",
              fontWeight: "600",
              marginRight: "8px",
            }}
          >
            Durée de mon activité :
          </label>
          <div
            className="duration-buttons"
            style={{
              display: "flex",
              gap: "6px",
            }}
          >
            {durations.map((duration) => (
              <button
                key={duration}
                className={`duration-btn ${
                  selectedDuration === duration ? "active" : ""
                }`}
                onClick={() => handleDurationClick(duration)}
                style={{
                  padding: "6px 12px",
                  border:
                    selectedDuration === duration
                      ? "1px solid #fbbf24"
                      : "1px solid rgba(255, 255, 255, 0.2)",
                  background:
                    selectedDuration === duration
                      ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                      : "rgba(255, 255, 255, 0.1)",
                  color:
                    selectedDuration === duration
                      ? "white"
                      : "rgba(255, 255, 255, 0.7)",
                  borderRadius: "20px",
                  fontSize: "0.85em",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  fontWeight: selectedDuration === duration ? "600" : "normal",
                }}
                onMouseEnter={(e) => {
                  if (selectedDuration !== duration) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.15)";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedDuration !== duration) {
                    e.currentTarget.style.background =
                      "rgba(255, 255, 255, 0.1)";
                    e.currentTarget.style.color = "rgba(255, 255, 255, 0.7)";
                  }
                }}
              >
                {duration}h
              </button>
            ))}
          </div>
        </div>

        {/* Recommandation météo */}
        <div
          className="weather-recommendation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255, 255, 255, 0.9)",
            fontSize: "0.9em",
            fontWeight: "600",
          }}
        >
          <span>Ma recommandation : </span>
          <span
            className="recommendation-emoji"
            style={{
              fontSize: "1.5em",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          >
            {recommendationEmoji}
          </span>
          <button
            className="info-tooltip-btn"
            onClick={handleInfoClick}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2em",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "50%",
              transition: "all 0.3s ease",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.transform = "scale(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            💡
          </button>
        </div>
      </div>

      {/* Timeline météo 24h */}
      <div
        className="weather-timeline-container"
        style={{
          position: "relative",
          margin: "16px 0",
        }}
      >
        <div
          className="weather-timeline"
          style={{
            display: "flex",
            height: "40px",
            borderRadius: "8px",
            overflow: "hidden",
            position: "relative",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          }}
        >
          {segments.map((segment, index) => (
            <div
              key={index}
              className={`weather-segment ${segment.condition}`}
              style={{
                ...getWeatherSegmentStyle(segment.condition),
                ...(index === segments.length - 1 && { borderRight: "none" }),
              }}
              title={`${index}h: ${segment.precipitation}mm (${segment.probability}%)`}
            />
          ))}
        </div>

        {/* Sélecteur d'activité glissant */}
        <div
          className="activity-selector"
          style={{
            position: "absolute",
            top: "0",
            left: `${selectorPosition}%`,
            width: `${selectorWidth}%`,
            height: "40px",
            background: "rgba(251, 191, 36, 0.3)",
            border: "2px solid #fbbf24",
            borderRadius: "8px",
            transition: "all 0.3s ease",
            pointerEvents: "none",
            backdropFilter: "blur(5px)",
            boxShadow: "0 0 15px rgba(251, 191, 36, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: "1.2em",
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))",
            }}
          >
            🎯
          </span>
        </div>

        {/* Marqueurs temporels */}
        <div
          className="timeline-hours"
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "8px",
            fontSize: "0.75em",
            color: "rgba(255, 255, 255, 0.6)",
            fontWeight: "500",
          }}
        >
          <span>00h</span>
          <span>06h</span>
          <span>12h</span>
          <span>18h</span>
          <span>23h</span>
        </div>
      </div>

      {/* Tooltip légende (optionnel) */}
      {showTooltip && (
        <div
          className="weather-legend-tooltip"
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            right: "0",
            background: "rgba(0, 0, 0, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            padding: "16px",
            zIndex: 1000,
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            marginTop: "8px",
            maxHeight: "400px",
            overflowY: "auto",
          }}
        >
          <div className="legend-header">
            <h4
              style={{
                margin: "0 0 12px 0",
                color: "white",
                fontSize: "1em",
                textAlign: "center",
                borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
                paddingBottom: "8px",
              }}
            >
              🌞💦🌂☂☔⚡ Légende météo pluie & recommandations d'activité
            </h4>
          </div>
          <div
            className="legend-content"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div
              className="legend-item"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                padding: "8px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
              }}
            >
              <span
                className="legend-emoji"
                style={{
                  fontSize: "1.5em",
                  minWidth: "30px",
                  textAlign: "center",
                }}
              >
                🌞
              </span>
              <div
                className="legend-text"
                style={{ flex: 1, color: "white", fontSize: "0.85em" }}
              >
                <strong>Pas une goutte (0% ou pluie &lt; 0.1 mm)</strong>
                <p>Tenue libre, pas de protection pluie</p>
                <p>🍃 Sortie idéale, balade, vélo, pique-nique ok</p>
              </div>
            </div>
            {/* Autres éléments de légende peuvent être ajoutés ici */}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherActivityWidget;
