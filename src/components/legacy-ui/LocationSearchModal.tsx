"use client";

import React, { useState, useEffect, useRef } from "react";
import { searchLocations, LocationData } from "../../services/geocoding";
import {
  FavoritesService,
  RecentSearchesService,
} from "../../services/localStorage";

interface LocationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  currentLocation?: LocationData | null;
}

const LocationSearchModal: React.FC<
  LocationSearchModalProps & { anchorTop?: number }
> = ({
  isOpen,
  onClose,
  onLocationSelect,
  currentLocation,
  anchorTop = 80,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [favorites, setFavorites] = useState<LocationData[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Chargement initial des données
  useEffect(() => {
    if (isOpen) {
      setFavorites(FavoritesService.getFavorites());
      setRecentSearches(RecentSearchesService.getRecentSearches());

      // Focus sur l'input après ouverture
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Recherche avec debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsLoading(true);
        setError(null);

        try {
          const results = await searchLocations(searchQuery, 8);
          setSearchResults(results);
        } catch (err) {
          setError("Erreur lors de la recherche");
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Gestion de la fermeture par ESC ou clic extérieur
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleLocationSelect = (location: LocationData) => {
    // Ajouter aux recherches récentes
    const newRecent = RecentSearchesService.addRecentSearch(location);
    setRecentSearches(newRecent);

    // Notifier la sélection
    onLocationSelect(location);

    // Fermer la modal
    onClose();
  };

  const toggleFavorite = (location: LocationData) => {
    const isFav = FavoritesService.isFavorite(location);

    let newFavorites: LocationData[];
    if (isFav) {
      newFavorites = FavoritesService.removeFavorite(location);
    } else {
      newFavorites = FavoritesService.addFavorite(location);
    }

    setFavorites(newFavorites);
  };

  const LocationItem: React.FC<{
    location: LocationData;
    showFavoriteButton?: boolean;
    source?: "search" | "favorite" | "recent";
  }> = ({ location, showFavoriteButton = true, source }) => {
    const isFav = FavoritesService.isFavorite(location);
    const isSelected =
      currentLocation &&
      Math.abs(currentLocation.lat - location.lat) < 0.001 &&
      Math.abs(currentLocation.lon - location.lon) < 0.001;

    return (
      <div
        className={`location-item ${isSelected ? "selected" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderRadius: "8px",
          cursor: "pointer",
          backgroundColor: isSelected
            ? "rgba(102, 126, 234, 0.1)"
            : "transparent",
          border: isSelected ? "2px solid #667eea" : "2px solid transparent",
          marginBottom: "4px",
          transition: "all 0.2s ease",
        }}
        onClick={() => handleLocationSelect(location)}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <div style={{ width: "24px", marginRight: "12px" }}>
          <img
            src={location.flag}
            alt={location.country}
            width={24}
            height={18}
            style={{ borderRadius: "2px" }}
            onError={(e) => {
              // Fallback en cas d'erreur de chargement du drapeau
              e.currentTarget.style.display = "none";
              const fallback = document.createElement("div");
              fallback.textContent = location.country;
              fallback.style.cssText =
                "font-size: 10px; color: #666; text-align: center; width: 24px; height: 18px; line-height: 18px; border: 1px solid #ddd; border-radius: 2px;";
              e.currentTarget.parentNode?.appendChild(fallback);
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: "600",
              color: "#333",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {location.name}
          </div>
          <div
            style={{
              fontSize: "0.85em",
              color: "#666",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {location.fullName}
          </div>
          <div
            style={{
              fontSize: "0.75em",
              color: "#999",
              marginTop: "2px",
            }}
          >
            {location.lat.toFixed(3)}, {location.lon.toFixed(3)}
          </div>
        </div>

        {showFavoriteButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(location);
            }}
            style={{
              background: "none",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              padding: "4px",
              opacity: isFav ? 1 : 0.3,
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = isFav ? "1" : "0.3";
            }}
          >
            ⭐
          </button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 1000,
        paddingTop: `${anchorTop}px`,
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: "white",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header avec champ de recherche */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #eee",
            backgroundColor: "#f8f9fa",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h2
              style={{
                margin: 0,
                flex: 1,
                fontSize: "1.5em",
                color: "#333",
                fontWeight: "600",
              }}
            >
              Rechercher une ville
            </h2>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                padding: "4px",
                color: "#666",
              }}
            >
              ✕
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Tapez le nom d'une ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #ddd",
                borderRadius: "8px",
                fontSize: "16px",
                outline: "none",
                transition: "border-color 0.2s ease",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#ddd";
              }}
            />
            {isLoading && (
              <div
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "16px",
                }}
              >
                🔄
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                marginTop: "8px",
                color: "#e74c3c",
                fontSize: "0.9em",
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Contenu scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 20px",
          }}
        >
          {/* Résultats de recherche */}
          {searchQuery.trim().length >= 2 && (
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "1.1em",
                  color: "#333",
                  fontWeight: "600",
                }}
              >
                Résultats de recherche
              </h3>

              {searchResults.length > 0 ? (
                searchResults.map((location) => (
                  <LocationItem
                    key={location.id}
                    location={location}
                    source="search"
                  />
                ))
              ) : !isLoading ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#666",
                    padding: "20px",
                    fontStyle: "italic",
                  }}
                >
                  Aucun résultat trouvé
                </div>
              ) : null}
            </div>
          )}

          {/* Favoris */}
          {favorites.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "1.1em",
                  color: "#333",
                  fontWeight: "600",
                }}
              >
                ⭐ Favoris
              </h3>
              {favorites.map((location) => (
                <LocationItem
                  key={`fav_${location.id}`}
                  location={location}
                  source="favorite"
                />
              ))}
            </div>
          )}

          {/* Recherches récentes */}
          {recentSearches.length > 0 && (
            <div>
              <h3
                style={{
                  margin: "0 0 12px 0",
                  fontSize: "1.1em",
                  color: "#333",
                  fontWeight: "600",
                }}
              >
                🕐 Recherches récentes
              </h3>
              {recentSearches.map((location) => (
                <LocationItem
                  key={`recent_${location.id}`}
                  location={location}
                  source="recent"
                />
              ))}
            </div>
          )}

          {/* Message si aucune donnée */}
          {favorites.length === 0 &&
            recentSearches.length === 0 &&
            searchQuery.trim().length < 2 && (
              <div
                style={{
                  textAlign: "center",
                  color: "#666",
                  padding: "40px 20px",
                  fontStyle: "italic",
                }}
              >
                Commencez à taper pour rechercher une ville...
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default LocationSearchModal;
