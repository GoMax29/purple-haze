"use client";

import React from "react";

interface City {
  name: string;
  lat: number;
  lon: number;
}

interface CitiesButtonsProps {
  cities?: City[];
  selectedCity?: string;
  onCitySelect?: (city: City) => void;
}

const defaultCities: City[] = [
  { name: "Plomeur", lat: 47.833287, lon: -4.26567 },
  { name: "La Torche", lat: 47.840726, lon: -4.352164 },
  { name: "Plonéour", lat: 47.877648, lon: -4.241785 },
  { name: "Surzur", lat: 47.576304, lon: -2.667991 },
  { name: "Montaigu-Vendée", lat: 46.977279, lon: -1.307383 },
  { name: "Ploudal-Maison", lat: 48.5341, lon: -4.6656 },
];

const CitiesButtons: React.FC<CitiesButtonsProps> = ({
  cities = defaultCities,
  selectedCity = "Plomeur",
  onCitySelect,
}) => {
  const handleCityClick = (city: City) => {
    if (onCitySelect) {
      onCitySelect(city);
    }
  };

  return (
    <div
      className="cities-buttons text-center rounded-lg p-4"
      style={{
        margin: "20px 0",
        background: "rgba(255, 255, 255, 0.1)",
        borderRadius: "10px",
        padding: "15px",
      }}
    >
      {cities.map((city) => (
        <button
          key={city.name}
          onClick={() => handleCityClick(city)}
          className={`city-btn transition-all duration-300 ${
            selectedCity === city.name ? "active" : ""
          }`}
          style={{
            padding: "8px 15px",
            margin: "5px",
            background:
              selectedCity === city.name
                ? "linear-gradient(45deg, #7c3aed, #9333ea)"
                : "linear-gradient(45deg, #667eea, #764ba2)",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            fontSize: "0.9em",
            boxShadow:
              selectedCity === city.name
                ? "0 4px 15px rgba(124, 58, 237, 0.4)"
                : "none",
            transform: selectedCity === city.name ? "scale(1.05)" : "none",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform =
              selectedCity === city.name ? "scale(1.05)" : "none";
            e.currentTarget.style.boxShadow =
              selectedCity === city.name
                ? "0 4px 15px rgba(124, 58, 237, 0.4)"
                : "none";
          }}
        >
          {city.name}
        </button>
      ))}

      {/* Version mobile responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .cities-buttons {
            margin: 15px 0 !important;
            padding: 12px !important;
            max-width: 100%;
          }

          .city-btn {
            padding: 6px 12px !important;
            font-size: 0.85em !important;
            margin: 3px !important;
            display: inline-block;
            width: calc(50% - 10px);
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
};

export default CitiesButtons;
