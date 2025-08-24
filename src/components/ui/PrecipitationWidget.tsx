"use client";

import React from "react";

interface PrecipitationWidgetProps {
  mixMm: number;
  graphcastMm: number;
  isExpanded?: boolean;
}

const PrecipitationWidget: React.FC<PrecipitationWidgetProps> = ({
  mixMm,
  graphcastMm,
  isExpanded = false,
}) => {
  // Debug: vérifier les valeurs
  console.log("PrecipitationWidget:", { mixMm, graphcastMm, isExpanded });

  // Test avec des valeurs forcées pour s'assurer que les jauges s'affichent
  const testMixMm = mixMm || 0.5; // Force au moins 0.5mm pour test
  const testGraphcastMm = graphcastMm || 0.3; // Force au moins 0.3mm pour test
  if (!isExpanded) {
    // Mode compact - afficher seulement la valeur Mix
    return (
      <div
        style={{
          fontSize: "12px",
          opacity: 0.8,
          color: "#93c5fd",
          textAlign: "center",
        }}
      >
        {testMixMm.toFixed(1)}mm
      </div>
    );
  }

  // Mode étendu - design moderne et simple
  return (
    <div
      style={{
        width: "100%",
        padding: "8px 4px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        margin: "4px 0",
      }}
    >
      {/* Mix Modèle */}
      <div style={{ marginBottom: "8px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "3px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "10px",
              color: "#93c5fd",
            }}
          >
            <span style={{ marginRight: "4px" }}>🏠</span>
            <span>Mix Modèle</span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "#93c5fd",
              fontWeight: "bold",
            }}
          >
            {testMixMm.toFixed(1)}mm
          </span>
        </div>

        {/* Jauge Mix */}
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#374151",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(testMixMm * 20, 2)}%`, // 20% par mm, minimum 2%
              height: "100%",
              backgroundColor: "#3b82f6",
              borderRadius: "3px",
              transition: "width 0.5s ease",
              opacity: testMixMm > 0 ? 1 : 0.3,
            }}
          />
        </div>
      </div>

      {/* GraphCast IA */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "3px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: "10px",
              color: "#c4b5fd",
            }}
          >
            <span style={{ marginRight: "3px" }}>🤖</span>
            <div
              style={{
                width: "12px",
                height: "12px",
                marginRight: "3px",
                display: "inline-block",
              }}
            >
              <svg
                viewBox="0 0 24 24"
                style={{ width: "12px", height: "12px" }}
              >
                <path
                  fill="#4285f4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34a853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#fbbc05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#ea4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            <span>Google GraphCast</span>
          </div>
          <span
            style={{
              fontSize: "10px",
              color: "#c4b5fd",
              fontWeight: "bold",
            }}
          >
            {testGraphcastMm.toFixed(1)}mm
          </span>
        </div>

        {/* Jauge GraphCast */}
        <div
          style={{
            width: "100%",
            height: "6px",
            backgroundColor: "#374151",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.max(testGraphcastMm * 20, 2)}%`, // 20% par mm, minimum 2%
              height: "100%",
              backgroundColor: "#9333ea",
              borderRadius: "3px",
              transition: "width 0.5s ease",
              opacity: testGraphcastMm > 0 ? 1 : 0.3,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PrecipitationWidget;
