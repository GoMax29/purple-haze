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
        {mixMm.toFixed(1)} mm
      </div>
    );
  }

  // Mode étendu - jauges verticales côte à côte plus grandes
  return (
    <div
      style={{
        width: "100%",
        padding: "8px 4px",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "flex-end",
        gap: "12px",
        height: "150px", // Hauteur pour contenir les jauges de 200px + icônes
      }}
    >
      {/* Jauge Mix Verticale */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "40%",
        }}
      >
        {/* Icône Mix */}
        <div style={{ fontSize: "22px", marginBottom: "2px" }}>🧪</div>

        {/* Jauge verticale Mix */}
        <div
          style={{
            width: "35px", // Largeur demandée
            height: "100px", // Hauteur demandée
            backgroundColor: "#374151",
            borderRadius: "8px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {mixMm != null && mixMm > 0 ? (
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                height: `${Math.min(Math.max(mixMm * 30, 3), 100)}%`,
                backgroundColor: "#3b82f6",
                borderRadius: "8px",
                transition: "height 0.5s ease",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "6px",
                color: "#9ca3af",
              }}
            >
              {/* N/A */}
            </div>
          )}
        </div>

        {/* Valeur Mix */}
        <div
          style={{
            fontSize: "10px",
            color: "#93c5fd",
            marginTop: "2px",
            fontWeight: "bold",
          }}
        >
          {mixMm != null ? `${mixMm.toFixed(1)}mm` : ""}
        </div>
      </div>

      {/* Jauge GraphCast Verticale */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "40%",
        }}
      >
        {/* Logo Google */}
        <div style={{ marginBottom: "4px" }}>
          <svg viewBox="0 0 24 24" style={{ width: "22px", height: "22px" }}>
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

        {/* Jauge verticale GraphCast */}
        <div
          style={{
            width: "35px", // Largeur demandée
            height: "100px", // Hauteur demandée
            backgroundColor: "#374151",
            borderRadius: "8px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {graphcastMm != null && graphcastMm > 0 ? (
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                right: "0",
                height: `${Math.min(Math.max(graphcastMm * 30, 3), 100)}%`,
                backgroundColor: "#9333ea",
                borderRadius: "8px",
                transition: "height 0.5s ease",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "6px",
                color: "#9ca3af",
              }}
            >
              {/* N/A */}
            </div>
          )}
        </div>

        {/* Valeur GraphCast */}
        <div
          style={{
            fontSize: "10px",
            color: "#c4b5fd",
            marginTop: "2px",
            fontWeight: "bold",
          }}
        >
          {graphcastMm != null ? `${graphcastMm.toFixed(1)}mm` : "N/A"}
        </div>
      </div>
    </div>
  );
};

export default PrecipitationWidget;
