"use client";

import React from "react";
import { getUVColor } from "@/utils/uvScale";
// import { getWMOIcon } from "@/utils/wmoIcons";
import { computeSlotVariant } from "@/utils/dayNight";
import { getWmoFinalIconPath } from "@/utils/wmoFinalIcons";
import { analyzeSlotRisk, getRiskBadgeColor } from "@/utils/riskDetection";
import {
  formatDailyCardDate,
  isDateToday,
  isDateTomorrow,
} from "@/utils/dateFormat";
import { TimeSlotData } from "@/types/dailyData";

interface DailyCardProps {
  dayName: string;
  date?: string;
  tempMax: number;
  tempMin: number;
  uvIndex?: number;
  precipitation_total?: number;
  timeSlots?: TimeSlotData[];
  isToday?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  detailMode?: boolean; // 🖐 = détail (faible opacité sur les masques)
  sunrise?: string;
  sunset?: string;
}

const DailyCard: React.FC<DailyCardProps> = ({
  dayName,
  date,
  tempMax,
  tempMin,
  uvIndex,
  precipitation_total = 0,
  timeSlots = [],
  isToday = false,
  isSelected = false,
  onClick,
  detailMode = false,
  sunrise,
  sunset,
}) => {
  // Déterminer les états des dates
  const isTodayDate = isToday || isDateToday(date);
  const isTomorrowDate = isDateTomorrow(date);

  // Formater la date selon les spécifications
  const formattedDate = formatDailyCardDate(
    dayName,
    date,
    isTodayDate,
    isTomorrowDate
  );

  // Préparer les données finales
  const finalTempMax = Math.round(tempMax);
  const finalTempMin = Math.round(tempMin);

  // Si pas de données timeSlots, afficher des tirets
  const hasData = timeSlots && timeSlots.length > 0;
  // Couleurs exactes pour les bandeaux de masquage
  const overlayBaseColor = isSelected ? "#8139ed" : "#3b2471";
  const overlayOpacity = detailMode ? 0.1 : 0.95; // conservé si besoin ailleurs
  // Créer un composant RiskBadge pour les "!"
  const RiskBadge: React.FC<{ timeSlot: TimeSlotData }> = ({ timeSlot }) => {
    const riskAnalysis = analyzeSlotRisk(timeSlot);

    if (!riskAnalysis.shouldShowRisk) return null;

    return (
      <div
        className="risk-badge"
        style={{
          position: "absolute",
          top: "-2px",
          right: "-2px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          backgroundColor: getRiskBadgeColor(riskAnalysis.primaryRisk || ""),
          color: "white",
          fontSize: "9px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "help",
          zIndex: 1,
          animation: "pulse 2s infinite",
        }}
        title={riskAnalysis.riskTooltip}
      >
        !
      </div>
    );
  };

  return (
    <>
      <div
        className={`daily-card ${isSelected ? "selected" : ""}`}
        onClick={onClick}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          background: isSelected
            ? "linear-gradient(135deg, #7c3aed, #9333ea)"
            : "rgba(255, 255, 255, 0.05)",
          borderRadius: "16px",
          border: isSelected ? "2px solid #fbbf24" : "2px solid transparent",
          cursor: onClick ? "pointer" : "default",
          transition: "all 0.3s ease",
          backdropFilter: "blur(10px)",
          transform: isSelected ? "scale(1.02)" : "none",
          gap: "12px", // Espacement entre sections
          width: "100%",
        }}
        onMouseEnter={(e) => {
          if (onClick && !isSelected) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "translateX(5px)";
          }
        }}
        onMouseLeave={(e) => {
          if (onClick && !isSelected) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            e.currentTarget.style.borderColor = "transparent";
            e.currentTarget.style.transform = "none";
          }
        }}
      >
        {/* 1. DATE - Alignée à gauche selon format spécifique */}
        <div
          className="daily-date-section"
          style={{
            flex: "0 0 80px", // Largeur fixe pour la date
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            minWidth: 0,
          }}
        >
          <div
            className="formatted-date"
            style={{
              fontWeight: isTodayDate ? "700" : "600",
              fontSize: "1em",
              color: isTodayDate ? "#fbbf24" : "white",
              textAlign: "left",
            }}
          >
            {formattedDate}
          </div>
        </div>

        {/* 2. ICÔNES MÉTÉO CENTRÉES - Avec gestion des risques */}
        <div
          className="weather-icons-section"
          style={{
            position: "relative",
            flex: "1",
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            justifyItems: "center",
            alignItems: "center",
            gap: "6px",
            fontSize: "1.4em",
            minWidth: 0,
            width: "100%",
            padding: "4px 0",
          }}
        >
          {/* Plus de masques: simple/detail contrôle le rendu direct des tranches */}
          {hasData
            ? timeSlots.slice(0, 4).map((slot, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {/* Panneau de mise en avant pour 12–18h en arrière-plan */}
                  {index === 2 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        bottom: "-8px",
                        left: "-8px",
                        right: "-8px",
                        background: "rgba(129, 57, 237, 0.28)",
                        borderRadius: "12px",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    className={`slot-icon ${index === 2 ? "main-slot" : ""}`} // 3ème icône = principale (12-18h)
                    style={{
                      fontSize: "1.4em",
                      opacity: "0.95",
                      position: "relative",
                      padding: 0,
                      borderRadius: 0,
                      backgroundColor: "transparent",
                    }}
                    title={`${["00-06", "06-12", "12-18", "18-00"][index]} • ${
                      slot.code_wmo_final !== null &&
                      slot.code_wmo_final !== undefined
                        ? `WMO ${slot.code_wmo_final}`
                        : "N/A"
                    }`}
                  >
                    {(() => {
                      if (!(detailMode || index === 2)) return null; // Ne rien afficher au lieu de "-"
                      if (
                        slot.code_wmo_final === null ||
                        slot.code_wmo_final === undefined
                      )
                        return "-";
                      // Choisir variante en fonction sunrise/sunset et tranche
                      const tranche = ["00-06", "06-12", "12-18", "18-00"][
                        index
                      ];
                      const variant = computeSlotVariant(
                        tranche,
                        sunrise,
                        sunset
                      );
                      const src = getWmoFinalIconPath(
                        slot.code_wmo_final,
                        variant
                      );
                      return (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={src}
                          alt={`WMO ${slot.code_wmo_final}`}
                          className="w-14 h-14 object-contain" //w-[40px]
                          width={40}
                          height={40}
                        />
                      );
                    })()}
                    {/* Affichage du badge risque uniquement en mode détail ou slot principal */}
                    {(detailMode || index === 2) && (
                      <RiskBadge timeSlot={slot} />
                    )}
                  </div>
                </div>
              ))
            : // Afficher des tirets si pas de données
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  style={{
                    fontSize: "1.2em",
                    opacity: "0.5",
                    color: "#9CA3AF",
                  }}
                >
                  -
                </div>
              ))}
        </div>

        {/* 3. ÉLÉMENTS DROITE - Températures, UV, mm alignés à droite */}
        <div
          className="right-elements-section"
          style={{
            position: "relative",
            flex: "0 0 140px", // zone droite un peu plus large pour grille
            display: "grid",
            gridTemplateColumns: "36px 1fr", // Emplacement 1: UV • Emplacement 2: groupe
            alignItems: "center",
            justifyItems: "end",
            columnGap: "8px",
          }}
        >
          {/* Emplacement 1 : UV */}
          <div style={{ justifySelf: "center" }}>
            {detailMode && uvIndex !== undefined && uvIndex > 0 ? (
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: getUVColor(uvIndex),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.7em",
                }}
                title={`UV Index: ${Math.round(uvIndex)}`}
              >
                {Math.round(uvIndex)}
              </div>
            ) : detailMode ? (
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  backgroundColor: "#9E9E9E",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "0.65em",
                }}
                title="UV non disponible"
              >
                N/A
              </div>
            ) : (
              <div style={{ width: 0, height: 0 }} />
            )}
          </div>

          {/* Emplacement 2 : Groupe [Tmax/Tmin + mm] */}
          <div
            className="right-stack"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
            }}
          >
            <div
              className="temperatures"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <div
                className="temp-max"
                style={{ fontWeight: 500, fontSize: "1.05em", color: "white" }}
              >
                {finalTempMax}°
              </div>
              <div
                className="temp-min"
                style={{
                  fontSize: "0.95em",
                  color: "#64b5f6",
                  fontWeight: "500",
                }}
              >
                {finalTempMin}°
              </div>
            </div>
            <div
              className="precipitation"
              style={{
                color: "#64b5f6",
                fontSize: "0.82em",
                fontWeight: "600",
                textAlign: "center",
                width: "100%",
              }}
            >
              {precipitation_total > 0
                ? `${precipitation_total.toFixed(1)} mm`
                : "0 mm"}
            </div>
          </div>
        </div>
      </div>

      {/* Styles CSS pour animations et responsive */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }

        @media (max-width: 768px) {
          .daily-card {
            padding: 10px 12px !important;
            gap: 8px !important;
          }

          .daily-date-section {
            flex: 0 0 60px !important;
          }

          .formatted-date {
            font-size: 0.9em !important;
            font-weight: 600 !important; /* Ne pas mettre en gras sur mobile */
          }

          .weather-icons-section {
            font-size: 1.2em !important; //
            gap: 4px !important;
          }

          .right-elements-section {
            flex: 0 0 100px !important;
            gap: 3px !important;
          }

          .temperatures {
            gap: 4px !important;
          }

          .temp-max {
            font-size: 1em !important;
          }

          .temp-min {
            font-size: 0.85em !important;
          }

          .uv-precip-combined {
            gap: 6px !important;
          }

          .uv-precip-combined > div:first-child {
            width: 26px !important;
            height: 26px !important;
            font-size: 0.7em !important;
          }

          .precipitation {
            font-size: 0.75em !important;
          }
        }
      `}</style>
    </>
  );
};

export default DailyCard;
