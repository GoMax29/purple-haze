"use client";

import React, { useState } from "react";
import LocationSearchModal from "./LocationSearchModal";
import { LocationData } from "../../services/geocoding";

interface NewHeaderProps {
  onLocationSelect?: (location: LocationData) => void;
  currentLocation?: LocationData | null;
  selectedCity?: string;
}

const NewHeader: React.FC<NewHeaderProps> = ({
  onLocationSelect,
  currentLocation,
  selectedCity,
}) => {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [anchorTop, setAnchorTop] = useState<number>(80);

  const handleSearchLocationSelect = (location: LocationData) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  return (
    <div
      style={{
        background: "transparent", // pas de fond ajouté sous le bandeau de recherche
        borderRadius: "16px",
        padding: "0",
        margin: "0",
        backdropFilter: "blur(10px)",
        border: "none",
      }}
    >
      {/* Champ de recherche */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          // IMPORTANT: on ajoute l'espace au-dessus via padding du parent (pas de marge extérieure)
          padding: "20px 25px 2px 25px", // bottom réduit pour rapprocher le nom de la ville
          background: "transparent",
        }}
      >
        <div
          onClick={(e) => {
            const rect = (
              e.currentTarget.parentElement?.parentElement as HTMLElement
            ).getBoundingClientRect();
            setAnchorTop(rect.top);
            setIsSearchModalOpen(true);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            background: "#ffffff",
            borderRadius: "25px",
            cursor: "pointer",
            minWidth: "250px",
            maxWidth: "450px",
            width: "100%",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.15)",
            transition: "all 0.3s ease",
            border: "2px solid #7c3aed",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow =
              "0 12px 30px rgba(124, 58, 237, 0.3)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.borderColor = "#6d28d9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.15)";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.borderColor = "#7c3aed";
          }}
        >
          <div
            style={{
              marginRight: "10px",
              display: "flex",
              alignItems: "center",
            }}
            aria-hidden
          >
            {/* Icône loupe SVG (accessible, pas d’emoji) */}
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="11" cy="11" r="7" stroke="#7c3aed" strokeWidth="2" />
              <line
                x1="16.5"
                y1="16.5"
                x2="21"
                y2="21"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            style={{
              flex: 1,
              color: "#6d28d9",
              fontSize: "16px",
              fontWeight: "500",
            }}
          >
            {currentLocation
              ? `${currentLocation.name}`
              : "Rechercher une ville dans le monde..."}
          </div>
        </div>
      </div>

      {/* Modal de recherche */}
      <LocationSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onLocationSelect={handleSearchLocationSelect}
        currentLocation={currentLocation}
        anchorTop={anchorTop}
      />

      {/* Style responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .quick-access-cities {
            flex-direction: column;
            gap: 6px !important;
          }

          .quick-access-cities button {
            width: 100% !important;
            min-width: auto !important;
            font-size: 0.7em !important;
          }

          .search-field {
            min-width: 250px !important;
          }
        }

        @media (max-width: 480px) {
          .quick-access-cities {
            flex-wrap: wrap;
          }

          .quick-access-cities button {
            flex: 1 1 calc(50% - 4px);
          }
        }
      `}</style>
    </div>
  );
};

export default NewHeader;
