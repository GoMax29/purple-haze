// 🚫 Ne pas modifier ce fichier sauf cas très spécifique
// Ce wrapper React sert uniquement à encapsuler la page HTML/JS de test
// Toute modification fonctionnelle ou visuelle doit se faire dans /public/test-algo/
"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

// Déclaration TypeScript pour les propriétés ajoutées à window
declare global {
  interface Window {
    TestAlgoApp?: {
      initializeApp: () => void;
      cleanup: () => void;
    };
  }
}

// Composant pour éviter les problèmes d'hydratation
const TestAlgoContent = dynamic(() => Promise.resolve(TestAlgoPageContent), {
  ssr: false,
});

function TestAlgoPageContent() {
  useEffect(() => {
    // Charger Chart.js depuis CDN
    const chartScript = document.createElement("script");
    chartScript.src = "https://cdn.jsdelivr.net/npm/chart.js";
    chartScript.id = "chart-js-cdn";
    document.head.appendChild(chartScript);

    // Charger Leaflet (OpenStreetMap)
    const leafletCss = document.createElement("link");
    leafletCss.rel = "stylesheet";
    leafletCss.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    leafletCss.id = "leaflet-css-cdn";
    document.head.appendChild(leafletCss);

    const leafletScript = document.createElement("script");
    leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    leafletScript.id = "leaflet-js-cdn";

    // Charger le CSS de test-algo
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/test-algo/style.css";
    link.id = "test-algo-styles";
    document.head.appendChild(link);

    // Attendre Chart.js puis Leaflet avant app.js
    chartScript.onload = () => {
      if (!document.getElementById("leaflet-js-cdn")) {
        document.head.appendChild(leafletScript);
      } else if (!(window as any).L) {
        document.head.appendChild(leafletScript);
      }

      const loadApp = () => {
        const existingScript = document.getElementById("test-algo-script");
        if (!existingScript) {
          const script = document.createElement("script");
          script.src = "/test-algo/app.js";
          script.id = "test-algo-script";
          script.onload = () => {
            console.log("🎯 Script test-algo chargé et prêt");
          };
          document.body.appendChild(script);
        } else {
          console.log("🔄 Script déjà présent, réinitialisation...");
          if (window.TestAlgoApp && window.TestAlgoApp.initializeApp) {
            window.TestAlgoApp.initializeApp();
          }
        }
      };

      if ((window as any).L) loadApp();
      else leafletScript.onload = loadApp;
    };

    // Appliquer le thème initial
    document.body.className = "theme-temp";

    // Cleanup lors du démontage
    return () => {
      const existingChartScript = document.getElementById("chart-js-cdn");
      const existingLink = document.getElementById("test-algo-styles");
      const existingScript = document.getElementById("test-algo-script");
      if (existingChartScript) existingChartScript.remove();
      if (existingLink) existingLink.remove();
      if (existingScript) existingScript.remove();

      // Remettre le body à l'état initial
      document.body.className = "";
    };
  }, []);

  return (
    <div id="test-algo-root">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <div className="logo">
                <span className="logo-icon">🌩️</span>
                <div className="logo-text">
                  <h1>Analyse des algorithmes de pondération avancés</h1>
                </div>
              </div>
            </div>
            <div className="header-right">
              <div className="location-badge">
                <div className="status-dot"></div>
                <span id="current-location">
                  📍 Plomeur, Bretagne (47.8322°N, -4.2967°W)
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Sélecteur de villes */}
      <section className="city-selector">
        <div className="container">
          <div className="city-buttons">
            <button
              className="city-btn active"
              data-city="plomeur"
              data-lat="47.8322"
              data-lon="-4.2967"
              data-label="Plomeur, Bretagne"
              data-coords="47.8322°N, -4.2967°W"
            >
              🏄‍♂️ Plomeur
            </button>
            <button
              className="city-btn"
              data-city="surzur"
              data-lat="47.5667"
              data-lon="-2.6333"
              data-label="Surzur, Bretagne"
              data-coords="47.5667°N, -2.6333°W"
            >
              🌊 Surzur
            </button>
            <button
              className="city-btn"
              data-city="biarritz"
              data-lat="43.4832"
              data-lon="-1.5586"
              data-label="Biarritz, Nouvelle-Aquitaine"
              data-coords="43.4832°N, -1.5586°W"
            >
              🏖️ Biarritz
            </button>
            <button
              className="city-btn"
              data-city="paris"
              data-lat="48.8566"
              data-lon="2.3522"
              data-label="Paris, Île-de-France"
              data-coords="48.8566°N, 2.3522°E"
            >
              🗼 Paris
            </button>
            <button
              className="city-btn"
              data-city="colmar"
              data-lat="48.0793"
              data-lon="7.3558"
              data-label="Colmar, Grand Est"
              data-coords="48.0793°N, 7.3558°E"
            >
              🍷 Colmar
            </button>
            <button
              className="city-btn"
              data-city="cap-corse"
              data-lat="42.9667"
              data-lon="9.4333"
              data-label="Cap-Corse, Corse"
              data-coords="42.9667°N, 9.4333°E"
            >
              ⛰️ Cap-Corse
            </button>
            <button
              className="city-btn"
              data-city="annecy"
              data-lat="45.8992"
              data-lon="6.1289"
              data-label="Annecy, Auvergne-Rhône-Alpes"
              data-coords="45.8992°N, 6.1289°E"
            >
              🏔️ Annecy
            </button>
            <button
              className="city-btn"
              data-city="brest"
              data-lat="48.3904"
              data-lon="-4.4861"
              data-label="Brest, Bretagne"
              data-coords="48.3904°N, -4.4861°W"
            >
              ⚓ Brest
            </button>
            <button
              className="city-btn"
              data-city="cherbourg"
              data-lat="49.6337"
              data-lon="-1.6222"
              data-label="Cherbourg, Normandie"
              data-coords="49.6337°N, -1.6222°W"
            >
              🌊 Cherbourg
            </button>
            <button
              className="city-btn"
              data-city="antarctique"
              data-lat="-65.1958"
              data-lon="-62.6828"
              data-label="Antarctique (Test Fallback)"
              data-coords="65.1958°S, 62.6828°W"
            >
              🧊 Antarctique
            </button>
            {/* Bouton toggle carte */}
            <button
              id="toggle-map-btn"
              className="city-btn city-btn-outline"
              title="Choisir un point sur la carte"
            >
              🗺️ +
            </button>
          </div>
          {/* Carte OpenStreetMap (toggle) */}
          <div id="osm-map-wrapper" style={{ display: "none" }}>
            <div className="map-controls">
              <button id="osm-reset-btn" className="map-reset-btn">
                🔁 Recentrer France
              </button>
            </div>
            <div id="osm-map"></div>
          </div>
        </div>
      </section>

      {/* Navigation */}
      <nav className="tabs-nav" role="tablist">
        <div className="container">
          <div className="tabs-wrapper">
            <button
              className="tab-button active"
              data-tab="temp"
              role="tab"
              aria-selected="true"
              aria-controls="content"
            >
              <div className="tab-icon">🌡️</div>
              <div className="tab-content">
                <div className="tab-label">Température</div>
                <div className="tab-unit">°C</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="apparent"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🌡️</div>
              <div className="tab-content">
                <div className="tab-label">Temp. Apparente</div>
                <div className="tab-unit">°C</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="humidite"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">💧</div>
              <div className="tab-content">
                <div className="tab-label">Humidité</div>
                <div className="tab-unit">%</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="wmo"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🌤️</div>
              <div className="tab-content">
                <div className="tab-label">Code WMO</div>
                <div className="tab-unit">code</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="precipitation"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🌧️</div>
              <div className="tab-content">
                <div className="tab-label">Precipitation</div>
                <div className="tab-unit">mm/%</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="wind_force"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🌪️</div>
              <div className="tab-content">
                <div className="tab-label">Force Vent</div>
                <div className="tab-unit">km/h</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="wind_gust"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">💨</div>
              <div className="tab-content">
                <div className="tab-label">Rafales</div>
                <div className="tab-unit">km/h</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="wind_direction"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🧭</div>
              <div className="tab-content">
                <div className="tab-label">Direction</div>
                <div className="tab-unit">°</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="methodo"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🧠</div>
              <div className="tab-content">
                <div className="tab-label">Méthodologie</div>
                <div className="tab-unit">docs</div>
              </div>
            </button>
            <button
              className="tab-button"
              data-tab="final_params"
              role="tab"
              aria-selected="false"
              aria-controls="content"
            >
              <div className="tab-icon">🎯</div>
              <div className="tab-content">
                <div className="tab-label">Paramètres Finaux</div>
                <div className="tab-unit">core</div>
              </div>
            </button>
            <div className="tab-indicator" aria-hidden="true"></div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="main-content">
        <div className="container">
          <div id="content" className="content-area" role="tabpanel">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Chargement des données...</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="milestone-info">
              <div className="milestone-icon">⚡</div>
              <div className="milestone-text">
                <h4>Milestone 2 - Traitement Modulaire</h4>
                <p>Architecture métier séparée de l'affichage</p>
              </div>
            </div>
            <div className="footer-stats">
              <div className="stat-item">
                <span className="stat-dot stat-success"></span>
                <span>Fonctions de traitement modularisées</span>
              </div>
              <div className="stat-item">
                <span className="stat-dot stat-info"></span>
                <span>APIs multi-modèles (13 modèles actifs)</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Variables CSS pour les thèmes */}
      <style jsx>{`
        :root {
          --accent: #f97316;
          --accent-light: #ffedd5;
          --accent-dark: #ea580c;
        }
        #test-algo-root {
          font-family: "Inter", sans-serif;
        }
        body.theme-temp {
          --accent: #f97316;
          --accent-light: #ffedd5;
          --accent-dark: #ea580c;
        }
        body.theme-apparent {
          --accent: #f59e0b;
          --accent-light: #fef3c7;
          --accent-dark: #d97706;
        }
        body.theme-humidite {
          --accent: #3b82f6;
          --accent-light: #dbeafe;
          --accent-dark: #2563eb;
        }
        body.theme-wmo {
          --accent: #8b5cf6;
          --accent-light: #ede9fe;
          --accent-dark: #7c3aed;
        }
        body.theme-wind-force {
          --accent: #10b981;
          --accent-light: #d1fae5;
          --accent-dark: #059669;
        }
        body.theme-wind-gust {
          --accent: #f59e0b;
          --accent-light: #fef3c7;
          --accent-dark: #d97706;
        }
        body.theme-wind-direction {
          --accent: #8b5cf6;
          --accent-light: #ede9fe;
          --accent-dark: #7c3aed;
        }
        body.theme-methodo {
          --accent: #06b6d4;
          --accent-light: #cffafe;
          --accent-dark: #0891b2;
        }
      `}</style>
    </div>
  );
}

export default function TestAlgoPage() {
  return <TestAlgoContent />;
}
