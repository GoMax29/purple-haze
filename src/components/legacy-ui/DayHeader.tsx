"use client";

import React from "react";

interface DayHeaderProps {
  title?: string;
  selectedInterval?: "3h" | "1h";
  onIntervalChange?: (interval: "3h" | "1h") => void;
  showLegend?: boolean;
  onToggleLegend?: () => void;
}

const DayHeader: React.FC<DayHeaderProps> = ({
  title = "Aujourd'hui",
  selectedInterval = "3h",
  onIntervalChange,
  showLegend = false,
  onToggleLegend,
}) => {
  const handleIntervalClick = (interval: "3h" | "1h") => {
    if (onIntervalChange) {
      onIntervalChange(interval);
    }
  };

  const handleToggleLegend = () => {
    if (onToggleLegend) {
      onToggleLegend();
    }
  };

  return (
    <div
      className="day-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "20px",
      }}
    >
      {/* Titre de la section */}
      <div
        className="day-title"
        style={{
          fontSize: "1.3em",
          fontWeight: "600",
          color: "#e5e7eb",
        }}
      >
        {title}
      </div>

      {/* Contrôles à droite */}
      <div
        className="day-controls"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Switch 3h/1h */}
        <div
          className="day-switch"
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "25px",
            padding: "4px",
          }}
        >
          <button
            className={`switch-btn ${
              selectedInterval === "3h" ? "active" : ""
            }`}
            onClick={() => handleIntervalClick("3h")}
            style={{
              padding: "8px 16px",
              border: "none",
              background:
                selectedInterval === "3h"
                  ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                  : "transparent",
              color:
                selectedInterval === "3h"
                  ? "white"
                  : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              borderRadius: "20px",
              fontSize: "0.85em",
              transition: "all 0.3s ease",
              fontWeight: selectedInterval === "3h" ? "600" : "normal",
            }}
          >
            3h
          </button>
          <button
            className={`switch-btn ${
              selectedInterval === "1h" ? "active" : ""
            }`}
            onClick={() => handleIntervalClick("1h")}
            style={{
              padding: "8px 16px",
              border: "none",
              background:
                selectedInterval === "1h"
                  ? "linear-gradient(135deg, #7c3aed, #9333ea)"
                  : "transparent",
              color:
                selectedInterval === "1h"
                  ? "white"
                  : "rgba(255, 255, 255, 0.7)",
              cursor: "pointer",
              borderRadius: "20px",
              fontSize: "0.85em",
              transition: "all 0.3s ease",
              fontWeight: selectedInterval === "1h" ? "600" : "normal",
            }}
          >
            1h
          </button>
        </div>

        {/* Bouton infos */}
        <button
          className={`info-toggle-btn ${showLegend ? "active" : ""}`}
          onClick={handleToggleLegend}
          style={{
            background: showLegend
              ? "rgba(147, 51, 234, 0.3)"
              : "rgba(255, 255, 255, 0.1)",
            border: showLegend
              ? "1px solid rgba(147, 51, 234, 0.5)"
              : "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          onMouseEnter={(e) => {
            if (!showLegend) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (!showLegend) {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            }
          }}
        >
          <span>infos</span>
        </button>
      </div>
    </div>
  );
};

export default DayHeader;
