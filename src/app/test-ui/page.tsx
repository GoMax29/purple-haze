"use client";

import React, { useState, useEffect } from "react";
import { NewHeader, WeatherSummary } from "@/components/legacy-ui";
import { LocationData } from "@/services/geocoding";
import {
  SelectedLocationService,
  forceMigration,
} from "@/services/localStorage";
import { fetchForecastData, fetchCacheStats } from "@/services/forecastService";
import { DailyWeatherData } from "@/types/dailyData";
import { ApiCallsStats } from "@/services/apiCallsCounter";

// Localisation par défaut (Plomeur)
const DEFAULT_LOCATION: LocationData = {
  id: "plomeur-default",
  name: "Plomeur",
  country: "FR",
  state: "Bretagne",
  lat: 47.833287,
  lon: -4.26567,
  flag: "https://flagcdn.com/24x18/fr.png",
  fullName: "Plomeur, Bretagne, FR",
};

export default function TestUIPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(
    null
  );
  const [dailyWeatherData, setDailyWeatherData] = useState<DailyWeatherData[]>(
    []
  );
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [lastCacheUpdate, setLastCacheUpdate] = useState<string>("");
  const [apiCallsStats, setApiCallsStats] = useState<ApiCallsStats | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState<string>("--:--");

  // Initialisation de la localisation depuis localStorage ou par défaut
  useEffect(() => {
    // Migration des anciennes données avec emojis vers URLs FlagCDN
    forceMigration();

    const savedLocation = SelectedLocationService.getSelectedLocation();
    const location = savedLocation || DEFAULT_LOCATION;
    setCurrentLocation(location);

    // Charger les données météo pour la localisation
    fetchWeatherData(location.lat, location.lon);

    // Récupérer les stats initiales
    updateCacheStats();
    updateApiCallsStats();

    // Heures côté client uniquement pour éviter le mismatch SSR/CSR
    const update = () =>
      setCurrentTime(
        new Date().toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  // Récupérer les stats de cache multi-niveaux
  const updateCacheStats = async () => {
    try {
      const stats = await fetchCacheStats();
      setCacheStats(stats);
      setLastCacheUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (error) {
      console.error("Erreur récupération stats cache:", error);
      setCacheStats({ error: "Impossible de récupérer les stats" });
    }
  };

  // Récupérer les stats d'appels API depuis le serveur
  const updateApiCallsStats = async () => {
    try {
      const response = await fetch("/api/api-stats");
      if (response.ok) {
        const stats = await response.json();
        setApiCallsStats(stats);
      } else {
        console.error("Erreur HTTP lors de la récupération des stats API");
        setApiCallsStats(null);
      }
    } catch (error) {
      console.error("Erreur récupération stats appels API:", error);
      setApiCallsStats(null);
    }
  };

  // Simulation des données météo
  // plus de lecture directe de l'heure pendant le render SSR

  // Fonction pour récupérer les données météo via l'API
  const fetchWeatherData = async (lat: number, lon: number) => {
    setIsWeatherLoading(true);
    try {
      console.log(`🌍 Récupération des données météo pour ${lat}, ${lon}`);

      // Utiliser le service API pour récupérer les données
      const dailyData = await fetchForecastData(lat, lon);

      setDailyWeatherData(dailyData);
      console.log(`✅ Données météo reçues: ${dailyData.length} jours`);
    } catch (error) {
      console.error(
        "❌ Erreur lors de la récupération des données météo:",
        error
      );
      setDailyWeatherData([]); // Reset en cas d'erreur
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const handleLocationSelect = (location: LocationData) => {
    setCurrentLocation(location);
    SelectedLocationService.setSelectedLocation(location);

    // Récupérer les données météo pour la nouvelle localisation
    fetchWeatherData(location.lat, location.lon);

    // Mettre à jour les stats après changement de location
    setTimeout(() => {
      updateCacheStats();
      updateApiCallsStats();
    }, 1000);
  };

  const handleDaySelect = (index: number) => {
    setSelectedDayIndex(index);

    // Mettre à jour les stats après sélection jour (pour voir l'efficacité du cache)
    setTimeout(() => {
      updateCacheStats();
      updateApiCallsStats();
    }, 500);
  };

  const getLocationTitle = () => {
    return currentLocation ? `Météo ${currentLocation.name}` : "Météo";
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        color: "#333",
      }}
    >
      <div
        className="container mx-auto px-5 py-5"
        style={{ maxWidth: "1400px" }}
      >
        {/* Nouveau header avec recherche et boutons fixes */}
        <NewHeader
          onLocationSelect={handleLocationSelect}
          currentLocation={currentLocation}
          selectedCity={currentLocation?.name}
        />

        {/* Panneau météo moderne - utilise les données réelles avec timeSlots */}
        <WeatherSummary
          locationName={
            currentLocation
              ? `Maintenant à ${currentLocation.name}`
              : "Maintenant"
          }
          currentTime={currentTime}
          temperature={21}
          emoji="🌤️"
          condition="Partiellement nuageux"
          feelsLike={20}
          uvIndex={5}
          uvDescription="Modéré"
          humidity={65}
          aqi={42}
          aqiDescription="Correct"
          precipitation={0.2}
          windSpeed={15}
          windDirection="SW"
          // Nouvelles props pour les données quotidiennes
          dailyData={dailyWeatherData}
          selectedDayIndex={selectedDayIndex}
          onDaySelect={handleDaySelect}
          // Coordonnées pour HourlySlotsSection
          currentLocation={
            currentLocation
              ? { lat: currentLocation.lat, lon: currentLocation.lon }
              : null
          }
        />

        {/* Bloc de validation Milestone 4 */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "15px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          }}
        >
          <h3
            style={{
              color: "#333",
              marginBottom: "15px",
              fontSize: "1.2em",
              fontWeight: "600",
            }}
          >
            ✅ Milestone 4 - Interface de recherche de villes
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "15px",
              fontSize: "0.9em",
            }}
          >
            <div>
              <h4
                style={{
                  color: "#667eea",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                🔍 Recherche avancée
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                <li>API OpenWeatherMap Geocoding</li>
                <li>Auto-complétion temps réel</li>
                <li>Modal interactive avec drapeaux</li>
                <li>Coordonnées lat/lon précises</li>
              </ul>
            </div>

            <div>
              <h4
                style={{
                  color: "#667eea",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                ⭐ Système de favoris
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px", color: "#666" }}>
                <li>Persistance localStorage</li>
                <li>Favoris sticky en haut</li>
                <li>Historique des recherches</li>
                <li>4 villes d'accès rapide</li>
              </ul>
            </div>
          </div>

          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              background: "#f8f9fa",
              borderRadius: "8px",
              fontSize: "0.85em",
              color: "#666",
            }}
          >
            <strong>🌍 Recherche mondiale:</strong> Tapez dans le champ de
            recherche pour explorer n'importe quelle ville dans le monde avec
            l'API officielle OpenWeatherMap
          </div>

          <div
            style={{
              marginTop: "10px",
              textAlign: "center",
              fontSize: "0.9em",
              color: "#667eea",
              fontWeight: "500",
            }}
          >
            🚀 Interface modulaire prête pour intégration dans HomePage
          </div>
        </div>

        {/* État debug + Cache Stats */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "15px",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            fontSize: "0.85em",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "600" }}>
              Debug - Cache Multi-Niveaux Optimisé
            </div>
            <div style={{ display: "flex", gap: "5px" }}>
              <button
                onClick={updateCacheStats}
                style={{
                  padding: "4px 8px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.8em",
                  cursor: "pointer",
                }}
              >
                🔄 Refresh Cache
              </button>
              <button
                onClick={updateApiCallsStats}
                style={{
                  padding: "4px 8px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "0.8em",
                  cursor: "pointer",
                }}
              >
                📊 Refresh API
              </button>
            </div>
          </div>

          {/* Infos générales */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "10px",
              marginBottom: "15px",
              paddingBottom: "15px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div>Ville: {currentLocation?.name || "Non définie"}</div>
            <div>
              Pays: {currentLocation?.flag} {currentLocation?.country}
            </div>
            <div>
              Coordonnées:{" "}
              {currentLocation
                ? `${currentLocation.lat.toFixed(
                    3
                  )}, ${currentLocation.lon.toFixed(3)}`
                : "N/A"}
            </div>
            <div>Heure: {currentTime}</div>
            <div>
              Météo:{" "}
              {isWeatherLoading
                ? "Chargement..."
                : `${dailyWeatherData.length} jours`}
            </div>
            <div>Jour sélectionné: {selectedDayIndex + 1}/7</div>
            <div>MAJ Cache: {lastCacheUpdate || "Jamais"}</div>
            <div>
              Performance:
              {cacheStats?.performance?.efficiency_ratio
                ? ` ${(cacheStats.performance.efficiency_ratio * 100).toFixed(
                    0
                  )}% efficace`
                : " Calcul..."}
            </div>
          </div>

          {/* Stats Cache détaillées */}
          {cacheStats && !cacheStats.error ? (
            <div>
              <div
                style={{
                  fontWeight: "600",
                  marginBottom: "10px",
                  color: "#64b5f6",
                }}
              >
                📦 Stats Cache Multi-Niveaux
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                {/* Cache Niveau 1 (Brut) */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#50ccaa",
                      marginBottom: "5px",
                    }}
                  >
                    🥇 Niveau 1 (Brut)
                  </div>
                  <div style={{ fontSize: "0.8em", lineHeight: 1.4 }}>
                    <div>
                      Total: {cacheStats.level_1_raw?.total_entries || 0}
                    </div>
                    <div>
                      Valides: {cacheStats.level_1_raw?.valid_entries || 0}
                    </div>
                    <div>
                      TTL: {cacheStats.level_1_raw?.ttl_minutes || 0} min
                    </div>
                    <div>
                      Taille: {cacheStats.level_1_raw?.cache_size_mb || 0} MB
                    </div>
                  </div>
                </div>

                {/* Cache Niveau 2 (Traité) */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color: "#f1e741",
                      marginBottom: "5px",
                    }}
                  >
                    🥈 Niveau 2 (Traité)
                  </div>
                  <div style={{ fontSize: "0.8em", lineHeight: 1.4 }}>
                    <div>
                      Total: {cacheStats.level_2_processed?.total_entries || 0}
                    </div>
                    <div>
                      Valides:{" "}
                      {cacheStats.level_2_processed?.valid_entries || 0}
                    </div>
                    <div>
                      TTL: {cacheStats.level_2_processed?.ttl_minutes || 0} min
                    </div>
                    <div>
                      Taille: {cacheStats.level_2_processed?.cache_size_mb || 0}{" "}
                      MB
                    </div>
                  </div>
                </div>
              </div>

              {/* Synchronisation */}
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.8em",
                  textAlign: "center",
                  color: cacheStats.sync_status?.ttl_synchronized
                    ? "#50ccaa"
                    : "#ff5151",
                }}
              >
                Sync TTL:{" "}
                {cacheStats.sync_status?.ttl_synchronized
                  ? "✅ OK"
                  : "❌ Désynchronisé"}
                | Coords communes:{" "}
                {cacheStats.sync_status?.common_coordinates?.length || 0}| Total
                Cache:{" "}
                {cacheStats.performance?.total_cache_size_mb?.toFixed(2) || 0}{" "}
                MB
              </div>
            </div>
          ) : cacheStats?.error ? (
            <div style={{ color: "#ff5151", fontSize: "0.8em" }}>
              ❌ Erreur cache: {cacheStats.error}
            </div>
          ) : (
            <div style={{ color: "#f1e741", fontSize: "0.8em" }}>
              🔄 Chargement stats cache...
            </div>
          )}
        </div>

        {/* Compteur appels API */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            padding: "15px",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            fontSize: "0.85em",
            marginTop: "15px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
            }}
          >
            <div style={{ fontWeight: "600", color: "#ff9800" }}>
              📊 Compteur API Calls{" "}
              {(apiCallsStats as any)?.source === "server"
                ? "(Serveur)"
                : "(Client)"}
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/api-stats", {
                    method: "POST",
                  });
                  if (response.ok) {
                    console.log("✅ Compteurs API réinitialisés");
                  }
                } catch (error) {
                  console.error("Erreur lors du reset des compteurs:", error);
                }
                updateApiCallsStats();
              }}
              style={{
                padding: "4px 8px",
                background: "rgba(255, 152, 0, 0.2)",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontSize: "0.8em",
                cursor: "pointer",
              }}
            >
              🗑️ Reset All
            </button>
          </div>

          {apiCallsStats ? (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                  marginBottom: "10px",
                }}
              >
                {/* Minute */}
                <div
                  style={{
                    background: "rgba(255, 152, 0, 0.1)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color:
                        apiCallsStats.minute.count >
                        apiCallsStats.minute.limit * 0.8
                          ? "#ff5151"
                          : "#ff9800",
                      marginBottom: "5px",
                    }}
                  >
                    ⏱️ Minute
                  </div>
                  <div style={{ fontSize: "0.8em", lineHeight: 1.4 }}>
                    <div>
                      <strong>{apiCallsStats.minute.count}</strong> /{" "}
                      {apiCallsStats.minute.limit}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "4px",
                        background: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        margin: "5px 0",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            (apiCallsStats.minute.count /
                              apiCallsStats.minute.limit) *
                              100,
                            100
                          )}%`,
                          height: "100%",
                          background:
                            apiCallsStats.minute.count >
                            apiCallsStats.minute.limit * 0.8
                              ? "#ff5151"
                              : "#ff9800",
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.7em", opacity: 0.8 }}>
                      Reset: {apiCallsStats.minute.resetTime.split(" ")[1]}
                    </div>
                  </div>
                </div>

                {/* Heure */}
                <div
                  style={{
                    background: "rgba(255, 152, 0, 0.1)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color:
                        apiCallsStats.hour.count >
                        apiCallsStats.hour.limit * 0.8
                          ? "#ff5151"
                          : "#ff9800",
                      marginBottom: "5px",
                    }}
                  >
                    🕐 Heure
                  </div>
                  <div style={{ fontSize: "0.8em", lineHeight: 1.4 }}>
                    <div>
                      <strong>{apiCallsStats.hour.count}</strong> /{" "}
                      {apiCallsStats.hour.limit}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "4px",
                        background: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        margin: "5px 0",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            (apiCallsStats.hour.count /
                              apiCallsStats.hour.limit) *
                              100,
                            100
                          )}%`,
                          height: "100%",
                          background:
                            apiCallsStats.hour.count >
                            apiCallsStats.hour.limit * 0.8
                              ? "#ff5151"
                              : "#ff9800",
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.7em", opacity: 0.8 }}>
                      Reset: {apiCallsStats.hour.resetTime.split(" ")[1]}
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                {/* Jour */}
                <div
                  style={{
                    background: "rgba(255, 152, 0, 0.1)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color:
                        apiCallsStats.day.count > apiCallsStats.day.limit * 0.8
                          ? "#ff5151"
                          : "#ff9800",
                      marginBottom: "5px",
                    }}
                  >
                    📅 Jour
                  </div>
                  <div style={{ fontSize: "0.8em", lineHeight: 1.4 }}>
                    <div>
                      <strong>{apiCallsStats.day.count}</strong> /{" "}
                      {apiCallsStats.day.limit}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "4px",
                        background: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        margin: "5px 0",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            (apiCallsStats.day.count /
                              apiCallsStats.day.limit) *
                              100,
                            100
                          )}%`,
                          height: "100%",
                          background:
                            apiCallsStats.day.count >
                            apiCallsStats.day.limit * 0.8
                              ? "#ff5151"
                              : "#ff9800",
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.7em", opacity: 0.8 }}>
                      Reset: {apiCallsStats.day.resetTime.split(" ")[0]}
                    </div>
                  </div>
                </div>

                {/* Mois */}
                <div
                  style={{
                    background: "rgba(255, 152, 0, 0.1)",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "600",
                      color:
                        apiCallsStats.month.count >
                        apiCallsStats.month.limit * 0.8
                          ? "#ff5151"
                          : "#ff9800",
                      marginBottom: "5px",
                    }}
                  >
                    📆 Mois
                  </div>
                  <div style={{ fontSize: "0.8em", lineHeight: 1.4 }}>
                    <div>
                      <strong>{apiCallsStats.month.count}</strong> /{" "}
                      {apiCallsStats.month.limit}
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: "4px",
                        background: "rgba(255,255,255,0.2)",
                        borderRadius: "2px",
                        margin: "5px 0",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(
                            (apiCallsStats.month.count /
                              apiCallsStats.month.limit) *
                              100,
                            100
                          )}%`,
                          height: "100%",
                          background:
                            apiCallsStats.month.count >
                            apiCallsStats.month.limit * 0.8
                              ? "#ff5151"
                              : "#ff9800",
                          borderRadius: "2px",
                        }}
                      ></div>
                    </div>
                    <div style={{ fontSize: "0.7em", opacity: 0.8 }}>
                      Reset: 1er du mois
                    </div>
                  </div>
                </div>
              </div>

              {/* Infos techniques */}
              <div
                style={{
                  marginTop: "10px",
                  fontSize: "0.75em",
                  textAlign: "center",
                  color: "rgba(255, 255, 255, 0.7)",
                  padding: "8px",
                  background: "rgba(255, 152, 0, 0.05)",
                  borderRadius: "6px",
                }}
              >
                🎯 Coût par appel: 12.1 calls | API3 Marine: DÉSACTIVÉE |
                Source: {(apiCallsStats as any).source} | MAJ:{" "}
                {apiCallsStats.lastUpdate}
              </div>
            </div>
          ) : (
            <div
              style={{
                color: "#ff9800",
                fontSize: "0.8em",
                textAlign: "center",
              }}
            >
              🔄 Chargement compteurs API...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
