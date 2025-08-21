"use client";

import React from "react";

interface HeaderProps {
  onRefresh?: () => void;
  isLoading?: boolean;
  latitude?: number;
  longitude?: number;
  onLatitudeChange?: (lat: number) => void;
  onLongitudeChange?: (lon: number) => void;
}

const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading = false,
  latitude = 48.38,
  longitude = -4.5,
  onLatitudeChange,
  onLongitudeChange,
}) => {
  const handleRefresh = () => {
    if (onRefresh && !isLoading) {
      onRefresh();
    }
  };

  return (
    <div className="location-input text-center my-5">
      <input
        type="number"
        placeholder="Latitude"
        value={latitude}
        step={0.01}
        onChange={(e) => onLatitudeChange?.(parseFloat(e.target.value))}
        className="p-2.5 mx-1.5 border-0 rounded-md w-30"
        style={{ width: "120px" }}
      />
      <input
        type="number"
        placeholder="Longitude"
        value={longitude}
        step={0.01}
        onChange={(e) => onLongitudeChange?.(parseFloat(e.target.value))}
        className="p-2.5 mx-1.5 border-0 rounded-md w-30"
        style={{ width: "120px" }}
      />
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="px-5 py-2.5 ml-2.5 border-0 rounded-md cursor-pointer text-white transition-colors"
        style={{
          background: isLoading ? "#cccccc" : "#4caf50",
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#45a049";
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.background = "#4caf50";
          }
        }}
      >
        🔄 {isLoading ? "Actualisation..." : "Actualiser"}
      </button>
    </div>
  );
};

export default Header;
