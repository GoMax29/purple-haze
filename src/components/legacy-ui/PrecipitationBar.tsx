"use client";

import React, { useState } from "react";

interface PrecipitationSegment {
  intensity: number; // 0-100 (0 = sec, 100 = très forte pluie)
  duration: number; // Pourcentage de la durée totale
  time?: string; // Heure de début du segment
  amount?: number; // mm de pluie
}

interface PrecipitationBarProps {
  segments?: PrecipitationSegment[];
  showLegend?: boolean;
  onSegmentClick?: (segment: PrecipitationSegment, index: number) => void;
  height?: number;
}

const PrecipitationBar: React.FC<PrecipitationBarProps> = ({
  segments = [],
  showLegend = true,
  onSegmentClick,
  height = 12,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Couleur basée sur l'intensité des précipitations
  const getIntensityColor = (intensity: number): string => {
    if (intensity === 0) return "rgba(255, 255, 255, 0.1)"; // Sec
    if (intensity <= 20) return "#87ceeb"; // Très faible - bleu clair
    if (intensity <= 40) return "#64b5f6"; // Faible - bleu
    if (intensity <= 60) return "#42a5f5"; // Modéré - bleu foncé
    if (intensity <= 80) return "#1e88e5"; // Fort - bleu intense
    return "#1565c0"; // Très fort - bleu très foncé
  };

  // Description textuelle de l'intensité
  const getIntensityDescription = (intensity: number): string => {
    if (intensity === 0) return "Sec";
    if (intensity <= 20) return "Très faible";
    if (intensity <= 40) return "Faible";
    if (intensity <= 60) return "Modéré";
    if (intensity <= 80) return "Fort";
    return "Très fort";
  };

  // Segments par défaut pour démonstration
  const defaultSegments: PrecipitationSegment[] = [
    { intensity: 0, duration: 25, time: "14h", amount: 0 },
    { intensity: 30, duration: 15, time: "14h30", amount: 1.2 },
    { intensity: 60, duration: 20, time: "15h", amount: 3.5 },
    { intensity: 10, duration: 25, time: "16h", amount: 0.3 },
    { intensity: 0, duration: 15, time: "17h", amount: 0 },
  ];

  const data = segments.length > 0 ? segments : defaultSegments;

  const handleSegmentClick = (segment: PrecipitationSegment, index: number) => {
    if (onSegmentClick) {
      onSegmentClick(segment, index);
    }
  };

  return (
    <div
      style={{
        marginTop: "15px",
      }}
    >
      {/* Barre de précipitations */}
      <div
        className="precipitation-bar"
        style={{
          height: `${height}px`,
          background: "rgba(255, 255, 255, 0.1)",
          borderRadius: "6px",
          overflow: "hidden",
          position: "relative",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          display: "flex",
        }}
      >
        {data.map((segment, index) => (
          <div
            key={index}
            className="precip-segment"
            onClick={() => handleSegmentClick(segment, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              height: "100%",
              width: `${segment.duration}%`,
              background: getIntensityColor(segment.intensity),
              display: "inline-block",
              transition: "all 0.3s ease",
              cursor: onSegmentClick ? "pointer" : "default",
              opacity: hoveredIndex === index ? 0.8 : 1,
              position: "relative",
            }}
            title={`${segment.time || ""}: ${
              segment.amount || 0
            }mm - ${getIntensityDescription(segment.intensity)}`}
          />
        ))}
      </div>

      {/* Marqueurs de temps (optionnel) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "5px",
          fontSize: "0.7em",
          color: "rgba(255, 255, 255, 0.6)",
        }}
      >
        {data
          .filter((segment) => segment.time)
          .map((segment, index) => (
            <span key={index}>{segment.time}</span>
          ))}
      </div>

      {/* Légende des couleurs */}
      {showLegend && (
        <div
          className="precipitation-legend"
          style={{
            marginTop: "10px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.7em",
            opacity: "0.8",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          {[
            { intensity: 0, label: "Sec" },
            { intensity: 20, label: "Très faible" },
            { intensity: 40, label: "Faible" },
            { intensity: 60, label: "Modéré" },
            { intensity: 80, label: "Fort" },
            { intensity: 100, label: "Très fort" },
          ].map((item, index) => (
            <div
              key={index}
              className="legend-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                className="legend-color"
                style={{
                  width: "12px",
                  height: "8px",
                  borderRadius: "2px",
                  background: getIntensityColor(item.intensity),
                }}
              />
              <span style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Informations sur le segment survolé */}
      {hoveredIndex !== null && (
        <div
          style={{
            marginTop: "8px",
            padding: "6px 8px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
            fontSize: "0.75em",
            color: "white",
            textAlign: "center",
          }}
        >
          <strong>
            {data[hoveredIndex].time || `Segment ${hoveredIndex + 1}`}
          </strong>
          : {data[hoveredIndex].amount || 0}mm -{" "}
          {getIntensityDescription(data[hoveredIndex].intensity)}
          {data[hoveredIndex].intensity > 0 && " 🌧️"}
        </div>
      )}
    </div>
  );
};

export default PrecipitationBar;
