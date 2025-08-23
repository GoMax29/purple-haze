"use client";

import React, { useState, useEffect, useRef } from "react";
import { DailyWeatherData } from "@/types/dailyData";
import { getDayNightStateAt } from "@/utils/dayNight";
import { getWmoFinalIconPath } from "@/utils/wmoFinalIcons";
import {
  TimezoneInfo,
  formatHourSlot,
  getCurrentHourInTimezone,
  isCurrentHourInTimezone,
  getCurrentDateStringInTimezone,
} from "@/utils/timezoneHelper";

interface HourlySlot {
  time: string; // ISO string
  hour: string; // Format "14h" ou "maint."
  temperature: number;
  precipitation: number; // précipitations de l'heure suivante (preceding hour)
  wmo: number;
  variant: "day" | "night" | "transition";
}

interface HourlySectionProps {
  selectedDayIndex: number;
  dailyData: DailyWeatherData[];
  hourlyData: any[]; // Données horaires pré-calculées (168h)
  timezoneInfo?: TimezoneInfo;
}

const HourlySlotsSection: React.FC<HourlySectionProps> = ({
  selectedDayIndex,
  dailyData,
  hourlyData,
  timezoneInfo,
}) => {
  const [hourlySlots, setHourlySlots] = useState<HourlySlot[]>([]);
  const [title, setTitle] = useState("Aujourd'hui");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Régénérer les slots uniquement quand le jour sélectionné change
    if (
      hourlyData &&
      hourlyData.length > 0 &&
      dailyData &&
      dailyData.length > 0
    ) {
      console.log(
        `📅 [HourlySlotsSection] Génération slots pour jour ${selectedDayIndex} (pas de fetch API) - données: ${hourlyData.length}h, ${dailyData.length}j`
      );

      // Calculer le titre selon le jour sélectionné
      updateTitle();

      // Générer les slots horaires selon les règles (données déjà en cache)
      const slots = generateHourlySlots(hourlyData, selectedDayIndex);
      setHourlySlots(slots);
    }
  }, [
    selectedDayIndex,
    hourlyData?.length,
    dailyData?.length,
    timezoneInfo?.timezone,
  ]); // Recalcule quand la timezone arrive

  useEffect(() => {
    if (!scrollRef.current || hourlySlots.length === 0) return;

    if (selectedDayIndex === 0) {
      // Aujourd'hui: centrer sur l'heure courante (slot "maint.")
      const h = getCurrentHourInTimezone(timezoneInfo?.timezone);
      scrollToHour(h);
    } else {
      // Autres jours: afficher à 08h par défaut
      scrollToHour(8);
    }
  }, [selectedDayIndex, hourlySlots, timezoneInfo?.timezone]);

  const updateTitle = () => {
    if (selectedDayIndex === 0) {
      setTitle("Aujourd'hui");
    } else if (dailyData[selectedDayIndex]) {
      const day = dailyData[selectedDayIndex];
      // Format "Mercredi 19 Août"
      const dayName = day.dayName;
      const dayNumber = extractDayNumber(day.date);
      const monthName = getCurrentMonthName();
      setTitle(`${dayName} ${dayNumber} ${monthName}`);
    }
  };

  const extractDayNumber = (date?: string): string => {
    if (!date) return "1";
    const match = date.match(/(\d+)/);
    return match ? match[1] : "1";
  };

  const getCurrentMonthName = (): string => {
    const months = [
      "Janvier",
      "Février",
      "Mars",
      "Avril",
      "Mai",
      "Juin",
      "Juillet",
      "Août",
      "Septembre",
      "Octobre",
      "Novembre",
      "Décembre",
    ];
    return months[new Date().getMonth()];
  };

  const generateHourlySlots = (
    hourlyData: any[],
    dayIndex: number
  ): HourlySlot[] => {
    if (!hourlyData.length) return [];

    const slots: HourlySlot[] = [];

    // Calcul du point de départ
    const currentHour = getCurrentHourInTimezone(timezoneInfo?.timezone);
    const startIndex = dayIndex === 0 ? currentHour : dayIndex * 24;

    for (let i = 0; i < 24 && startIndex + i < hourlyData.length; i++) {
      const hourData = hourlyData[startIndex + i];
      if (hourData) {
        slots.push(
          createHourlySlot(hourData, hourlyData, startIndex + i, dayIndex)
        );
      }
    }

    return slots;
  };

  const createHourlySlot = (
    hourData: any,
    allHourlyData: any[],
    hourIndex: number,
    dayIndex: number
  ): HourlySlot => {
    // Parser ISO local "YYYY-MM-DDTHH:mm" pour éviter l'interprétation UTC
    const y = Number(hourData.time.slice(0, 4));
    const mo = Number(hourData.time.slice(5, 7));
    const d = Number(hourData.time.slice(8, 10));
    const h = Number(hourData.time.slice(11, 13));
    const mi = Number(hourData.time.slice(14, 16));
    const date = new Date(y, mo - 1, d, h, mi);

    // Vérifier si c'est l'heure courante en utilisant la timezone
    const isCurrentHour =
      dayIndex === 0 &&
      isCurrentHourInTimezone(hourData.time, timezoneInfo?.timezone);

    // Format de l'heure selon la timezone
    const hourDisplay = formatHourSlot(
      hourData.time,
      timezoneInfo?.timezone,
      isCurrentHour
    );

    // Détecter si cette heure appartient à J+1 (pour "Aujourd'hui")
    const slotDate = hourData.time.slice(0, 10); // YYYY-MM-DD (déjà locale)

    // Trouver le bon dayData selon la date de l'heure
    let targetDayData = dailyData[dayIndex];

    // Si "Aujourd'hui" et que l'heure est de J+1, utiliser les données de J+1
    if (dayIndex === 0) {
      const todayDate = getCurrentDateStringInTimezone(timezoneInfo?.timezone);
      if (slotDate !== todayDate) {
        // Cette heure est de J+1, utiliser les données sunrise/sunset de J+1
        targetDayData = dailyData[1] || dailyData[0];
        console.log(
          `🌅 [HourlySlotsSection] Heure ${date.getHours()}h de J+1 détectée, utilisation sunrise/sunset de J+1`
        );
      }
    }

    const sunrise = targetDayData?.sunrise;
    const sunset = targetDayData?.sunset;

    // Calculer la variante jour/nuit avec les bonnes données
    const variant = getDayNightStateAt(date, sunrise, sunset);

    // Précipitations : valeur de l'heure suivante (preceding hour d'OpenMeteo)
    const nextHourIndex = hourIndex + 1;
    const precipitation =
      nextHourIndex < allHourlyData.length
        ? allHourlyData[nextHourIndex]?.precipitation?.mm || 0
        : 0;

    return {
      time: hourData.time,
      hour: hourDisplay,
      temperature: Math.round(hourData.temperature || 0),
      precipitation: Math.round(precipitation * 10) / 10, // Arrondi à 1 décimale
      wmo: hourData.wmo || 0,
      variant: variant,
    };
  };

  const scrollToHour = (targetHour: number) => {
    if (!scrollRef.current) return;

    // Trouver l'index du slot correspondant à l'heure cible
    const targetIndex = hourlySlots.findIndex((slot) => {
      const hour = parseInt(slot.time.slice(11, 13), 10);
      return hour === targetHour;
    });

    if (targetIndex >= 0) {
      const slotWidth = 95; // Largeur approximative d'un slot
      const scrollPosition = targetIndex * slotWidth;
      scrollRef.current.scrollTo({ left: scrollPosition, behavior: "smooth" });
    }
  };

  const getSlotBackground = (variant: "day" | "night" | "transition") => {
    switch (variant) {
      case "day":
        return "rgba(255, 255, 255, 0.12)";
      case "night":
        return "rgba(0, 0, 0, 0.3)";
      case "transition":
        return "linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(0, 0, 0, 0.3) 100%)";
      default:
        return "rgba(255, 255, 255, 0.08)";
    }
  };

  // Affichage conditionnel si pas de données
  if (!hourlyData || hourlyData.length === 0) {
    return (
      <div
        className="hourly-section-loading"
        style={{
          padding: "20px",
          textAlign: "center",
          color: "white",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "16px",
          margin: "20px 0",
        }}
      >
        Données horaires non disponibles
      </div>
    );
  }

  return (
    <div
      className="hourly-slots-section"
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "16px",
        padding: "20px",
        margin: "20px 0",
        color: "white",
      }}
    >
      {/* En-tête avec titre et bouton infos */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3
          style={{
            fontSize: "1.2em",
            fontWeight: "600",
            color: "white",
            margin: 0,
          }}
        >
          {title}
        </h3>
        <button
          style={{
            padding: "6px 12px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.85em",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)")
          }
        >
          infos
        </button>
      </div>

      {/* Slots horaires avec scroll */}
      <div
        ref={scrollRef}
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "10px",
          scrollBehavior: "smooth",
        }}
      >
        {hourlySlots.map((slot, index) => (
          <div
            key={`${slot.time}-${index}`}
            style={{
              minWidth: "85px",
              maxWidth: "85px",
              background: getSlotBackground(slot.variant),
              borderRadius: "12px",
              padding: "12px 8px",
              textAlign: "center",
              fontSize: "0.85em",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              border:
                slot.hour === "maint."
                  ? "2px solid #fbbf24"
                  : "2px solid transparent",
              boxShadow:
                slot.hour === "maint."
                  ? "0 0 15px rgba(251, 191, 36, 0.4)"
                  : "none",
            }}
          >
            {/* Heure */}
            <div
              style={{
                fontSize: "0.9em",
                fontWeight: slot.hour === "maint." ? "700" : "500",
                opacity: slot.hour === "maint." ? 1 : 0.8,
                color: slot.hour === "maint." ? "#fbbf24" : "white",
              }}
            >
              {slot.hour}
            </div>

            {/* Icône météo WMO */}
            <div
              style={{
                fontSize: "1.6em",
                lineHeight: 1,
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={getWmoFinalIconPath(slot.wmo, slot.variant)}
                alt={`WMO ${slot.wmo}`}
                style={{
                  width: "50px",
                  height: "50px",
                  display: "block",
                }}
                onError={(e) => {
                  // Fallback emoji si l'image n'existe pas
                  const fallbackEmojis: Record<number, string> = {
                    0: "☀️",
                    1: "🌤️",
                    2: "⛅",
                    3: "☁️",
                    45: "🌫️",
                    48: "🌫️",
                    51: "🌦️",
                    53: "🌦️",
                    55: "🌧️",
                    61: "🌧️",
                    63: "🌧️",
                    65: "🌧️",
                    80: "🌦️",
                    81: "🌧️",
                    82: "⛈️",
                    95: "⛈️",
                    96: "⛈️",
                    99: "⛈️",
                  };
                  const fallback = fallbackEmojis[slot.wmo] || "🌤️";
                  e.currentTarget.style.display = "none";
                  if (e.currentTarget.nextElementSibling) {
                    (
                      e.currentTarget.nextElementSibling as HTMLElement
                    ).textContent = fallback;
                    (
                      e.currentTarget.nextElementSibling as HTMLElement
                    ).style.display = "block";
                  }
                }}
              />
              <span style={{ display: "none", fontSize: "24px" }}></span>
            </div>

            {/* Température */}
            <div
              style={{
                fontSize: "1em",
                fontWeight: "700",
                color: "white",
              }}
            >
              {slot.temperature}°
            </div>

            {/* Précipitations */}
            <div
              style={{
                fontSize: "0.75em",
                color: "#64b5f6",
                opacity: 0.9,
              }}
            >
              {slot.precipitation}mm
            </div>
          </div>
        ))}
      </div>

      {/* Indicateur de scroll */}
      {hourlySlots.length > 5 && (
        <div
          style={{
            textAlign: "center",
            marginTop: "10px",
            fontSize: "0.75em",
            color: "rgba(255, 255, 255, 0.6)",
          }}
        >
          Faites défiler horizontalement pour voir plus d'heures
        </div>
      )}
    </div>
  );
};

export default HourlySlotsSection;
