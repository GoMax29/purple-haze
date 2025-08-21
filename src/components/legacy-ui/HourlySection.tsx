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

  return (
    <div className="day-section mb-6">
      {/* Widget durée d'activité */}
      <ActivityWidget
        selectedDuration={selectedDuration}
        onDurationChange={handleDurationChange}
      />

      {/* Timeline horaire scrollable */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-purple-200 mb-3">
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
                humidity={65}
                uvIndex={data.uvIndex}
                aqi={data.aqi}
                isSelected={index === localSelectedHour}
                onClick={() => handleHourClick(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Barre de précipitations - temporairement désactivée pour compatibilité TypeScript */}
      {/* <PrecipitationBar
        precipitationData={precipitationData}
        selectedTimeIndex={localSelectedHour}
        onTimeSelect={handlePrecipitationTimeSelect}
      /> */}
    </div>
  );
};

export default HourlySection;
