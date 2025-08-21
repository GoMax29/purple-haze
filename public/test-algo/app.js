/**
 * Application principale - Orchestrateur (onglets, thèmes, chargement dynamique, villes + carte)
 * Architecture: JavaScript Vanilla moderne
 */

// Protection contre le double chargement avec IIFE
(function () {
  "use strict";

  // Réinitialisation si déjà chargé
  if (typeof window.TestAlgoConfig !== "undefined") {
    if (window.TestAlgoApp && window.TestAlgoApp.cleanup) {
      window.TestAlgoApp.cleanup();
    }
  }

  // ================================== CONFIG ==================================
  const CONFIG = {
    coords: { lat: 47.8322, lon: -4.2967 },
    themes: {
      temp: "theme-temp",
      apparent: "theme-apparent",
      humidite: "theme-humidite",
      wmo: "theme-wmo",
      final_params: "theme-methodo",
      precipitation: "theme-precipitation",
      wind_force: "theme-wind-force",
      wind_gust: "theme-wind-gust",
      wind_direction: "theme-wind-direction",
      methodo: "theme-methodo",
    },
    endpoints: {
      temp: "/api/test-param/temperature",
      apparent: "/api/test-param/apparent-temperature",
      humidite: "/api/test-param/humidite",
      wmo: "/api/test-param/wmo",
      precipitation: "/api/test-param/precipitation",
      wind_force: "/api/test-param/wind",
      wind_gust: "/api/test-param/wind",
      wind_direction: "/api/test-param/wind",
      final_params: "/api/test-param/final-params",
    },
  };

  // État orchestrateur
  let currentTab = "temp";
  let loadedModules = new Map();
  let eventListenersAttached = false;
  let resizeHandler = null;

  // ================================== LOADER ==================================
  const loadedScripts = new Set();

  async function loadScriptOnce(src) {
    if (loadedScripts.has(src)) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = () => {
        loadedScripts.add(src);
        resolve();
      };
      s.onerror = () => reject(new Error(`Echec chargement script ${src}`));
      document.head.appendChild(s);
    });
  }

  async function ensureCommonLoaded() {
    if (!window.TestAlgoCommon) {
      await loadScriptOnce(`/test-algo/js/common.js`);
    }
  }

  async function ensureModuleLoaded(moduleId) {
    await ensureCommonLoaded();
    const src = `/test-algo/js/${moduleId}.js`;
    await loadScriptOnce(src);
  }

  // ================================ TABS / UI ================================
  function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");

    if (!eventListenersAttached) {
      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const tabId = button.dataset.tab;
          switchTab(tabId);
        });
      });
      eventListenersAttached = true;
    }

    updateTabIndicator();
    // Avant le premier chargement, synchroniser coords depuis le bouton ville actif
    syncCoordsFromActiveCityButton();
    loadModule(currentTab);
  }

  function switchTab(tabId, forceReload = false) {
    if (tabId === currentTab && !forceReload) return;

    const oldTab = currentTab;
    currentTab = tabId;

    updateActiveTab();
    updateTheme(tabId);
    updateTabIndicator();
    updateTabSpecificInfo();

    if (forceReload && loadedModules.has(tabId)) {
      loadedModules.delete(tabId);
    }

    loadModule(tabId);
    console.log(
      `Basculement: ${oldTab} → ${tabId}${forceReload ? " (rechargé)" : ""}`
    );
  }

  function updateActiveTab() {
    const tabButtons = document.querySelectorAll(".tab-button");
    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === currentTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive);
    });
  }

  function updateTheme(tabId) {
    const body = document.body;
    Object.values(CONFIG.themes).forEach((theme) =>
      body.classList.remove(theme)
    );

    const newTheme = CONFIG.themes[tabId] || CONFIG.themes.temp;
    body.classList.add(newTheme);

    const themeColors = {
      temp: { accent: "#f97316", light: "#ffedd5", dark: "#ea580c" },
      apparent: { accent: "#f59e0b", light: "#fef3c7", dark: "#d97706" },
      humidite: { accent: "#3b82f6", light: "#dbeafe", dark: "#2563eb" },
      wmo: { accent: "#8b5cf6", light: "#ede9fe", dark: "#7c3aed" },
      precipitation: { accent: "#3b82f6", light: "#dbeafe", dark: "#1e40af" },
      wind_force: { accent: "#10b981", light: "#d1fae5", dark: "#059669" },
      wind_gust: { accent: "#f59e0b", light: "#fef3c7", dark: "#d97706" },
      wind_direction: { accent: "#8b5cf6", light: "#ede9fe", dark: "#7c3aed" },
      methodo: { accent: "#06b6d4", light: "#cffafe", dark: "#0891b2" },
    };
    const colors = themeColors[tabId] || themeColors.temp;
    document.documentElement.style.setProperty("--accent", colors.accent);
    document.documentElement.style.setProperty("--accent-light", colors.light);
    document.documentElement.style.setProperty("--accent-dark", colors.dark);
  }

  function updateTabIndicator() {
    const activeButton = document.querySelector(".tab-button.active");
    const indicator = document.querySelector(".tab-indicator");
    if (activeButton && indicator) {
      const rect = activeButton.getBoundingClientRect();
      const containerRect = activeButton.parentElement.getBoundingClientRect();
      indicator.style.width = `${rect.width}px`;
      indicator.style.left = `${rect.left - containerRect.left}px`;
    }
  }

  // =============================== MODULE LOADER ==============================
  async function loadModule(moduleId) {
    const contentArea = document.getElementById("content");
    try {
      await ensureCommonLoaded();
      if (
        window.TestAlgoCommon &&
        typeof window.TestAlgoCommon.injectSpinner === "function"
      ) {
        window.TestAlgoCommon.injectSpinner(contentArea);
      } else {
        contentArea.innerHTML =
          '<div class="loading-spinner"><div class="spinner"></div><p>Chargement...</p></div>';
      }

      if (loadedModules.has(moduleId)) {
        const cachedContent = loadedModules.get(moduleId);
        await renderModule(contentArea, cachedContent, moduleId);
        return;
      }

      const modulePath = `/test-algo/modules/${moduleId}.html`;
      const response = await fetch(modulePath);
      if (!response.ok)
        throw new Error(`Module ${moduleId} non trouvé (${response.status})`);

      const htmlContent = await response.text();
      loadedModules.set(moduleId, htmlContent);
      await renderModule(contentArea, htmlContent, moduleId);
    } catch (error) {
      console.error(`Erreur lors du chargement du module ${moduleId}:`, error);
      const showErr =
        window.TestAlgoCommon &&
        typeof window.TestAlgoCommon.showError === "function"
          ? window.TestAlgoCommon.showError
          : (el, msg) => {
              el.innerHTML = `<div class="error-message">${msg}</div>`;
            };
      showErr(
        contentArea,
        `Impossible de charger le module "${moduleId}": ${error.message}`
      );
    }
  }

  async function renderModule(container, htmlContent, moduleId) {
    container.style.opacity = "0";
    await new Promise((resolve) => setTimeout(resolve, 150));
    container.innerHTML = htmlContent;
    container.style.opacity = "1";

    try {
      await ensureModuleLoaded(moduleId);
      const api = window.TestAlgoModules && window.TestAlgoModules[moduleId];
      if (api && typeof api.init === "function") {
        await api.init(CONFIG);
      }
    } catch (e) {
      console.error("Init module échouée:", e);
      showModuleError(moduleId, e.message || "Erreur d'initialisation");
    }
  }

  function showModuleError(moduleType, message) {
    const contentArea = document.getElementById("content");
    const showErr =
      window.TestAlgoCommon &&
      typeof window.TestAlgoCommon.showError === "function"
        ? window.TestAlgoCommon.showError
        : (el, msg) => {
            el.innerHTML = `<div class="error-message">${msg}</div>`;
          };
    showErr(contentArea, `Erreur dans le module ${moduleType}: ${message}`);
  }

  // ============================= CITY SELECTOR + MAP =============================
  function initCitySelector() {
    const cityButtons = document.querySelectorAll(".city-btn");
    const toggleMapBtn = document.getElementById("toggle-map-btn");
    const mapWrapper = document.getElementById("osm-map-wrapper");
    let mapInstance = null;
    let selectionMarker = null; // marqueur persistant de la sélection

    cityButtons.forEach((button) => {
      // Ignorer le bouton "+" (pas de dataset lat/lon)
      if (!button.dataset || !button.dataset.lat || !button.dataset.lon) {
        return;
      }

      button.addEventListener("click", () => {
        // Supprimer la classe active de tous les boutons
        cityButtons.forEach((btn) => btn.classList.remove("active"));
        // Ajouter la classe active au bouton cliqué
        button.classList.add("active");

        // Extraire les nouvelles coordonnées
        const lat = parseFloat(button.dataset.lat);
        const lon = parseFloat(button.dataset.lon);
        const label = button.dataset.label;
        const coords = button.dataset.coords;

        // Mettre à jour la configuration
        CONFIG.coords.lat = lat;
        CONFIG.coords.lon = lon;

        // Mettre à jour le label de localisation
        const locationElement = document.getElementById("current-location");
        if (locationElement) {
          locationElement.textContent = `📍 ${label} (${coords})`;
        }

        // Recharger les données pour la nouvelle localisation
        if (currentTab && loadedModules.has(currentTab)) {
          switchTab(currentTab, true);
        }

        // Fermer la carte si elle est ouverte
        if (mapWrapper && mapWrapper.style.display !== "none") {
          mapWrapper.style.display = "none";
        }
      });
    });

    if (toggleMapBtn && mapWrapper) {
      toggleMapBtn.addEventListener("click", () => {
        const wasHidden =
          mapWrapper.style.display === "none" ||
          mapWrapper.style.display === "";
        // Toujours afficher (pas de toggle hide)
        mapWrapper.style.display = "block";

        if (wasHidden) {
          // Initialiser la carte si besoin
          if (!mapInstance && window.L) {
            mapInstance = window.L.map("osm-map").setView([46.6, 2.2], 5);
            window.L.tileLayer(
              "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
              {
                attribution: "&copy; OpenStreetMap contributors",
                maxZoom: 19,
              }
            ).addTo(mapInstance);

            // Clic sur la carte → mise à jour coords + UI + reload + fermeture
            mapInstance.on("click", async (e) => {
              const { lat, lng } = e.latlng;
              CONFIG.coords.lat = parseFloat(lat.toFixed(6));
              CONFIG.coords.lon = parseFloat(lng.toFixed(6));

              // Placer/mise à jour du marqueur de sélection
              if (selectionMarker) {
                selectionMarker.setLatLng([lat, lng]);
              } else {
                selectionMarker = window.L.marker([lat, lng]).addTo(
                  mapInstance
                );
              }

              // Reverse geocoding Nominatim
              try {
                const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
                const res = await fetch(url, {
                  headers: { Accept: "application/json" },
                });
                let label = `Coordonnées`;
                let coordsLabel = `${Math.abs(CONFIG.coords.lat).toFixed(4)}°${
                  CONFIG.coords.lat >= 0 ? "N" : "S"
                }, ${Math.abs(CONFIG.coords.lon).toFixed(4)}°${
                  CONFIG.coords.lon >= 0 ? "E" : "W"
                }`;
                if (res.ok) {
                  const geo = await res.json();
                  const city =
                    geo.address?.city ||
                    geo.address?.town ||
                    geo.address?.village ||
                    geo.address?.hamlet ||
                    geo.name ||
                    "Lieu";
                  const region =
                    geo.address?.state || geo.address?.county || "";
                  label = `${city}${region ? ", " + region : ""}`;
                  const ew = CONFIG.coords.lon >= 0 ? "E" : "W";
                  const ns = CONFIG.coords.lat >= 0 ? "N" : "S";
                  coordsLabel = `${Math.abs(CONFIG.coords.lat).toFixed(
                    4
                  )}°${ns}, ${Math.abs(CONFIG.coords.lon).toFixed(4)}°${ew}`;
                }
                const locationElement =
                  document.getElementById("current-location");
                if (locationElement) {
                  locationElement.textContent = `📍 ${label} (${coordsLabel})`;
                }
              } catch (err) {
                console.warn("Reverse geocoding failed", err);
              }

              if (currentTab) switchTab(currentTab, true);
              mapWrapper.style.display = "none"; // fermeture auto après sélection
            });

            // Bouton reset France
            const resetBtn = document.getElementById("osm-reset-btn");
            if (resetBtn) {
              resetBtn.addEventListener("click", () => {
                if (mapInstance) mapInstance.setView([46.6, 2.2], 5);
              });
            }
          }
        }

        // Si un marqueur existe, recadrer dessus à la réouverture
        if (mapInstance && selectionMarker) {
          const pos = selectionMarker.getLatLng();
          mapInstance.setView(pos, Math.max(mapInstance.getZoom(), 8));
        } else if (
          mapInstance &&
          !selectionMarker &&
          typeof CONFIG.coords.lat === "number" &&
          typeof CONFIG.coords.lon === "number" &&
          !Number.isNaN(CONFIG.coords.lat) &&
          !Number.isNaN(CONFIG.coords.lon)
        ) {
          selectionMarker = window.L.marker([
            CONFIG.coords.lat,
            CONFIG.coords.lon,
          ]).addTo(mapInstance);
          mapInstance.setView(
            [CONFIG.coords.lat, CONFIG.coords.lon],
            Math.max(mapInstance.getZoom(), 8)
          );
        }

        // Fix Leaflet redraw
        setTimeout(() => {
          if (mapInstance) mapInstance.invalidateSize();
        }, 50);
      });
    }

    console.log("🌍 Sélecteur de ville initialisé");
  }

  function syncCoordsFromActiveCityButton() {
    const activeBtn = document.querySelector(".city-buttons .city-btn.active");
    if (!activeBtn) return;
    const lat = parseFloat(activeBtn.getAttribute("data-lat"));
    const lon = parseFloat(activeBtn.getAttribute("data-lon"));
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      CONFIG.coords.lat = lat;
      CONFIG.coords.lon = lon;
    }
  }

  // ================================ FOOTER / INFO ================================
  function updateTabSpecificInfo() {
    const modelInfo = {
      temp: { count: 10, desc: "modèles haute résolution" },
      apparent: { count: 10, desc: "modèles haute résolution" },
      humidite: { count: 9, desc: "modèles spécialisés humidité" },
      wmo: { count: 13, desc: "modèles conditions météo" },
      wind_force: { count: 10, desc: "modèles vent" },
      wind_gust: { count: 10, desc: "modèles rafales" },
      wind_direction: { count: 10, desc: "modèles direction" },
      precipitation: { count: 11, desc: "modèles précipitations" },
      final_params: { count: "Tous", desc: "paramètres finaux core" },
      methodo: { count: "9-13", desc: "modèles selon paramètre" },
    };
    const currentInfo = modelInfo[currentTab] || modelInfo.methodo;
    const modelCountElements = document.querySelectorAll(".model-count");
    modelCountElements.forEach((element) => {
      element.textContent = `${currentInfo.count} ${currentInfo.desc}`;
    });
  }

  // ================================= HOUSEKEEPING ================================
  function handleResize() {
    updateTabIndicator();
  }

  function cleanup() {
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
    eventListenersAttached = false;

    // Nettoyer les graphiques Chart.js éventuels
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((canvas) => {
      if (canvas.chart) {
        canvas.chart.destroy();
        canvas.chart = null;
      }
    });
  }

  // ============================= INIT APPLICATION =============================
  function initializeApp() {
    initTabs();
    initCitySelector();
    if (!resizeHandler) {
      resizeHandler = handleResize;
      window.addEventListener("resize", resizeHandler);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    initializeApp();
  }

  // ======================= WMO AGRÉGÉ: WRAPPERS → wmo.js =======================
  function initializeAggregatedWmoTable() {
    if (
      window.TestAlgoModules &&
      window.TestAlgoModules.wmo &&
      typeof window.TestAlgoModules.wmo.initializeAggregatedWmoTable ===
        "function"
    ) {
      window.TestAlgoModules.wmo.initializeAggregatedWmoTable(CONFIG);
    } else {
      console.warn("initializeAggregatedWmoTable: API wmo non chargée");
    }
  }

  async function loadAggregatedWmoData() {
    if (
      window.TestAlgoModules &&
      window.TestAlgoModules.wmo &&
      typeof window.TestAlgoModules.wmo.loadAggregatedWmoData === "function"
    ) {
      return window.TestAlgoModules.wmo.loadAggregatedWmoData(CONFIG);
    }
    console.warn("loadAggregatedWmoData: API wmo non chargée");
    return null;
  }

  function clearAggregatedLogs() {
    if (
      window.TestAlgoModules &&
      window.TestAlgoModules.wmo &&
      typeof window.TestAlgoModules.wmo.clearAggregatedLogs === "function"
    ) {
      return window.TestAlgoModules.wmo.clearAggregatedLogs();
    }
    console.warn("clearAggregatedLogs: API wmo non chargée");
  }

  // ================================ EXPORT GLOBAL ===============================
  window.TestAlgoApp = {
    switchTab,
    loadModule,
    CONFIG,
    cleanup,
    initializeApp,
    // WMO agrégé
    initializeAggregatedWmoTable,
    loadAggregatedWmoData,
    clearAggregatedLogs,
  };

  window.TestAlgoConfig = CONFIG;
})();
