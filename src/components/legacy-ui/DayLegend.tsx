"use client";

import React from "react";

interface LegendItem {
  example: string | number;
  description: string;
  exampleStyle?: React.CSSProperties;
  isIcon?: boolean;
}

interface DayLegendProps {
  isVisible?: boolean;
  legendItems?: LegendItem[];
}

const DayLegend: React.FC<DayLegendProps> = ({
  isVisible = false,
  legendItems = [],
}) => {
  // Éléments de légende par défaut basés sur l'original
  const defaultLegendItems: LegendItem[] = [
    {
      example: "26°",
      description: "Température actuelle (orange = chaude)",
      exampleStyle: {
        background: "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb)",
        color: "#fff",
        fontWeight: "600",
      },
    },
    {
      example: "🌤️",
      description: "Conditions météo actuelles",
      isIcon: true,
      exampleStyle: {
        fontSize: "1.2em",
        color: "#fbbf24",
      },
    },
    {
      example: "12 km/h",
      description: "Vitesse du vent (vert = normal, rouge = rafales)",
      exampleStyle: {
        color: "#4caf50",
      },
    },
    {
      example: "42",
      description: "Qualité de l'air (AQI) - cercle coloré",
      exampleStyle: {
        backgroundColor: "#50ccaa",
        color: "#fff",
        borderRadius: "50%",
        width: "24px",
        height: "24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.7em",
        fontWeight: "600",
      },
    },
    {
      example: "8.3mm",
      description: "Précipitations prévues",
      exampleStyle: {
        color: "#64b5f6",
      },
    },
    {
      example: "72%",
      description: "Probabilité de précipitations",
      exampleStyle: {
        color: "#90caf9",
      },
    },
    {
      example: "UV 5",
      description: "Index UV - cercle coloré selon intensité",
      exampleStyle: {
        color: "#ff9800",
      },
    },
    {
      example: "85%",
      description: "Humidité relative",
      exampleStyle: {
        color: "#87ceeb",
      },
    },
  ];

  const items = legendItems.length > 0 ? legendItems : defaultLegendItems;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="day-legend-info"
      style={{
        marginTop: "15px",
        marginBottom: "15px",
        animation: "slideDown 0.3s ease",
      }}
    >
      <div
        className="legend-info-card"
        style={{
          padding: "15px",
          background: "rgba(26, 31, 58, 0.9)",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* En-tête */}
        <div
          style={{
            marginBottom: "12px",
            color: "white",
            fontSize: "0.9em",
            fontWeight: "600",
            textAlign: "center",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "8px",
          }}
        >
          📊 Légende des éléments météo
        </div>

        {/* Liste des éléments */}
        {items.map((item, index) => (
          <div
            key={index}
            className="legend-row"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 0",
              fontSize: "0.8em",
              borderBottom:
                index === items.length - 1
                  ? "none"
                  : "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Exemple */}
            <div
              className="legend-example"
              style={{
                fontWeight: "500",
                minWidth: "50px",
                textAlign: "center",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.1)",
                ...item.exampleStyle,
              }}
            >
              {item.example}
            </div>

            {/* Description */}
            <div
              className="legend-desc"
              style={{
                flex: 1,
                marginLeft: "15px",
                color: "#e5e7eb",
                opacity: "0.9",
              }}
            >
              {item.description}
            </div>
          </div>
        ))}

        {/* Note bas de page */}
        <div
          style={{
            marginTop: "12px",
            padding: "8px",
            background: "rgba(255, 255, 255, 0.05)",
            borderRadius: "6px",
            fontSize: "0.75em",
            color: "rgba(255, 255, 255, 0.7)",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          💡 Les couleurs changent automatiquement selon les valeurs (seuils
          configurables)
        </div>
      </div>

      {/* Animation CSS */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DayLegend;
