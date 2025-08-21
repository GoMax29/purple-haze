"use client";

import React from "react";

interface ActivityWidgetProps {
  selectedDuration?: number;
  onDurationChange?: (duration: number) => void;
  durations?: number[];
}

const ActivityWidget: React.FC<ActivityWidgetProps> = ({
  selectedDuration = 2,
  onDurationChange,
  durations = [2, 3, 4, 6],
}) => {
  const handleDurationClick = (duration: number) => {
    if (onDurationChange) {
      onDurationChange(duration);
    }
  };

  return (
    <div className="weather-activity-widget mb-4">
      <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
        <h3 className="text-sm font-medium text-purple-200 mb-3">
          Durée de mon activité
        </h3>

        <div className="flex gap-2">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={() => handleDurationClick(duration)}
              className={`
                duration-btn px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${
                  selectedDuration === duration
                    ? "bg-purple-600 text-white shadow-lg scale-105"
                    : "bg-white/10 text-purple-100 hover:bg-white/20 hover:scale-105"
                }
                border border-white/20
              `}
              aria-label={`Sélectionner ${duration} heures d'activité`}
            >
              {duration}h
            </button>
          ))}
        </div>

        <p className="text-xs text-purple-300 mt-2">
          Prévisions optimisées pour {selectedDuration}h d'activité
        </p>
      </div>
    </div>
  );
};

export default ActivityWidget;
