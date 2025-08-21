"use client";

import React, { useState } from "react";
import DailyCard from "./DailyCard";
import { DailyWeatherData } from "@/types/dailyData";
import ToggleSimpleDetail from "./ToggleSimpleDetail";

interface DailyData {
  dayName: string;
  date?: string;
  emoji: string;
  description: string;
  tempMax: number;
  tempMin: number;
  precipitation?: number;
  windSpeed?: number;
  uvIndex?: number;
  isToday?: boolean;
}

interface WeeklySectionProps {
  dailyData?: DailyWeatherData[] | DailyData[]; // Support both formats
  selectedDayIndex?: number;
  onDaySelect?: (index: number) => void;
}

const WeeklySection: React.FC<WeeklySectionProps> = ({
  dailyData = [],
  selectedDayIndex = 0,
  onDaySelect,
}) => {
  const [detailMode, setDetailMode] = useState(false);
  const handleDayClick = (index: number) => {
    if (onDaySelect) {
      onDaySelect(index);
    }
  };

  // Données par défaut si aucune donnée fournie
  const defaultDailyData: DailyData[] = [
    {
      dayName: "Aujourd'hui",
      date: "15 Nov",
      emoji: "🌤️",
      description: "Partiellement nuageux",
      tempMax: 17,
      tempMin: 8,
      precipitation: 0.2,
      windSpeed: 12,
      uvIndex: 3,
      isToday: true,
    },
    {
      dayName: "Demain",
      date: "16 Nov",
      emoji: "☀️",
      description: "Ensoleillé",
      tempMax: 19,
      tempMin: 6,
      precipitation: 0,
      windSpeed: 8,
      uvIndex: 4,
    },
    {
      dayName: "Sam",
      date: "17 Nov",
      emoji: "⛅",
      description: "Nuageux avec éclaircies",
      tempMax: 16,
      tempMin: 9,
      precipitation: 0.5,
      windSpeed: 10,
      uvIndex: 2,
    },
    {
      dayName: "Dim",
      date: "18 Nov",
      emoji: "🌧️",
      description: "Pluie modérée",
      tempMax: 15,
      tempMin: 11,
      precipitation: 8.3,
      windSpeed: 20,
      uvIndex: 1,
    },
    {
      dayName: "Lun",
      date: "19 Nov",
      emoji: "🌦️",
      description: "Averses intermittentes",
      tempMax: 13,
      tempMin: 7,
      precipitation: 2.1,
      windSpeed: 15,
      uvIndex: 2,
    },
    {
      dayName: "Mar",
      date: "20 Nov",
      emoji: "⛅",
      description: "Variable, tendance sèche",
      tempMax: 14,
      tempMin: 5,
      precipitation: 0.1,
      windSpeed: 12,
      uvIndex: 3,
    },
    {
      dayName: "Mer",
      date: "21 Nov",
      emoji: "☀️",
      description: "Beau temps, frais le matin",
      tempMax: 16,
      tempMin: 4,
      precipitation: 0,
      windSpeed: 6,
      uvIndex: 4,
    },
  ];

  const data = dailyData.length > 0 ? dailyData : defaultDailyData;

  // Détecter le format des données (nouveau DailyWeatherData ou ancien DailyData)
  const isNewFormat = data.length > 0 && "timeSlots" in data[0];

  return (
    <div
      className="weekly-section"
      style={{
        padding: "20px",
      }}
    >
      {/* Titre + Toggle simple/détail */}
      <div
        className="weekly-title"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            fontSize: "1.3em",
            fontWeight: 600,
            color: "#e5e7eb",
          }}
        >
          Prévisions 7 jours
        </div>
        <ToggleSimpleDetail value={detailMode} onChange={setDetailMode} />
      </div>

      {/* Liste des cartes journalières */}
      <div
        className="daily-list"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {data.map((day, index) => {
          if (isNewFormat) {
            // Nouveau format avec timeSlots
            const newDay = day as DailyWeatherData;
            return (
              <DailyCard
                key={`${newDay.dayName}-${index}`}
                dayName={newDay.dayName}
                date={newDay.date}
                tempMax={newDay.tempMax}
                tempMin={newDay.tempMin}
                uvIndex={newDay.uvIndex}
                precipitation_total={newDay.precipitation_total}
                timeSlots={newDay.timeSlots}
                isToday={newDay.isToday}
                isSelected={selectedDayIndex === index}
                onClick={() => handleDayClick(index)}
                detailMode={detailMode}
                sunrise={newDay.sunrise}
                sunset={newDay.sunset}
              />
            );
          } else {
            // Format legacy
            const oldDay = day as DailyData;
            return (
              <DailyCard
                key={`${oldDay.dayName}-${index}`}
                dayName={oldDay.dayName}
                date={oldDay.date}
                tempMax={oldDay.tempMax}
                tempMin={oldDay.tempMin}
                uvIndex={oldDay.uvIndex}
                precipitation_total={oldDay.precipitation}
                isToday={oldDay.isToday}
                isSelected={selectedDayIndex === index}
                onClick={() => handleDayClick(index)}
              />
            );
          }
        })}
      </div>
    </div>
  );
};

export default WeeklySection;
