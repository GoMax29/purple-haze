"use client";

import React, { useState } from "react";
import HourlyCard from "./HourlyCard";
import ActivityWidget from "./ActivityWidget";
import PrecipitationBar from "./PrecipitationBar";

interface HourlyData {
  time: string;
  temperature: number;
  emoji: string;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  aqi?: number;
}

interface PrecipitationData {
  time: string;
  precipitation: number;
  probability: number;
}

interface HourlySectionProps {
  hourlyData?: HourlyData[];
  precipitationData?: PrecipitationData[];
  selectedHourIndex?: number;
  selectedDuration?: number;
  onHourSelect?: (index: number) => void;
  onDurationChange?: (duration: number) => void;
}

const HourlySection: React.FC<HourlySectionProps> = ({
  hourlyData = [],
  precipitationData = [],
  selectedHourIndex = 0,
  selectedDuration = 2,
  onHourSelect,
  onDurationChange,
}) => {
  const [localSelectedHour, setLocalSelectedHour] = useState(selectedHourIndex);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleHourClick = (index: number) => {
    setLocalSelectedHour(index);
    if (onHourSelect) {
      onHourSelect(index);
    }
  };

  const handleDurationChange = (duration: number) => {
    if (onDurationChange) {
      onDurationChange(duration);
    }
  };

  const handlePrecipitationTimeSelect = (index: number) => {
    handleHourClick(index);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="day-section mb-3">
      {/* Widget durée d'activité */}
      <ActivityWidget
        selectedDuration={selectedDuration}
        onDurationChange={handleDurationChange}
      />

      {/* Timeline horaire scrollable */}
      <div className="mb-2">
        <h3 className="text-sm font-medium text-purple-200 mb-2">
          Prévisions horaires
        </h3>
        <div className="hourly-scroll overflow-x-auto">
          <div className="flex gap-3 pb-2 min-w-max">
            {hourlyData.map((data, index) => (
              <HourlyCard
                key={index}
                time={data.time}
                temperature={data.temperature}
                emoji={data.emoji}
                feelsLike={data.temperature}
                windSpeed={data.windSpeed}
                windDirection={data.windDirection.toString()}
                precipitation={data.precipitation}
                precipitationProbability={50}
                graphcastPrecipitation={0} // TODO: mapper depuis les données réelles
                graphcastProbability={0} // TODO: mapper depuis les données réelles
                humidity={65}
                uvIndex={data.uvIndex}
                aqi={data.aqi}
                isSelected={index === localSelectedHour}
                isExpanded={isExpanded}
                onClick={() => handleHourClick(index)}
              />
            ))}
          </div>
        </div>

        {/* Bouton d'expansion/compression */}
        <div className="flex justify-center mt-3">
          <button
            onClick={toggleExpanded}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20"
            aria-label={
              isExpanded ? "Masquer les détails" : "Afficher les détails"
            }
          >
            {isExpanded ? "−" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HourlySection;
