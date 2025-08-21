"use client";

import React from "react";
import HourlyCard from "./HourlyCard";

interface HourlyData {
  time: string;
  temperature: number;
  emoji: string;
  feelsLike?: number;
  windSpeed?: number;
  windDirection?: string;
  precipitation?: number;
  precipitationProbability?: number;
  humidity?: number;
  uvIndex?: number;
  aqi?: number;
}

interface HourlyScrollProps {
  hourlyData?: HourlyData[];
  selectedIndex?: number;
  currentHour?: number; // Index de l'heure actuelle
  onHourSelect?: (index: number) => void;
}

const HourlyScroll: React.FC<HourlyScrollProps> = ({
  hourlyData = [],
  selectedIndex = 0,
  currentHour,
  onHourSelect,
}) => {
  const handleHourClick = (index: number) => {
    if (onHourSelect) {
      onHourSelect(index);
    }
  };

  return (
    <div
      className="hourly-container"
      style={{
        position: "relative",
        marginBottom: "20px",
      }}
    >
      <div
        className="hourly-scroll"
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "10px 0",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {hourlyData.map((hour, index) => (
          <HourlyCard
            key={`${hour.time}-${index}`}
            time={hour.time}
            temperature={hour.temperature}
            emoji={hour.emoji}
            feelsLike={hour.feelsLike}
            windSpeed={hour.windSpeed}
            windDirection={hour.windDirection}
            precipitation={hour.precipitation}
            precipitationProbability={hour.precipitationProbability}
            humidity={hour.humidity}
            uvIndex={hour.uvIndex}
            aqi={hour.aqi}
            isSelected={selectedIndex === index}
            isCurrent={currentHour === index}
            onClick={() => handleHourClick(index)}
          />
        ))}
      </div>

      {/* Style pour masquer la scrollbar */}
      <style jsx>{`
        .hourly-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default HourlyScroll;
