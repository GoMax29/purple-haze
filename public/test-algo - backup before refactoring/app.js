/**
 * Application principale - Gestion des onglets et chargement dynamique
 * Architecture: JavaScript Vanilla moderne
 */

// Protection contre le double chargement avec IIFE
(function () {
  "use strict";

  // Vérification si déjà initialisé - réinitialiser si nécessaire
  if (typeof window.TestAlgoConfig !== "undefined") {
    console.log("app.js déjà chargé, réinitialisation...");
    // Nettoyer les event listeners existants
    if (window.TestAlgoApp && window.TestAlgoApp.cleanup) {
      window.TestAlgoApp.cleanup();
    }
  }

  const CONFIG = {
    coords: {
      lat: 47.8322,
      lon: -4.2967,
    },
    themes: {
      temp: "theme-temp",
      apparent: "theme-apparent",
      humidite: "theme-humidite",
      wmo: "theme-wmo",
      methodo: "theme-methodo",
    },
    endpoints: {
      temp: "/api/test-param/temperature",
      apparent: "/api/test-param/apparent-temperature",
      humidite: "/api/test-param/humidite",
      wmo: "/api/test-param/wmo",
    },
  };

  // État de l'application
  let currentTab = "temp";
  let loadedModules = new Map();
  let eventListenersAttached = false;
  let resizeHandler = null;

  /**
   * HELPERS GÉNÉRIQUES
   */

  // Formatage des heures
  function formatHour(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`;
  }

  // Injection du spinner de chargement
  function injectSpinner(target) {
    target.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Chargement des données...</p>
        </div>
    `;
  }

  // Nettoyage du container
  function clearContainer(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  // Affichage d'erreur
  function showError(target, message) {
    target.innerHTML = `
        <div class="alert alert--danger">
            <div class="alert-icon">⚠️</div>
            <div>
                <strong>Erreur de chargement</strong>
                <p>${message}</p>
            </div>
        </div>
    `;
  }

  /**
   * SYSTÈME DE NAVIGATION DES ONGLETS
   */

  // Initialisation des onglets
  function initTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabIndicator = document.querySelector(".tab-indicator");

    // Éviter les double event listeners
    if (!eventListenersAttached) {
      // Gestion des clics
      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const tabId = button.dataset.tab;
          switchTab(tabId);
        });
      });
      eventListenersAttached = true;
    }

    // Position initiale de l'indicateur
    updateTabIndicator();

    // Chargement du premier onglet
    loadModule(currentTab);
  }

  // Basculement d'onglet
  function switchTab(tabId, forceReload = false) {
    if (tabId === currentTab && !forceReload) return;

    // Mise à jour de l'état
    const oldTab = currentTab;
    currentTab = tabId;

    // Mise à jour UI
    updateActiveTab();
    updateTheme(tabId);
    updateTabIndicator();

    // Mettre à jour les informations sur les modèles
    updateTabSpecificInfo();

    // Si on force le rechargement, supprimer de la cache
    if (forceReload && loadedModules.has(tabId)) {
      loadedModules.delete(tabId);
      console.log(`🔄 Cache effacé pour ${tabId}`);
    }

    // Chargement du contenu
    loadModule(tabId);

    console.log(
      `Basculement: ${oldTab} → ${tabId}${forceReload ? " (rechargé)" : ""}`
    );
  }

  // Mise à jour de l'onglet actif
  function updateActiveTab() {
    const tabButtons = document.querySelectorAll(".tab-button");

    tabButtons.forEach((button) => {
      const isActive = button.dataset.tab === currentTab;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-selected", isActive);
    });
  }

  // Mise à jour du thème
  function updateTheme(tabId) {
    const body = document.body;

    // Suppression des anciens thèmes
    Object.values(CONFIG.themes).forEach((theme) => {
      body.classList.remove(theme);
    });

    // Application du nouveau thème
    const newTheme = CONFIG.themes[tabId] || CONFIG.themes.temp;
    body.classList.add(newTheme);

    // Mise à jour des variables CSS
    const themeColors = {
      temp: { accent: "#f97316", light: "#ffedd5", dark: "#ea580c" },
      apparent: { accent: "#f59e0b", light: "#fef3c7", dark: "#d97706" },
      humidite: { accent: "#3b82f6", light: "#dbeafe", dark: "#2563eb" },
      wmo: { accent: "#8b5cf6", light: "#ede9fe", dark: "#7c3aed" },
      methodo: { accent: "#06b6d4", light: "#cffafe", dark: "#0891b2" },
    };

    const colors = themeColors[tabId] || themeColors.temp;
    document.documentElement.style.setProperty("--accent", colors.accent);
    document.documentElement.style.setProperty("--accent-light", colors.light);
    document.documentElement.style.setProperty("--accent-dark", colors.dark);
  }

  // Mise à jour de l'indicateur d'onglet
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

  /**
   * SYSTÈME DE CHARGEMENT DES MODULES
   */

  // Chargement d'un module
  async function loadModule(moduleId) {
    const contentArea = document.getElementById("content");

    try {
      // Affichage du spinner
      injectSpinner(contentArea);

      // Vérification du cache
      if (loadedModules.has(moduleId)) {
        const cachedContent = loadedModules.get(moduleId);
        await renderModule(contentArea, cachedContent, moduleId);
        return;
      }

      // Chargement du HTML du module
      const modulePath = `/test-algo/modules/${moduleId}.html`;
      const response = await fetch(modulePath);

      if (!response.ok) {
        throw new Error(`Module ${moduleId} non trouvé (${response.status})`);
      }

      const htmlContent = await response.text();

      // Mise en cache
      loadedModules.set(moduleId, htmlContent);

      // Rendu
      await renderModule(contentArea, htmlContent, moduleId);
    } catch (error) {
      console.error(`Erreur lors du chargement du module ${moduleId}:`, error);
      showError(
        contentArea,
        `Impossible de charger le module "${moduleId}": ${error.message}`
      );
    }
  }

  // Rendu d'un module
  async function renderModule(container, htmlContent, moduleId) {
    // Animation de sortie
    container.style.opacity = "0";

    await new Promise((resolve) => setTimeout(resolve, 150));

    // Injection du contenu
    container.innerHTML = htmlContent;

    // Animation d'entrée
    container.style.opacity = "1";

    // Initialisation spécifique au module
    await initializeModule(moduleId);
  }

  // Initialisation spécifique par module
  async function initializeModule(moduleId) {
    switch (moduleId) {
      case "temp":
        await initTemperatureModule();
        break;
      case "apparent":
        await initApparentTemperatureModule();
        break;
      case "humidite":
        await initHumiditeModule();
        break;
      case "wmo":
        await initWmoModule();
        break;
      case "methodo":
        await initMethodoModule();
        break;
      default:
        console.warn(`Module ${moduleId} non reconnu`);
    }
  }

  /**
   * MODULES SPÉCIFIQUES - CHARGEMENT DES DONNÉES
   */

  // Module Température
  async function initTemperatureModule() {
    try {
      await fetchAndRenderTemperature();
    } catch (error) {
      console.error("Erreur module température:", error);
      showModuleError("temperature", error.message);
    }
  }

  async function fetchAndRenderTemperature() {
    const url = `${CONFIG.endpoints.temp}?lat=${CONFIG.coords.lat}&lon=${CONFIG.coords.lon}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Erreur lors du traitement");
    }

    renderTemperatureData(result.data);
  }

  function renderTemperatureData(data) {
    // Mise à jour des statistiques
    const statsElement = document.getElementById("temp-stats");
    if (statsElement) {
      statsElement.innerHTML = `
            <div class="stat-card">
                <div class="stat-value">${data.length}</div>
                <div class="stat-label">Points de données</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${Math.round(
                  data.reduce((sum, item) => sum + item.value, 0) / data.length
                )}°C</div>
                <div class="stat-label">Température moyenne</div>
            </div>
        `;
    }

    // Rendu du graphique
    renderTemperatureChart(data);

    // Rendu du tableau
    renderTemperatureTable(data);
  }

  function renderTemperatureChart(data) {
    const canvas = document.getElementById("temperature-chart");
    if (!canvas) return;

    // Destruction du graphique existant
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");

    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((item) => formatHour(item.datetime)),
        datasets: [
          {
            label: "Température (°C)",
            data: data.map((item) => item.value),
            borderColor: "rgb(249, 115, 22)",
            backgroundColor: "rgba(249, 115, 22, 0.1)",
            borderWidth: 2,
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Évolution de la Température - 7 jours",
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Température (°C)",
            },
          },
        },
      },
    });
  }

  function renderTemperatureTable(data) {
    const tableElement = document.getElementById("temperature-table");
    if (!tableElement || !data || data.length === 0) return;

    // Filtrer les données (toutes les 6h)
    const filteredData = data
      .filter((_, index) => index % 6 === 0)
      .slice(0, 28);

    // Créer un tableau horizontal avec scroll
    const tableHTML = `
      <div class="horizontal-table-container">
        <table class="horizontal-data-table">
            <thead>
                <tr>
              <th class="sticky-header">Paramètre</th>
                ${filteredData
                  .map((item) => {
                    const date = new Date(item.datetime);
                    const dayName = date.toLocaleDateString("fr-FR", {
                      weekday: "short",
                    });
                    const timeStr = formatHour(item.datetime);
                    return `<th>${dayName}<br/><small>${timeStr}</small></th>`;
                  })
                  .join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="sticky-header"><strong>Température (°C)</strong></td>
              ${filteredData
                .map(
                  (item) =>
                    `<td><span class="temp-value">${item.value}°C</span></td>`
                )
                .join("")}
            </tr>
            </tbody>
        </table>
      </div>
    `;

    tableElement.innerHTML = tableHTML;
  }

  // Module Température Apparente
  async function initApparentTemperatureModule() {
    try {
      await fetchAndRenderApparentTemperature();
    } catch (error) {
      console.error("Erreur module température apparente:", error);
      showModuleError("apparent-temperature", error.message);
    }
  }

  async function fetchAndRenderApparentTemperature() {
    const url = `${CONFIG.endpoints.apparent}?lat=${CONFIG.coords.lat}&lon=${CONFIG.coords.lon}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Erreur lors du traitement");
    }

    renderApparentTemperatureData(result.data);
  }

  function renderApparentTemperatureData(data) {
    console.log("Données température apparente:", data);

    // Mise à jour des statistiques
    const statsElement = document.getElementById("apparent-stats");
    if (statsElement && data && data.length > 0) {
      const temps = data
        .map((item) => item.value)
        .filter((val) => val !== null && val !== undefined);
      const average = temps.reduce((sum, val) => sum + val, 0) / temps.length;
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      const range = max - min;

      statsElement.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${data.length}</div>
          <div class="stat-label">Points de données</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(average * 10) / 10}°C</div>
          <div class="stat-label">Sensation moyenne</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(range * 10) / 10}°C</div>
          <div class="stat-label">Écart max/min</div>
        </div>
      `;
    }

    // Rendu du graphique
    renderApparentTemperatureChart(data);

    // Rendu du tableau
    renderApparentTemperatureTable(data);
  }

  function renderApparentTemperatureChart(data) {
    const canvas = document.getElementById("apparent-temperature-chart");
    if (!canvas || !data || data.length === 0) return;

    // Destruction du graphique existant
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");

    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((item) => formatHour(item.datetime)),
        datasets: [
          {
            label: "Température Apparente (°C)",
            data: data.map((item) => item.value),
            borderColor: "rgb(251, 146, 60)", // Orange amber
            backgroundColor: "rgba(251, 146, 60, 0.1)",
            borderWidth: 2,
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Évolution de la Sensation Thermique - 7 jours",
          },
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Température Apparente (°C)",
            },
          },
        },
      },
    });
  }

  function renderApparentTemperatureTable(data) {
    const tableElement = document.getElementById("apparent-temperature-table");
    if (!tableElement || !data || data.length === 0) return;

    // Filtrer les données (toutes les 6h)
    const filteredData = data
      .filter((_, index) => index % 6 === 0)
      .slice(0, 28);

    // Créer un tableau horizontal avec scroll
    const tableHTML = `
      <div class="horizontal-table-container">
        <table class="horizontal-data-table">
          <thead>
            <tr>
              <th class="sticky-header">Paramètre</th>
              ${filteredData
                .map((item) => {
                  const date = new Date(item.datetime);
                  const dayName = date.toLocaleDateString("fr-FR", {
                    weekday: "short",
                  });
                  const timeStr = formatHour(item.datetime);
                  return `<th>${dayName}<br/><small>${timeStr}</small></th>`;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="sticky-header"><strong>Sensation (°C)</strong></td>
              ${filteredData
                .map(
                  (item) =>
                    `<td><span class="temp-value">${item.value}°C</span></td>`
                )
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    tableElement.innerHTML = tableHTML;
  }

  // Module Humidité
  async function initHumiditeModule() {
    try {
      await fetchAndRenderHumidite();
    } catch (error) {
      console.error("Erreur module humidité:", error);
      showModuleError("humidite", error.message);
    }
  }

  // Module WMO
  async function initWmoModule() {
    try {
      await fetchAndRenderWmo();
    } catch (error) {
      console.error("Erreur module WMO:", error);
      showModuleError("wmo", error.message);
    }
  }

  async function fetchAndRenderHumidite() {
    const url = `${CONFIG.endpoints.humidite}?lat=${CONFIG.coords.lat}&lon=${CONFIG.coords.lon}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Erreur lors du traitement");
    }

    renderHumiditeData(result.data);
  }

  function renderHumiditeData(data) {
    console.log("Données humidité:", data);

    // Mise à jour des statistiques
    const statsElement = document.getElementById("humidity-stats");
    if (statsElement && data && data.length > 0) {
      const humidities = data
        .map((item) => item.value)
        .filter((val) => val !== null && val !== undefined);
      const average =
        humidities.reduce((sum, val) => sum + val, 0) / humidities.length;
      const min = Math.min(...humidities);
      const max = Math.max(...humidities);

      // Calcul de l'écart-type
      const variance =
        humidities.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) /
        humidities.length;
      const stdDev = Math.sqrt(variance);

      statsElement.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${data.length}</div>
          <div class="stat-label">Points de données</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(average)}%</div>
          <div class="stat-label">Humidité moyenne</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(stdDev * 10) / 10}%</div>
          <div class="stat-label">Écart-type</div>
        </div>
      `;
    }

    // Mise à jour de la jauge de confort
    updateComfortGauge(data);

    // Rendu du graphique
    renderHumidityChart(data);

    // Rendu du tableau
    renderHumidityTable(data);
  }

  function updateComfortGauge(data) {
    if (!data || data.length === 0) return;

    // Prendre la valeur la plus récente
    const currentHumidity = data[0]?.value || 0;

    // Mise à jour de la jauge
    const gaugeElement = document.getElementById("humidity-gauge");
    const humidityValueElement = document.getElementById("current-humidity");
    const humidityStatusElement = document.getElementById("humidity-status");

    if (gaugeElement && humidityValueElement && humidityStatusElement) {
      // Calcul de la position (0-100%)
      const percentage = Math.min(100, Math.max(0, currentHumidity));
      gaugeElement.style.width = `${percentage}%`;

      // Détermination du statut
      let status = "Optimal";
      let statusClass = "optimal";

      if (currentHumidity < 30) {
        status = "Sec";
        statusClass = "low";
      } else if (currentHumidity > 70) {
        status = "Humide";
        statusClass = "high";
      }

      humidityValueElement.textContent = `${Math.round(currentHumidity)}%`;
      humidityStatusElement.textContent = status;
      humidityStatusElement.className = `humidity-status ${statusClass}`;
    }
  }

  function renderHumidityChart(data) {
    const canvas = document.getElementById("humidity-chart");
    if (!canvas || !data || data.length === 0) return;

    // Destruction du graphique existant
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const ctx = canvas.getContext("2d");

    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((item) => formatHour(item.datetime)),
        datasets: [
          {
            label: "Humidité Relative (%)",
            data: data.map((item) => item.value),
            borderColor: "rgb(59, 130, 246)", // Bleu
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderWidth: 2,
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Évolution de l'Humidité Relative - 7 jours",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Humidité Relative (%)",
            },
          },
        },
      },
    });
  }

  function renderHumidityTable(data) {
    const tableElement = document.getElementById("humidity-table");
    if (!tableElement || !data || data.length === 0) return;

    // Filtrer les données (toutes les 6h)
    const filteredData = data
      .filter((_, index) => index % 6 === 0)
      .slice(0, 28);

    // Créer un tableau horizontal avec scroll
    const tableHTML = `
      <div class="horizontal-table-container">
        <table class="horizontal-data-table">
          <thead>
            <tr>
              <th class="sticky-header">Paramètre</th>
              ${filteredData
                .map((item) => {
                  const date = new Date(item.datetime);
                  const dayName = date.toLocaleDateString("fr-FR", {
                    weekday: "short",
                  });
                  const timeStr = formatHour(item.datetime);
                  return `<th>${dayName}<br/><small>${timeStr}</small></th>`;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="sticky-header"><strong>Humidité (%)</strong></td>
              ${filteredData
                .map((item) => {
                  const humidity = Math.round(item.value);
                  let statusClass = "humidity-optimal";
                  if (humidity < 30) statusClass = "humidity-low";
                  else if (humidity > 70) statusClass = "humidity-high";

                  return `<td><span class="humidity-value ${statusClass}">${humidity}%</span></td>`;
                })
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    tableElement.innerHTML = tableHTML;
  }

  // Module WMO
  async function initWmoModule() {
    try {
      await fetchAndRenderNewWmoMatrix();
      // Initialiser le nouveau tableau agrégé
      initializeAggregatedWmoTable();
    } catch (error) {
      console.error("Erreur module WMO:", error);
      showModuleError("wmo", error.message);
    }
  }

  async function fetchAndRenderNewWmoMatrix() {
    const matrixEl = document.getElementById("wmo-matrix");
    injectSpinner(matrixEl);

    const { lat, lon } = CONFIG.coords;
    try {
      console.log("🔥 [WMO Frontend] Début fetchAndRenderNewWmoMatrix");
      console.log("🔥 [WMO Frontend] Coords:", { lat, lon });
      console.log("🔥 [WMO Frontend] Endpoint WMO:", CONFIG.endpoints.wmo);

      // Données brutes + agrégées en parallèle
      const [rawRes, aggRes] = await Promise.all([
        fetch(`/api/fetchMeteoData?lat=${lat}&lon=${lon}`),
        fetch(`${CONFIG.endpoints.wmo}?lat=${lat}&lon=${lon}`, {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }),
      ]);

      console.log("🔥 [WMO Frontend] Statuts réponses:", {
        raw: rawRes.status,
        agg: aggRes.status,
      });

      if (!rawRes.ok || !aggRes.ok) {
        throw new Error(`HTTP ${rawRes.status}/${aggRes.status}`);
      }

      const meteoData = await rawRes.json();
      const aggResponse = await aggRes.json();

      console.log("🔥 [WMO Frontend] Réponse agrégée:", {
        success: aggResponse.success,
        algorithm: aggResponse.metadata?.algorithm,
        dataLength: aggResponse.data?.length,
        firstPoint: aggResponse.data?.[0],
      });

      const aggregated = aggResponse.data;

      // Nouvelle matrice 168h toutes les 4h (42 colonnes)
      const multiHourData = extractMultiHourWmoData(meteoData);
      renderExtendedWmoMatrix(multiHourData, aggregated);
      updateExtendedWmoStats(multiHourData);
    } catch (err) {
      console.error("Erreur WMO:", err);
      if (matrixEl)
        matrixEl.innerHTML = `<div class="error-message">❌ ${err.message}</div>`;
    }
  }

  /* ---------------------- NOUVELLE MATRICE WMO SIMPLIFIÉE H0 ---------------------- */

  // Configuration des modèles avec couleurs et noms courts (2 caractères)
  const MODEL_CONFIG = {
    meteofrance_arome_france: { color: "#3498DB", shortCode: "A" },
    meteofrance_arome_france_hd: { color: "#A3C6FF", shortCode: "A+" },
    meteofrance_arpege_europe: { color: "#BBDEFB", shortCode: "Ar" },
    icon_eu: { color: "#FFFF6B", shortCode: "IE" },
    icon_global: { color: "#F39C12", shortCode: "IG" },
    ukmo_global_deterministic_10km: { color: "#58D68D", shortCode: "UG" },
    ukmo_uk_deterministic_2km: { color: "#A3E4D7", shortCode: "U2" },
    gfs_graphcast025: { color: "#FF7E79", shortCode: "Gr" },
    gfs_global: { color: "#FFB3AB", shortCode: "Gf" },
    ecmwf_ifs025: { color: "#b17652", shortCode: "EW" },
    knmi_harmonie_arome_europe: { color: "#CE93D8", shortCode: "Ha" },
  };

  // Groupes WMO (par sévérité décroissante)
  const WMO_SEVERITY_GROUPS = [
    {
      name: "Orage avec grêle",
      codes: [96, 99],
      bgColor: "#7E57C2",
      severity: 8,
    },
    { name: "Orage", codes: [95], bgColor: "#9575CD", severity: 7 },
    {
      name: "Neige",
      codes: [71, 72, 73, 74, 75, 76, 77, 85, 86],
      bgColor: "#E1F5FE",
      severity: 6,
    },
    {
      name: "Averses de pluie",
      codes: [80, 81, 82],
      bgColor: "#2196F3",
      severity: 5,
    },
    {
      name: "Pluie verglaçante",
      codes: [56, 57, 66, 67],
      bgColor: "#4FC3F7",
      severity: 4,
    },
    {
      name: "Pluie/Bruine",
      codes: [51, 52, 53, 54, 55, 61, 62, 63, 64, 65],
      bgColor: "#64B5F6",
      severity: 3,
    },
    { name: "Brouillard", codes: [45, 48], bgColor: "#CFD8DC", severity: 2 },
    { name: "Couvert", codes: [1, 2, 3], bgColor: "#B0BEC5", severity: 1 },
    { name: "Ciel clair", codes: [0], bgColor: "#FFF176", severity: 0 },
  ];

  // Obtenir l'heure de départ arrondie à la tranche 4h inférieure
  function getStartHourRounded() {
    const now = new Date();
    const currentHour = now.getHours();

    // Arrondir à la tranche 4h inférieure
    const roundedHour = Math.floor(currentHour / 4) * 4;

    const startTime = new Date(now);
    startTime.setHours(roundedHour, 0, 0, 0);

    console.log(
      `Heure actuelle: ${now.getHours()}h → Départ arrondi: ${roundedHour}h`
    );
    return startTime;
  }

  // Générer les timestamps pour 42 colonnes (toutes les 4h sur 168h)
  function generateTimeStamps() {
    const startTime = getStartHourRounded();
    const timestamps = [];

    for (let i = 0; i < 42; i++) {
      const timestamp = new Date(startTime);
      timestamp.setHours(startTime.getHours() + i * 4);
      timestamps.push(timestamp);
    }

    return timestamps;
  }

  // Formater les en-têtes de colonnes
  function formatColumnHeader(date) {
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");

    return `${dayName} ${day}/${month} - ${hour}h`;
  }

  function extractMultiHourWmoData(meteoData) {
    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo invalides");
    }

    const hourlyData = meteoData.api1.data.hourly;
    const models = meteoData.api1.models;
    const timestamps = hourlyData.time;

    console.log("Extraction des données WMO 168h (toutes les 4h)...");
    console.log("Modèles disponibles:", models);

    // Générer les échéances souhaitées
    const targetTimestamps = generateTimeStamps();
    const multiHourData = [];

    targetTimestamps.forEach((targetTime, columnIndex) => {
      const targetISOString = targetTime.toISOString();

      // Trouver l'index correspondant dans les données horaires
      let foundIndex = -1;
      for (let i = 0; i < timestamps.length; i++) {
        const dataTime = new Date(timestamps[i]);
        if (Math.abs(dataTime.getTime() - targetTime.getTime()) < 3600000) {
          // Tolérance 1h
          foundIndex = i;
          break;
        }
      }

      const columnData = {
        datetime: targetISOString,
        columnIndex: columnIndex,
        models: {},
      };

      if (foundIndex !== -1) {
        // Extraire les codes WMO pour tous les modèles à cette échéance
        models.forEach((modelKey) => {
          const wmoParameterKey = `weather_code_${modelKey}`;

          if (
            hourlyData[wmoParameterKey] &&
            hourlyData[wmoParameterKey][foundIndex] !== null
          ) {
            const wmoCode = hourlyData[wmoParameterKey][foundIndex];
            columnData.models[modelKey] = wmoCode;
          }
        });
      }

      multiHourData.push(columnData);
    });

    console.log(
      "Données multi-heures extraites:",
      multiHourData.length,
      "colonnes"
    );
    return multiHourData;
  }

  function extractH0WmoData(meteoData) {
    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo invalides");
    }

    const hourlyData = meteoData.api1.data.hourly;
    const models = meteoData.api1.models;
    const h0Data = {};

    console.log("Extraction des données H0 WMO...");
    console.log("Modèles disponibles:", models);

    // Extraire les codes WMO à H0 pour chaque modèle
    models.forEach((modelKey) => {
      const wmoParameterKey = `weather_code_${modelKey}`;

      if (
        hourlyData[wmoParameterKey] &&
        hourlyData[wmoParameterKey][0] !== null
      ) {
        const wmoCode = hourlyData[wmoParameterKey][0];
        h0Data[modelKey] = wmoCode;
      }
    });

    console.log("Données H0 extraites:", h0Data);
    return h0Data;
  }

  function groupMultiHourDataBySeverity(multiHourData) {
    // Structure: [groupIndex][columnIndex] = { codesByCode: { wmoCode: [modelKey...] } }
    const groupedData = [];

    // Initialiser tous les groupes pour toutes les colonnes
    WMO_SEVERITY_GROUPS.forEach((group, groupIndex) => {
      groupedData[groupIndex] = [];

      multiHourData.forEach((columnData, columnIndex) => {
        groupedData[groupIndex][columnIndex] = {
          groupInfo: group,
          columnIndex: columnIndex,
          datetime: columnData.datetime,
          codesByCode: {}, // { codeWMO: [modelKey1, modelKey2, ...] }
        };
      });
    });

    // Classer chaque modèle dans le bon groupe pour chaque colonne
    multiHourData.forEach((columnData, columnIndex) => {
      Object.entries(columnData.models).forEach(([modelKey, wmoCode]) => {
        const groupIndex = WMO_SEVERITY_GROUPS.findIndex((group) =>
          group.codes.includes(wmoCode)
        );

        if (groupIndex !== -1) {
          if (!groupedData[groupIndex][columnIndex].codesByCode[wmoCode]) {
            groupedData[groupIndex][columnIndex].codesByCode[wmoCode] = [];
          }
          groupedData[groupIndex][columnIndex].codesByCode[wmoCode].push(
            modelKey
          );
        }
      });
    });

    return groupedData;
  }

  function groupH0DataBySeverity(h0Data) {
    const groupedData = {};

    // Initialiser tous les groupes
    WMO_SEVERITY_GROUPS.forEach((group, index) => {
      groupedData[index] = {
        groupInfo: group,
        codesByCode: {}, // { codeWMO: [modelKey1, modelKey2, ...] }
      };
    });

    // Classer chaque modèle dans le bon groupe
    Object.entries(h0Data).forEach(([modelKey, wmoCode]) => {
      const groupIndex = WMO_SEVERITY_GROUPS.findIndex((group) =>
        group.codes.includes(wmoCode)
      );

      if (groupIndex !== -1) {
        if (!groupedData[groupIndex].codesByCode[wmoCode]) {
          groupedData[groupIndex].codesByCode[wmoCode] = [];
        }
        groupedData[groupIndex].codesByCode[wmoCode].push(modelKey);
      }
    });

    return groupedData;
  }

  function renderExtendedWmoMatrix(multiHourData, aggregated) {
    const matrixEl = document.getElementById("wmo-matrix");
    if (!matrixEl) return;

    const groupedData = groupMultiHourDataBySeverity(multiHourData);
    console.log("Données groupées par sévérité (168h):", groupedData);

    // Générer les en-têtes de colonnes
    const timestamps = generateTimeStamps();
    const columnHeaders = timestamps.map(formatColumnHeader);

    const tableHTML = `
      <div class="extended-wmo-container">
        <table class="extended-wmo-table">
          <thead>
            <tr>
              <th class="group-header-extended">Conditions Météo (par sévérité)</th>
              ${columnHeaders
                .map(
                  (header) => `<th class="time-header-extended">${header}</th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${WMO_SEVERITY_GROUPS.map((group, groupIndex) =>
              renderExtendedWmoGroupRow(group, groupedData[groupIndex])
            ).join("")}
            ${renderExtendedAggregatedRow(aggregated, timestamps.length)}
          </tbody>
        </table>
      </div>
    `;

    matrixEl.innerHTML = tableHTML;
  }

  function renderExtendedWmoGroupRow(group, groupColumns) {
    // Créer la liste des codes WMO du groupe
    const codesList = group.codes.map((code) => `[${code}]`).join(" ");

    const columnCells = groupColumns
      .map((columnData) => {
        const hasData = Object.keys(columnData.codesByCode).length > 0;
        return `
        <td class="wmo-panels-cell-extended">
          ${
            hasData
              ? renderWmoPanels(columnData.codesByCode, group.bgColor)
              : '<div class="no-data-mini">-</div>'
          }
        </td>
      `;
      })
      .join("");

    return `
      <tr class="wmo-group-row" style="background-color: ${group.bgColor};">
        <td class="group-name-cell-extended">
          <strong>${group.name}</strong>
          <small>Codes WMO : ${codesList}</small>
        </td>
        ${columnCells}
      </tr>
    `;
  }

  function renderExtendedAggregatedRow(aggregated, columnCount) {
    if (!aggregated || aggregated.length === 0) {
      const emptyCells = Array(columnCount)
        .fill(
          '<td class="wmo-panels-cell-extended"><div class="no-data-mini">-</div></td>'
        )
        .join("");
      return `
        <tr class="wmo-aggregated-row">
          <td class="group-name-cell-extended"><strong>Résultat Agrégé</strong></td>
          ${emptyCells}
        </tr>
        ${renderDebugAggregationRow([], columnCount)}
      `;
    }

    // Filtrer les données agrégées toutes les 4h
    const aggregatedFiltered = [];
    const debugInfo = [];
    const startTime = getStartHourRounded();

    // Calculer l'offset entre l'heure de départ de la matrice et minuit (00h)
    // Les données agrégées commencent toujours à 00h (index 0 = H+0 depuis minuit)
    const startHour = startTime.getHours();
    console.debug(
      `[Offset Calc] Heure de départ matrice: ${startHour}h, offset depuis minuit: ${startHour}h`
    );

    // Helper pour formater une date en YYYY-MM-DDTHH (heure locale ajustée à 00 minutes)
    function formatDateKey(dateObj) {
      // Utilise l'ISO string UTC puis tronque à AAAA-MM-DDTHH
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const d = String(dateObj.getDate()).padStart(2, "0");
      const h = String(dateObj.getHours()).padStart(2, "0");
      return `${y}-${m}-${d}T${h}`;
    }

    // Construire une map datetime -> objet agrégé pour lookup rapide
    const aggMap = new Map();
    aggregated.forEach((item) => {
      if (item && item.datetime) {
        const key = item.datetime.slice(0, 13);
        aggMap.set(key, item);
        console.debug(`[AggMap] Key: ${key}, Value: ${item.value}`);
      }
    });

    console.debug(`[AggMap] Total entries: ${aggMap.size}`);

    for (let i = 0; i < columnCount; i++) {
      // Calculer l'index réel dans les données agrégées
      // L'affichage matrice commence à startHour, mais les données agrégées commencent à 00h
      const matrixHourOffset = i * 4; // Heures depuis le début de la matrice (0, 4, 8, 12...)
      const realHourIndex = startHour + matrixHourOffset; // Index réel dans les données (ex: 20, 24, 28, 32...)

      // Sélectionner depuis le tableau des données agrégées (0-167)
      const aggregatedValue =
        realHourIndex < aggregated.length ? aggregated[realHourIndex] : null;

      // Debug pour voir les correspondances
      console.debug(
        `[Lookup Corrected] Colonne ${i}, Matrix H+${matrixHourOffset}, Real Index: ${realHourIndex}, Trouvé: ${
          aggregatedValue ? aggregatedValue.value : "NULL"
        }`
      );

      aggregatedFiltered.push(aggregatedValue);

      // Limiter les logs console pour ne pas noyer l'interface (mais garder toutes les données)
      const shouldLog = i <= 8 || i >= columnCount - 8;
      if (!shouldLog) {
        debugInfo.push(null);
        continue;
      }

      // Console debug pour chaque échéance
      if (aggregatedValue) {
        const hourLabel = `H+${realHourIndex}`;
        const debug = aggregatedValue.debug || {};
        const threshold = debug.threshold || "N/A";
        const selectedGroup = debug.selectedGroup || "N/A";
        const selectionType = debug.selectionType || "N/A";

        console.debug(
          `Agrégation WMO [${hourLabel}] – seuil: ${threshold}%, groupe retenu: ${selectedGroup}, code: ${aggregatedValue.value} (${selectionType})`
        );

        debugInfo.push({
          hour: hourLabel,
          threshold: threshold,
          group: selectedGroup,
          code: aggregatedValue.value,
          type: selectionType,
        });
      } else {
        console.debug(`Agrégation WMO [H+${realHourIndex}] – AUCUN RÉSULTAT`);
        debugInfo.push({
          hour: `H+${realHourIndex}`,
          threshold: "N/A",
          group: "Aucun",
          code: "N/A",
          type: "Vide",
        });
      }
    }

    const columnCells = aggregatedFiltered
      .map((aggData) => {
        if (!aggData || (aggData.value !== 0 && !aggData.value)) {
          return '<td class="wmo-panels-cell-extended"><div class="no-data-mini">-</div></td>';
        }

        const iconName = getWmoIcon(aggData.value);
        const iconSrc = `/icons/wmo/${iconName}`;
        const groupInfo = WMO_SEVERITY_GROUPS.find((g) =>
          g.codes.includes(aggData.value)
        );

        // Debug pour vérifier les icônes
        console.debug(
          `[Debug Icône] Code WMO: ${aggData.value}, Icône: ${iconName}, Chemin: ${iconSrc}`
        );

        return `
        <td class="wmo-panels-cell-extended">
          <div class="wmo-aggregated-mini" style="background-color: ${
            groupInfo?.bgColor || "#f0f0f0"
          };">
            <img src="${iconSrc}" alt="WMO ${
          aggData.value
        }" class="wmo-icon-mini" onerror="console.error('Icône non trouvée:', '${iconSrc}'); this.src='/icons/wmo/cloudy.svg';" />
            <div class="aggregated-code-badge">${aggData.value}</div>
          </div>
        </td>
      `;
      })
      .join("");

    return `
      <tr class="wmo-aggregated-row">
        <td class="group-name-cell-extended">
          <strong>Résultat Agrégé</strong>
          <small>(Algorithme sévérité)</small>
        </td>
        ${columnCells}
      </tr>
      ${renderDebugAggregationRow(debugInfo, columnCount)}
    `;
  }

  function renderDebugAggregationRow(debugInfo, columnCount) {
    const debugCells = Array(columnCount)
      .fill(0)
      .map((_, index) => {
        const info = debugInfo[index];
        if (!info) {
          return '<td class="wmo-debug-cell">-</td>';
        }

        return `
        <td class="wmo-debug-cell" title="Détails agrégation ${info.hour}">
          <div class="debug-content">
            <div class="debug-threshold">Seuil: ${info.threshold}%</div>
            <div class="debug-group">Groupe: ${info.group}</div>
            <div class="debug-code">Code: ${info.code}</div>
            <div class="debug-type">${info.type}</div>
          </div>
        </td>
      `;
      })
      .join("");

    return `
      <tr class="wmo-debug-row">
        <td class="group-name-cell-extended debug-header">
          <strong>Debug Agrégation</strong>
          <small>(Seuil, Groupe, Type)</small>
        </td>
        ${debugCells}
      </tr>
    `;
  }

  function renderSimplifiedWmoMatrix(h0Data, aggregated) {
    const matrixEl = document.getElementById("wmo-matrix");
    if (!matrixEl) return;

    const groupedData = groupH0DataBySeverity(h0Data);
    console.log("Données groupées par sévérité:", groupedData);

    // Obtenir le code agrégé pour H0
    const aggregatedH0Code =
      aggregated && aggregated[0] ? aggregated[0].value : null;

    const tableHTML = `
      <div class="simplified-wmo-container">
        <table class="simplified-wmo-table">
          <thead>
            <tr>
              <th class="group-header">Conditions Météo (par sévérité)</th>
              <th class="time-header">H0<br/><small>Maintenant</small></th>
            </tr>
          </thead>
          <tbody>
            ${WMO_SEVERITY_GROUPS.map((group, groupIndex) =>
              renderWmoGroupRow(group, groupedData[groupIndex])
            ).join("")}
            ${renderAggregatedRow(aggregatedH0Code)}
          </tbody>
        </table>
      </div>
    `;

    matrixEl.innerHTML = tableHTML;
  }

  function renderWmoGroupRow(group, groupData) {
    const hasData = Object.keys(groupData.codesByCode).length > 0;

    // Créer la liste des codes WMO du groupe
    const codesList = group.codes.map((code) => `[${code}]`).join(" ");

    return `
      <tr class="wmo-group-row" style="background-color: ${group.bgColor};">
        <td class="group-name-cell">
          <strong>${group.name}</strong>
          <small>Codes WMO : ${codesList}</small>
        </td>
        <td class="wmo-panels-cell">
          ${
            hasData
              ? renderWmoPanels(groupData.codesByCode, group.bgColor)
              : '<div class="no-data">Aucun modèle</div>'
          }
        </td>
      </tr>
    `;
  }

  function renderWmoPanels(codesByCode, groupBgColor) {
    const panels = [];

    // Trier les codes par sévérité décroissante (du plus sévère au moins sévère)
    const sortedEntries = Object.entries(codesByCode).sort((a, b) => {
      const codeA = parseInt(a[0]);
      const codeB = parseInt(b[0]);
      return codeB - codeA; // Tri décroissant
    });

    sortedEntries.forEach(([wmoCode, models]) => {
      panels.push(renderWmoPanel(parseInt(wmoCode), models, groupBgColor));
    });

    // Organiser les panels verticalement (1 par ligne)
    const panelsHTML = panels.join("");

    return `<div class="wmo-panels-vertical">${panelsHTML}</div>`;
  }

  function renderWmoPanel(wmoCode, models, groupBgColor) {
    const modelCount = models.length;
    const iconSrc = `/icons/wmo/${getWmoIcon(wmoCode)}`;
    const pastelColor = getPastelColor(groupBgColor);

    return `
      <div class="wmo-panel" style="background-color: ${pastelColor};">
        <div class="wmo-panel-header">
          <span class="wmo-code-badge">${wmoCode}</span>
        </div>
        <div class="model-count-badge">${modelCount}</div>
        <div class="model-badges">
          ${models.map((modelKey) => renderModelBadge(modelKey)).join("")}
        </div>
        <div class="wmo-panel-content">
          <img src="${iconSrc}" alt="WMO ${wmoCode}" class="wmo-panel-icon-60" />
        </div>
      </div>
    `;
  }

  function renderModelBadge(modelKey) {
    const config = MODEL_CONFIG[modelKey];
    if (!config) {
      return `<span class="model-badge unknown">?</span>`;
    }

    return `
      <span class="model-badge" style="background-color: ${
        config.color
      }; color: ${getContrastColor(config.color)};">
        ${config.shortCode}
      </span>
    `;
  }

  function renderAggregatedRow(aggregatedCode) {
    if (!aggregatedCode) {
      return `
        <tr class="wmo-aggregated-row">
          <td class="group-name-cell"><strong>Résultat Agrégé</strong></td>
          <td class="wmo-panels-cell"><div class="no-data">Données indisponibles</div></td>
        </tr>
      `;
    }

    const iconSrc = `/icons/wmo/${getWmoIcon(aggregatedCode)}`;
    const description = getWmoDescription(aggregatedCode);
    const groupInfo = WMO_SEVERITY_GROUPS.find((g) =>
      g.codes.includes(aggregatedCode)
    );

    return `
      <tr class="wmo-aggregated-row">
        <td class="group-name-cell">
          <strong>Résultat Agrégé</strong>
          <small>(Algorithme sévérité)</small>
        </td>
        <td class="wmo-panels-cell">
          <div class="wmo-aggregated-panel" style="background-color: ${
            groupInfo?.bgColor || "#f0f0f0"
          };">
            <div class="aggregated-content">
              <img src="${iconSrc}" alt="WMO ${aggregatedCode}" class="wmo-panel-icon-80" />
              <div class="aggregated-code">${aggregatedCode}</div>
              <div class="aggregated-description">${description}</div>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function updateSimplifiedWmoStats(h0Data) {
    const modelsCount = Object.keys(h0Data).length;
    const uniqueCodes = new Set(Object.values(h0Data));
    const codesCount = uniqueCodes.size;

    // Calculer la répartition par sévérité
    const severityCount = {};
    Object.values(h0Data).forEach((code) => {
      const group = WMO_SEVERITY_GROUPS.find((g) => g.codes.includes(code));
      const severity = group ? group.severity : 0;
      severityCount[severity] = (severityCount[severity] || 0) + 1;
    });

    // Mettre à jour le badge du nombre de modèles
    const badge = document.getElementById("wmo-models-count");
    if (badge) badge.textContent = `${modelsCount} modèles`;

    // Mettre à jour les statistiques de risque
    updateSimplifiedRiskStats(h0Data);
  }

  function updateSimplifiedRiskStats(h0Data) {
    const riskStatsElement = document.getElementById("wmo-risk-stats");
    if (!riskStatsElement) return;

    const codes = Object.values(h0Data);

    // Compter les risques spécifiques
    const thunderRisk = codes.filter((code) =>
      [95, 96, 99].includes(code)
    ).length;
    const hailRisk = codes.filter((code) => [96, 99].includes(code)).length;
    const iceRisk = codes.filter((code) =>
      [56, 57, 66, 67].includes(code)
    ).length;
    const fogRisk = codes.filter((code) => [45, 48].includes(code)).length;

    const totalModels = codes.length;

    riskStatsElement.innerHTML = `
      <div class="risk-card">
        <div class="risk-icon">⛈️</div>
        <div class="risk-content">
          <div class="risk-value">${thunderRisk}</div>
          <div class="risk-label">Risque Orage</div>
        </div>
      </div>
      <div class="risk-card">
        <div class="risk-icon">🧊</div>
        <div class="risk-content">
          <div class="risk-value">${hailRisk}</div>
          <div class="risk-label">Risque Grêle</div>
        </div>
      </div>
      <div class="risk-card">
        <div class="risk-icon">❄️</div>
        <div class="risk-content">
          <div class="risk-value">${iceRisk}</div>
          <div class="risk-label">Risque Verglas</div>
        </div>
      </div>
      <div class="risk-card">
        <div class="risk-icon">🌫️</div>
        <div class="risk-content">
          <div class="risk-value">${fogRisk}</div>
          <div class="risk-label">Risque Brouillard</div>
        </div>
      </div>
    `;
  }

  // Descriptions des codes WMO
  function getWmoDescription(wmoCode) {
    const descriptions = {
      0: "Ciel clair",
      1: "Principalement clair",
      2: "Partiellement nuageux",
      3: "Couvert",
      45: "Brouillard",
      48: "Brouillard givrant",
      51: "Bruine légère",
      52: "Bruine modérée",
      53: "Bruine forte",
      54: "Bruine verglaçante..",
      55: "Bruine verglaçante..",
      56: "Bruine verglaçante..",
      57: "Bruine verglaçante..",
      61: "Pluie légère",
      62: "Pluie modérée",
      63: "Pluie forte",
      64: "Pluie verglaçante..",
      65: "Pluie verglaçante..",
      66: "Pluie verglaçante..",
      67: "Pluie verglaçante..",
      71: "Neige légère",
      72: "Neige modérée",
      73: "Neige forte",
      74: "Grains de glace",
      75: "Neige légère",
      76: "Neige modérée",
      77: "Grains de neige",
      80: "Averses légères",
      81: "Averses modérées",
      82: "Averses violentes",
      85: "Averses de neige..",
      86: "Averses de neige..",
      95: "Orage",
      96: "Orage + grêle..",
      99: "Orage + grêle..",
    };

    const description = descriptions[wmoCode] || `Code WMO ${wmoCode}`;
    return description.length > 20
      ? description.substring(0, 18) + ".."
      : description;
  }

  function getPastelColor(bgColor) {
    // Convertir la couleur de fond du groupe en version pastel (plus claire)
    const colorMap = {
      "#7E57C2": "#E1BEE7", // Violet -> Violet pastel
      "#9575CD": "#C39BD3", // Violet clair -> Violet très clair
      "#E1F5FE": "#F0F8FF", // Bleu très clair -> Bleu pâle
      "#2196F3": "#BBDEFB", // Bleu -> Bleu pastel
      "#4FC3F7": "#E1F5FE", // Bleu clair -> Bleu très pâle
      "#64B5F6": "#E3F2FD", // Bleu moyen -> Bleu pâle
      "#CFD8DC": "#ECEFF1", // Gris -> Gris très clair
      "#B0BEC5": "#E0E0E0", // Gris moyen -> Gris clair
      "#FFF176": "#FFFDE7", // Jaune -> Jaune très pâle
    };

    return colorMap[bgColor] || "#F5F5F5";
  }

  function getContrastColor(hexColor) {
    // Convertir hex en RGB
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculer la luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Retourner noir ou blanc selon la luminance
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  function updateExtendedWmoStats(multiHourData) {
    // Compter les modèles actifs et les codes uniques
    const allModels = new Set();
    const allCodes = new Set();

    multiHourData.forEach((columnData) => {
      Object.entries(columnData.models).forEach(([modelKey, wmoCode]) => {
        allModels.add(modelKey);
        allCodes.add(wmoCode);
      });
    });

    const modelsCount = allModels.size;
    const codesCount = allCodes.size;

    // Mettre à jour le badge du nombre de modèles
    const badge = document.getElementById("wmo-models-count");
    if (badge) badge.textContent = `${modelsCount} modèles`;

    // Mettre à jour les statistiques de risque (basées sur toutes les échéances)
    updateExtendedRiskStats(multiHourData);
  }

  function updateExtendedRiskStats(multiHourData) {
    const riskStatsElement = document.getElementById("wmo-risk-stats");
    if (!riskStatsElement) return;

    const allCodes = [];
    multiHourData.forEach((columnData) => {
      Object.values(columnData.models).forEach((code) => {
        allCodes.push(code);
      });
    });

    // Compter les risques spécifiques sur toutes les échéances
    const thunderRisk = allCodes.filter((code) =>
      [95, 96, 99].includes(code)
    ).length;
    const hailRisk = allCodes.filter((code) => [96, 99].includes(code)).length;
    const iceRisk = allCodes.filter((code) =>
      [56, 57, 66, 67].includes(code)
    ).length;
    const fogRisk = allCodes.filter((code) => [45, 48].includes(code)).length;

    riskStatsElement.innerHTML = `
      <div class="risk-card">
        <div class="risk-icon">⛈️</div>
        <div class="risk-content">
          <div class="risk-value">${thunderRisk}</div>
          <div class="risk-label">Risque Orage</div>
        </div>
      </div>
      <div class="risk-card">
        <div class="risk-icon">🧊</div>
        <div class="risk-content">
          <div class="risk-value">${hailRisk}</div>
          <div class="risk-label">Risque Grêle</div>
        </div>
      </div>
      <div class="risk-card">
        <div class="risk-icon">❄️</div>
        <div class="risk-content">
          <div class="risk-value">${iceRisk}</div>
          <div class="risk-label">Risque Verglas</div>
        </div>
      </div>
      <div class="risk-card">
        <div class="risk-icon">🌫️</div>
        <div class="risk-content">
          <div class="risk-value">${fogRisk}</div>
          <div class="risk-label">Risque Brouillard</div>
        </div>
      </div>
    `;
  }

  function extractWmoDataByModel(meteoData) {
    // Extraire les données WMO par modèle depuis fetchMeteoData
    if (!meteoData?.api1?.data?.hourly) {
      throw new Error("Données météo invalides");
    }

    const hourlyData = meteoData.api1.data.hourly;
    const timestamps = hourlyData.time;
    const models = meteoData.api1.models;

    console.log("Modèles disponibles:", models);

    // Structure : { hourIndex: { modelKey: wmoCode, ... }, ... }
    const wmoByHourAndModel = {};

    // Pour chaque heure
    timestamps.forEach((timestamp, hourIndex) => {
      wmoByHourAndModel[hourIndex] = {
        datetime: timestamp,
        models: {},
      };

      // Pour chaque modèle configuré
      models.forEach((modelKey) => {
        const wmoParameterKey = `weather_code_${modelKey}`;

        if (
          hourlyData[wmoParameterKey] &&
          hourlyData[wmoParameterKey][hourIndex] !== null
        ) {
          const wmoCode = hourlyData[wmoParameterKey][hourIndex];
          wmoByHourAndModel[hourIndex].models[modelKey] = wmoCode;
        }
      });
    });

    console.log("Structure WMO par heure et modèle:", wmoByHourAndModel);
    return wmoByHourAndModel;
  }

  /* ---------------------- GROUPES WMO ---------------------- */
  function WMO_GROUPS() {
    return [
      {
        name: "Orage avec grêle",
        codes: [96, 99],
        bgColor: "#7E57C2",
        severity: 8,
      },
      { name: "Orage", codes: [95], bgColor: "#9575CD", severity: 7 },
      {
        name: "Neige",
        codes: [71, 72, 73, 74, 75, 76, 77, 85, 86],
        bgColor: "#E1F5FE",
        severity: 6,
      },
      {
        name: "Averses de pluie",
        codes: [80, 81, 82],
        bgColor: "#2196F3",
        severity: 5,
      },
      {
        name: "Pluie verglaçante",
        codes: [56, 57, 66, 67],
        bgColor: "#4FC3F7",
        severity: 4,
      },
      {
        name: "Pluie/Bruine",
        codes: [51, 52, 53, 54, 55, 61, 62, 63, 64, 65],
        bgColor: "#64B5F6",
        severity: 3,
      },
      { name: "Brouillard", codes: [45, 48], bgColor: "#CFD8DC", severity: 2 },
      { name: "Couvert", codes: [1, 2, 3], bgColor: "#B0BEC5", severity: 1 },
      { name: "Ciel clair", codes: [0], bgColor: "#FFF176", severity: 0 },
    ];
  }

  /* ---------------------- CONSTRUCTION MATRICE ---------------------- */
  function buildWmoMatrix(meteoData) {
    const groups = WMO_GROUPS();
    const models = meteoData.api1.models;
    const hourly = meteoData.api1.data.hourly;

    // 57 colonnes : 0h -> 168h toutes les 3h
    const cols = 57;
    const timestamps3h = [];
    const matrix = groups.map(() => Array.from({ length: cols }, () => []));

    for (let col = 0; col < cols; col++) {
      const hIdx = col * 3; // indice réel dans les tableaux horaires
      const ts = hourly.time[hIdx];
      timestamps3h.push(ts);

      models.forEach((mKey) => {
        const paramKey = `weather_code_${mKey}`;
        const arr = hourly[paramKey];
        if (!arr) return;
        const code = arr[hIdx];
        if (code === null || code === undefined) return;
        const gIdx = groups.findIndex((g) => g.codes.includes(code));
        if (gIdx !== -1) {
          matrix[gIdx][col].push({ modelKey: mKey, wmoCode: code });
        }
      });
    }

    // Debug counts in console
    console.group("WMO Matrix counts (models per cell)");
    console.table(
      matrix.map((row, gi) => {
        const obj = { groupe: groups[gi].name };
        row.forEach((cell, ci) => (obj[`H+${ci * 3}`] = cell.length));
        return obj;
      })
    );
    console.groupEnd();

    return { matrix, timestamps3h };
  }

  /* ---------------------- RENDU TABLEAU ---------------------- */
  function renderDoubleEntryWmoTable(matrix, ts3h, aggregated) {
    const groups = WMO_GROUPS();
    const header = ts3h
      .map((ts, idx) => {
        const d = new Date(ts);
        return `<th class="time-header">H+${
          idx * 3
        }<br/><small>${d.toLocaleDateString("fr-FR", {
          weekday: "short",
        })} ${formatHour(ts)}</small></th>`;
      })
      .join("");

    const bodyRows = groups
      .map((g, gIdx) => {
        const cells = matrix[gIdx]
          .map(
            (cell) => `<td class="wmo-cell">${renderModelsInCell(cell)}</td>`
          )
          .join("");
        return `<tr style="background:${g.bgColor}"><td class="sticky-header group-name"><strong>${g.name}</strong></td>${cells}</tr>`;
      })
      .join("");

    const aggregatedRow = `<tr class="wmo-aggregated-row"><td class="sticky-header"><strong>Agrégé Final</strong></td>${ts3h
      .map((_, idx) => {
        const code = aggregated[idx * 3]?.value ?? null;
        if (code === null) return `<td class="wmo-cell aggregated">-</td>`;
        return `<td class="wmo-cell aggregated"><div class="wmo-cell-content final"><img class="wmo-icon" src="/icons/wmo/${getWmoIcon(
          code
        )}"/><span class="wmo-code final">${code}</span></div></td>`;
      })
      .join("")}</tr>`;

    document.getElementById(
      "wmo-matrix"
    ).innerHTML = `<div class="wmo-matrix-container"><table class="wmo-matrix-table"><thead><tr><th class="sticky-header">Conditions météo</th>${header}</tr></thead><tbody>${bodyRows}${aggregatedRow}</tbody></table></div>`;
  }

  /* ---------------------- CELLULE ---------------------- */
  function renderModelsInCell(models) {
    if (!models.length) return "";
    const show = models.slice(0, 12);
    return `<div class="models-grid">${show
      .map(({ modelKey, wmoCode }) => {
        const info = getModelInfo(modelKey);
        return `<div class="model-item-compact"><div class="model-name-compact" style="color:${
          info.color
        }">${
          info.shortName
        }</div><img class="wmo-icon-tiny" src="/icons/wmo/${getWmoIcon(
          wmoCode
        )}"/><div class="wmo-code-tiny">${wmoCode}</div></div>`;
      })
      .join("")}</div>`;
  }

  /* ---------------------- STATS ---------------------- */
  function updateDoubleWmoStats(matrix) {
    const activeModels = new Set();
    matrix.forEach((row) => {
      row[0].forEach((m) => activeModels.add(m.modelKey));
    });
    const modelsCount = activeModels.size;

    const hours = (matrix[0].length - 1) * 3; // 57 colonnes => 0..168 => 168h

    const badge = document.getElementById("wmo-models-count");
    if (badge) badge.textContent = `${modelsCount} modèles`;

    const stats = document.getElementById("wmo-stats");
    if (stats) {
      stats.innerHTML = `<div class="stat-card"><div class="stat-value">${hours}</div><div class="stat-label">Heures de prévision</div></div><div class="stat-card"><div class="stat-value">${modelsCount}</div><div class="stat-label">Modèles actifs</div></div>`;
    }
  }

  function renderRealWmoMatrix(wmoDataByModel) {
    const matrixElement = document.getElementById("wmo-matrix");
    if (!matrixElement || !wmoDataByModel) return;

    // Convertir en array et filtrer toutes les 3h
    const hourlyArray = Object.values(wmoDataByModel)
      .filter((_, index) => index % 3 === 0)
      .slice(0, 56); // 7 jours * 8 points/jour

    // Groupes WMO hiérarchiques (par sévérité décroissante)
    const wmoGroups = [
      {
        name: "Orage avec grêle",
        codes: [96, 99],
        bgColor: "#7E57C2",
        severity: 8,
      },
      { name: "Orage", codes: [95], bgColor: "#9575CD", severity: 7 },
      {
        name: "Neige",
        codes: [71, 72, 73, 74, 75, 76, 77, 85, 86],
        bgColor: "#E1F5FE",
        severity: 6,
      },
      {
        name: "Averses de pluie",
        codes: [80, 81, 82],
        bgColor: "#2196F3",
        severity: 5,
      },
      {
        name: "Pluie verglaçante",
        codes: [56, 57, 66, 67],
        bgColor: "#4FC3F7",
        severity: 4,
      },
      {
        name: "Pluie/Bruine",
        codes: [51, 52, 53, 54, 55, 61, 62, 63, 64, 65],
        bgColor: "#64B5F6",
        severity: 3,
      },
      { name: "Brouillard", codes: [45, 48], bgColor: "#CFD8DC", severity: 2 },
      { name: "Couvert", codes: [1, 2, 3], bgColor: "#B0BEC5", severity: 1 },
      { name: "Ciel clair", codes: [0], bgColor: "#FFF176", severity: 0 },
    ];

    const matrixHTML = `
      <div class="wmo-matrix-container">
        <table class="wmo-matrix-table">
          <thead>
            <tr>
              <th class="sticky-header">Conditions Météo</th>
              ${hourlyArray
                .map((hourData, index) => {
                  const date = new Date(hourData.datetime);
                  const dayName = date.toLocaleDateString("fr-FR", {
                    weekday: "short",
                  });
                  const timeStr = formatHour(hourData.datetime);
                  return `<th class="time-header">H+${
                    index * 3
                  }<br/><small>${dayName} ${timeStr}</small></th>`;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${wmoGroups
              .map((group) => {
                return `
                <tr style="background-color: ${group.bgColor};">
                  <td class="sticky-header group-name"><strong>${
                    group.name
                  }</strong></td>
                  ${hourlyArray
                    .map((hourData) => {
                      return `<td class="wmo-cell">${renderRealModelsForGroup(
                        hourData,
                        group
                      )}</td>`;
                    })
                    .join("")}
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    matrixElement.innerHTML = matrixHTML;
  }

  function renderRealModelsForGroup(hourData, group) {
    if (!hourData.models) return "";

    // Trouver tous les modèles qui ont un code dans ce groupe
    const modelsInGroup = [];

    Object.entries(hourData.models).forEach(([modelKey, wmoCode]) => {
      if (group.codes.includes(wmoCode)) {
        modelsInGroup.push({ modelKey, wmoCode });
      }
    });

    // Trier par sévérité décroissante puis alphabétique
    modelsInGroup.sort((a, b) => {
      // Pour l'instant, tri alphabétique simple
      return a.modelKey.localeCompare(b.modelKey);
    });

    // Limiter à 2 modèles max par case
    const modelsToShow = modelsInGroup.slice(0, 2);

    return modelsToShow
      .map(({ modelKey, wmoCode }) => {
        const modelInfo = getModelInfo(modelKey);
        return `
        <div class="model-item">
          <div class="model-header" style="color: ${modelInfo.color};">
            <span class="model-name">${modelInfo.shortName}</span>
          </div>
          <img src="/icons/wmo/${getWmoIcon(
            wmoCode
          )}" alt="WMO ${wmoCode}" class="wmo-icon-small"/>
          <span class="wmo-code-small">${wmoCode}</span>
        </div>
      `;
      })
      .join("");
  }

  function updateRealWmoStats(wmoDataByModel) {
    // Compter les modèles actifs réels
    const firstHour = Object.values(wmoDataByModel)[0];
    const activeModelsCount = firstHour
      ? Object.keys(firstHour.models).length
      : 0;

    // Mettre à jour le badge du nombre de modèles
    const modelsCountElement = document.getElementById("wmo-models-count");
    if (modelsCountElement) {
      modelsCountElement.textContent = `${activeModelsCount} modèles`;
    }

    // Mettre à jour les stats générales
    const statsElement = document.getElementById("wmo-stats");
    if (statsElement) {
      const totalHours = Object.keys(wmoDataByModel).length;

      statsElement.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${totalHours}</div>
          <div class="stat-label">Heures de prévision</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${activeModelsCount}</div>
          <div class="stat-label">Modèles actifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">Multi</div>
          <div class="stat-label">Mode d'affichage</div>
        </div>
      `;
    }
  }

  function renderWmoData(data) {
    console.log("Données WMO:", data);

    // Mise à jour des statistiques
    updateWmoStats(data);

    // Rendu de la matrice WMO
    renderWmoMatrix(data);

    // Rendu des statistiques de risque
    renderWmoRiskStats(data);
  }

  function updateWmoStats(data) {
    const statsElement = document.getElementById("wmo-stats");
    if (!statsElement || !data || data.length === 0) return;

    // Calcul des statistiques
    const totalPoints = data.length;
    const wmoGroups = {};
    let alertCount = 0;

    data.forEach((item) => {
      const wmoCode = item.value;
      const group = getWmoGroup(wmoCode);
      wmoGroups[group] = (wmoGroups[group] || 0) + 1;

      // Codes d'alerte (orage, neige forte, etc.)
      if ([95, 96, 99, 73, 77, 82].includes(wmoCode)) {
        alertCount++;
      }
    });

    const dominantGroup = Object.keys(wmoGroups).reduce(
      (a, b) => (wmoGroups[a] > wmoGroups[b] ? a : b),
      "Ciel clair"
    );

    statsElement.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${totalPoints}</div>
        <div class="stat-label">Points de données</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${dominantGroup}</div>
        <div class="stat-label">Tendance dominante</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${alertCount}</div>
        <div class="stat-label">Alertes météo</div>
      </div>
    `;

    // Mettre à jour le nombre de modèles dynamiquement
    updateWmoModelsCount(data);
  }

  function updateWmoModelsCount(data) {
    // Compter les modèles actifs depuis les données WMO
    let activeModelsCount = 10; // Valeur par défaut

    if (data && data.length > 0 && data[0].rawData) {
      // Si on a des données brutes, compter les modèles uniques
      const firstHourRawData = data[0].rawData;
      activeModelsCount = firstHourRawData.length;
    }

    const modelsCountElement = document.getElementById("wmo-models-count");
    if (modelsCountElement) {
      modelsCountElement.textContent = `${activeModelsCount} modèles`;
    }
  }

  function getWmoGroup(wmoCode) {
    if ([96, 99].includes(wmoCode)) return "Orage avec grêle";
    if ([95].includes(wmoCode)) return "Orage";
    if ([71, 72, 73, 74, 75, 76, 77, 85, 86].includes(wmoCode)) return "Neige";
    if ([80, 81, 82].includes(wmoCode)) return "Averses de pluie";
    if ([56, 57, 66, 67].includes(wmoCode)) return "Pluie verglaçante";
    if ([51, 52, 53, 54, 55, 61, 62, 63, 64, 65].includes(wmoCode))
      return "Pluie/Bruine";
    if ([45, 48].includes(wmoCode)) return "Brouillard";
    if ([1, 2, 3].includes(wmoCode)) return "Couvert";
    if ([0].includes(wmoCode)) return "Ciel clair";
    return "Autre";
  }

  function getModelInfo(modelKey) {
    // Palette de couleurs et noms courts par modèle
    const modelPalette = {
      meteofrance_arome_france: { color: "#3498DB", shortName: "AROME" },
      meteofrance_arome_france_hd: { color: "#A3C6FF", shortName: "AROME HD" },
      meteofrance_arpege_europe: { color: "#BBDEFB", shortName: "ARPEGE" },
      icon_eu: { color: "#FFFF6B", shortName: "ICON EU" },
      icon_global: { color: "#F39C12", shortName: "ICON G." },
      ukmo_global_deterministic_10km: {
        color: "#58D68D",
        shortName: "UKMO G.",
      },
      ukmo_uk_deterministic_2km: { color: "#A3E4D7", shortName: "UKMO 2K" },
      gfs_graphcast025: { color: "#FF7E79", shortName: "GRAPHCAST" },
      gfs_global: { color: "#FFB3AB", shortName: "GFS" },
      ecmwf_ifs025: { color: "#b17652", shortName: "ECMWF" },
      knmi_harmonie_arome_europe: { color: "#CE93D8", shortName: "HARMON." },
    };

    return modelPalette[modelKey] || { color: "#64748b", shortName: "UNKNOWN" };
  }

  function getWmoIcon(wmoCode) {
    // Utilise le mapping du fichier utils/wmoIconMapping.js
    const iconMap = {
      // Groupe 0: Ciel clair
      0: "day.svg", // Ciel clair jour

      // Groupe 1: Peu nuageux, couvert
      1: "cloudy-day-1.svg", // Peu nuageux
      2: "cloudy-day-2.svg", // Partiellement nuageux
      3: "cloudy.svg", // Couvert

      // Groupe 2: Brouillard
      45: "cloudy.svg", // Brouillard (utilise nuageux épais)
      48: "cloudy.svg", // Brouillard givrant

      // Groupe 3: Bruine + Pluie légère à modérée
      51: "rainy-1.svg", // Bruine légère
      52: "rainy-2.svg", // Bruine modérée
      53: "rainy-3.svg", // Bruine forte
      54: "rainy-1.svg", // Bruine légère verglaçante
      55: "rainy-2.svg", // Bruine modérée verglaçante
      61: "rainy-4.svg", // Pluie légère
      62: "rainy-5.svg", // Pluie modérée
      63: "rainy-6.svg", // Pluie forte
      64: "rainy-5.svg", // Pluie légère verglaçante
      65: "rainy-6.svg", // Pluie modérée verglaçante

      // Groupe 4: Pluie/bruine verglaçante forte
      56: "rainy-3.svg", // Bruine verglaçante légère
      57: "rainy-6.svg", // Bruine verglaçante forte
      66: "rainy-5.svg", // Pluie verglaçante légère
      67: "rainy-7.svg", // Pluie verglaçante forte

      // Groupe 5: Averses de pluie
      80: "rainy-5.svg", // Averses légères
      81: "rainy-6.svg", // Averses modérées
      82: "rainy-7.svg", // Averses violentes

      // Groupe 6: Neige
      71: "snowy-1.svg", // Chute de neige légère
      72: "snowy-2.svg", // Chute de neige modérée
      73: "snowy-3.svg", // Chute de neige forte
      74: "snowy-4.svg", // Grains de glace légère
      75: "snowy-5.svg", // Chute de neige légère
      76: "snowy-6.svg", // Chute de neige modérée
      77: "snowy-3.svg", // Grains de neige
      85: "snowy-5.svg", // Averses de neige légères
      86: "snowy-6.svg", // Averses de neige fortes

      // Groupe 7: Orage
      95: "thunder.svg", // Orage

      // Groupe 8: Orage avec grêle
      96: "thunder.svg", // Orage avec grêle légère
      99: "thunder.svg", // Orage avec grêle forte
    };
    return iconMap[wmoCode] || "cloudy.svg";
  }

  function renderWmoMatrix(data) {
    const matrixElement = document.getElementById("wmo-matrix");
    if (!matrixElement || !data || data.length === 0) return;

    // Filtrer les données (toutes les 3h pour plus de détails sur WMO)
    const filteredData = data
      .filter((_, index) => index % 3 === 0)
      .slice(0, 56); // 7 jours * 8 points/jour

    // Groupes WMO hiérarchiques
    const wmoGroups = [
      { name: "Orage avec grêle", codes: [96, 99], bgColor: "#7E57C2" },
      { name: "Orage", codes: [95], bgColor: "#9575CD" },
      {
        name: "Neige",
        codes: [71, 72, 73, 74, 75, 76, 77, 85, 86],
        bgColor: "#E1F5FE",
      },
      { name: "Averses de pluie", codes: [80, 81, 82], bgColor: "#2196F3" },
      {
        name: "Pluie verglaçante",
        codes: [56, 57, 66, 67],
        bgColor: "#4FC3F7",
      },
      {
        name: "Pluie/Bruine",
        codes: [51, 52, 53, 54, 55, 61, 62, 63, 64, 65],
        bgColor: "#64B5F6",
      },
      { name: "Brouillard", codes: [45, 48], bgColor: "#CFD8DC" },
      { name: "Couvert", codes: [1, 2, 3], bgColor: "#B0BEC5" },
      { name: "Ciel clair", codes: [0], bgColor: "#FFF176" },
    ];

    const matrixHTML = `
      <div class="wmo-matrix-container">
        <table class="wmo-matrix-table">
          <thead>
            <tr>
              <th class="sticky-header">Conditions Météo</th>
              ${filteredData
                .map((item, index) => {
                  const date = new Date(item.datetime);
                  const dayName = date.toLocaleDateString("fr-FR", {
                    weekday: "short",
                  });
                  const timeStr = formatHour(item.datetime);
                  return `<th class="time-header">H+${
                    index * 3
                  }<br/><small>${dayName} ${timeStr}</small></th>`;
                })
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${wmoGroups
              .map((group) => {
                return `
                <tr style="background-color: ${group.bgColor};">
                  <td class="sticky-header group-name"><strong>${
                    group.name
                  }</strong></td>
                  ${filteredData
                    .map((item) => {
                      return `<td class="wmo-cell">${renderModelsForGroup(
                        item,
                        group
                      )}</td>`;
                    })
                    .join("")}
                </tr>
              `;
              })
              .join("")}
            <tr class="wmo-aggregated-row">
              <td class="sticky-header"><strong>Agrégé Final</strong></td>
              ${filteredData
                .map(
                  (item) =>
                    `<td class="wmo-cell aggregated">
                   <div class="wmo-cell-content final">
                     <img src="/icons/wmo/${getWmoIcon(item.value)}" alt="WMO ${
                      item.value
                    }" class="wmo-icon"/>
                     <span class="wmo-code final">${item.value}</span>
                   </div>
                 </td>`
                )
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;

    matrixElement.innerHTML = matrixHTML;
  }

  function renderModelsForGroup(item, group) {
    // Pour l'instant, on simule des modèles multiples par case
    // TODO: Utiliser les vraies données rawData avec les modèles individuels

    if (!group.codes.includes(item.value)) {
      return ""; // Pas de modèle pour ce groupe à cette heure
    }

    // Simulation de plusieurs modèles pour démonstration
    // Dans la vraie implémentation, il faudrait parser item.rawData ou debug.modelCodes
    const simulatedModels = [
      { key: "meteofrance_arome_france", code: item.value },
      // Ajouter d'autres modèles selon les données réelles
    ];

    // Limiter à 2 modèles max par case comme demandé
    const modelsToShow = simulatedModels.slice(0, 2);

    return modelsToShow
      .map((model) => {
        const modelInfo = getModelInfo(model.key);
        return `
        <div class="model-item">
          <div class="model-header" style="color: ${modelInfo.color};">
            <span class="model-name">${modelInfo.shortName}</span>
          </div>
          <img src="/icons/wmo/${getWmoIcon(model.code)}" alt="WMO ${
          model.code
        }" class="wmo-icon-small"/>
          <span class="wmo-code-small">${model.code}</span>
        </div>
      `;
      })
      .join("");
  }

  function renderWmoRiskStats(data) {
    const riskElement = document.getElementById("wmo-risk-analysis");
    if (!riskElement || !data || data.length === 0) return;

    // Analyser les risques sur 24h, 48h, 72h
    const periods = [
      { name: "24h", hours: 24, data: data.slice(0, 24) },
      { name: "48h", hours: 48, data: data.slice(0, 48) },
      { name: "72h", hours: 72, data: data.slice(0, 72) },
    ];

    const riskHTML = `
      <div class="risk-analysis-grid">
        ${periods
          .map((period) => {
            const riskCodes = period.data.filter((item) =>
              [95, 96, 99, 82, 73, 77].includes(item.value)
            );
            const riskLevel =
              riskCodes.length > 3
                ? "high"
                : riskCodes.length > 1
                ? "medium"
                : "low";
            const riskPercent = Math.round(
              (riskCodes.length / period.data.length) * 100
            );

            return `
            <div class="risk-card ${riskLevel}">
              <div class="risk-period">${period.name}</div>
              <div class="risk-percentage">${riskPercent}%</div>
              <div class="risk-label">Risque météo</div>
              <div class="risk-details">
                ${riskCodes.length} alertes détectées
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;

    riskElement.innerHTML = riskHTML;
  }

  // Module Méthodologie
  async function initMethodoModule() {
    // Module statique - pas d'appel API
    console.log("Module méthodologie initialisé");

    // Mettre à jour les compteurs de modèles dans le footer
    updateModelCounters();
  }

  function updateModelCounters() {
    // Compter les modèles actifs par paramètre en fonction des configurations
    const modelCounts = {
      temperature: 10, // d'après temperature.json
      apparent: 10, // d'après temperature_apparente.json
      humidite: 9, // d'après humidite.json
      wmo: 13, // d'après wmo.json
    };

    // Mettre à jour le footer avec les bonnes informations
    const footerStats = document.querySelector(".footer-stats");
    if (footerStats) {
      footerStats.innerHTML = `
        <div class="stat-item">
          <span class="stat-dot stat-success"></span>
          <span>Fonctions de traitement modularisées</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot stat-info"></span>
          <span>APIs multi-modèles (9-13 modèles selon paramètre)</span>
        </div>
      `;
    }

    // Mettre à jour les informations spécifiques selon l'onglet actuel
    updateTabSpecificInfo();
  }

  function updateTabSpecificInfo() {
    const modelInfo = {
      temp: { count: 10, desc: "modèles haute résolution" },
      apparent: { count: 10, desc: "modèles haute résolution" },
      humidite: { count: 9, desc: "modèles spécialisés humidité" },
      wmo: { count: 13, desc: "modèles conditions météo" },
      methodo: { count: "9-13", desc: "modèles selon paramètre" },
    };

    const currentInfo = modelInfo[currentTab] || modelInfo.methodo;

    // Chercher les éléments qui affichent le nombre de modèles
    const modelCountElements = document.querySelectorAll(".model-count");
    modelCountElements.forEach((element) => {
      element.textContent = `${currentInfo.count} ${currentInfo.desc}`;
    });
  }

  // Gestion d'erreur spécifique aux modules
  function showModuleError(moduleType, message) {
    const contentArea = document.getElementById("content");
    showError(contentArea, `Erreur dans le module ${moduleType}: ${message}`);
  }

  /**
   * GESTION DU REDIMENSIONNEMENT
   */
  function handleResize() {
    updateTabIndicator();
  }

  /**
   * FONCTION DE NETTOYAGE
   */
  function cleanup() {
    console.log("🧹 Nettoyage des ressources...");

    // Supprimer les event listeners
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }

    // Réinitialiser les flags
    eventListenersAttached = false;

    // Nettoyer les graphiques Chart.js
    const canvases = document.querySelectorAll("canvas");
    canvases.forEach((canvas) => {
      if (canvas.chart) {
        canvas.chart.destroy();
        canvas.chart = null;
      }
    });

    console.log("✅ Nettoyage terminé");
  }

  /**
   * GESTION DE LA SÉLECTION DE VILLE
   */
  function initCitySelector() {
    const cityButtons = document.querySelectorAll(".city-btn");

    cityButtons.forEach((button) => {
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

        console.log(`🌍 Ville sélectionnée: ${label} (${lat}, ${lon})`);

        // Recharger les données pour la nouvelle localisation
        if (currentTab && loadedModules.has(currentTab)) {
          console.log(`🔄 Rechargement des données pour ${label}`);
          switchTab(currentTab, true); // Force le rechargement
        }
      });
    });

    console.log("🌍 Sélecteur de ville initialisé");
  }

  /**
   * INITIALISATION DE L'APPLICATION
   */
  function initializeApp() {
    console.log("🚀 Initialisation de l'application test-algo");

    // Initialisation des composants
    initTabs();
    initCitySelector();

    // Gestion du redimensionnement (éviter les doublons)
    if (!resizeHandler) {
      resizeHandler = handleResize;
      window.addEventListener("resize", resizeHandler);
    }

    console.log("✅ Application initialisée avec succès");
  }

  // Initialisation robuste - gère les cas de rechargement
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
  } else {
    // Document déjà chargé, initialiser immédiatement
    initializeApp();
  }

  /* ==================== NOUVEAU TABLEAU WMO AGRÉGÉ ==================== */

  // Variables globales pour le tableau agrégé
  let aggregatedWmoConfig = null;
  let aggregatedWmoData = null;
  let aggregatedLogEntries = [];

  // Initialisation du tableau agrégé
  function initializeAggregatedWmoTable() {
    console.log("🔥 [WMO Agrégé] Initialisation du tableau agrégé");

    // Mettre à jour les coordonnées affichées
    const coordsElement = document.getElementById("aggregated-coords");
    if (coordsElement) {
      coordsElement.textContent = `lat=${CONFIG.coords.lat}, lon=${CONFIG.coords.lon}`;
    }

    // Ajouter l'event listener au bouton de chargement
    const loadBtn = document.getElementById("load-aggregated-btn");
    if (loadBtn) {
      loadBtn.addEventListener("click", loadAggregatedWmoData);
      addAggregatedLog(
        "info",
        "Tableau agrégé initialisé, prêt à charger les données"
      );
    }

    // Charger la configuration WMO
    loadAggregatedWmoConfig();
  }

  // Fonction de logging pour le tableau agrégé
  function addAggregatedLog(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    aggregatedLogEntries.push({ level, message: logEntry, timestamp });

    const logContent = document.getElementById("aggregated-log-content");
    if (logContent) {
      const logDiv = document.createElement("div");
      logDiv.className = `aggregated-log-entry agg-log-${level}`;
      logDiv.textContent = logEntry;
      logContent.appendChild(logDiv);
      logContent.scrollTop = logContent.scrollHeight;
    }

    // Console selon le niveau
    const fullMessage = `[WMO Agrégé] ${logEntry}`;
    if (level === "error") console.error(fullMessage);
    else if (level === "warn") console.warn(fullMessage);
    else if (level === "debug") console.debug(fullMessage);
    else console.log(fullMessage);
  }

  // Vider les logs agrégés
  function clearAggregatedLogs() {
    aggregatedLogEntries = [];
    const logContent = document.getElementById("aggregated-log-content");
    if (logContent) {
      logContent.innerHTML = "";
    }
    addAggregatedLog("info", "Logs vidés");
  }

  // Chargement de la configuration WMO agrégée
  async function loadAggregatedWmoConfig() {
    try {
      addAggregatedLog("info", "Chargement de la configuration WMO...");
      const response = await fetch("/api/config/wmo");
      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }
      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Erreur lors du chargement de la configuration"
        );
      }

      aggregatedWmoConfig = result.data;

      addAggregatedLog(
        "info",
        `Configuration WMO chargée - Algorithme: ${aggregatedWmoConfig.algorithm}`
      );
      addAggregatedLog(
        "debug",
        `Modèles activés: ${Object.entries(aggregatedWmoConfig.models)
          .filter(([key, model]) => model.enabled)
          .map(([key, model]) => model.name)
          .join(", ")}`
      );

      // Afficher l'algorithme dans l'interface
      const algorithmBadge = document.getElementById("wmo-agg-algorithm");
      if (algorithmBadge) {
        algorithmBadge.textContent = aggregatedWmoConfig.algorithm;
      }

      return aggregatedWmoConfig;
    } catch (error) {
      addAggregatedLog(
        "error",
        `Impossible de charger la configuration WMO: ${error.message}`
      );
      showAggregatedError(`Erreur de configuration: ${error.message}`);
      throw error;
    }
  }

  // Appel de l'API pour traiter les données WMO agrégées
  async function callAggregatedWmoProcessing(lat, lon) {
    try {
      addAggregatedLog(
        "info",
        `Appel API WMO agrégé pour lat=${lat}, lon=${lon}`
      );

      // Utiliser l'endpoint d'agrégation WMO
      const response = await fetch(
        `${CONFIG.endpoints.wmo}/agg?lat=${lat}&lon=${lon}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Erreur HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur lors du traitement");
      }

      const data = result.data;
      addAggregatedLog(
        "info",
        `Données WMO agrégées reçues: ${data.length} points de données`
      );
      addAggregatedLog("debug", `Première donnée: ${JSON.stringify(data[0])}`);
      addAggregatedLog(
        "debug",
        `Algorithme utilisé: ${result.metadata?.algorithm || "non spécifié"}`
      );

      return data;
    } catch (error) {
      addAggregatedLog(
        "error",
        `Erreur lors de l'appel API WMO agrégé: ${error.message}`
      );
      throw error;
    }
  }

  // Fonction principale pour charger les données WMO agrégées
  async function loadAggregatedWmoData() {
    const loadBtn = document.getElementById("load-aggregated-btn");
    const loading = document.getElementById("aggregated-loading");
    const tableWrapper = document.getElementById("aggregated-table-wrapper");
    const statsContainer = document.getElementById("aggregated-stats");
    const errorContainer = document.getElementById("aggregated-error");

    try {
      // Interface loading
      if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.textContent = "⏳ Chargement...";
      }
      if (loading) loading.style.display = "block";
      if (tableWrapper) tableWrapper.style.display = "none";
      if (statsContainer) statsContainer.style.display = "none";
      if (errorContainer) {
        errorContainer.style.display = "none";
        errorContainer.innerHTML = "";
      }

      addAggregatedLog("info", "=== DÉBUT DU TRAITEMENT WMO AGRÉGÉ ===");

      // Utiliser les coordonnées de la configuration
      const { lat, lon } = CONFIG.coords;
      addAggregatedLog("info", `Coordonnées: lat=${lat}, lon=${lon}`);

      // Charger la config si nécessaire
      if (!aggregatedWmoConfig) {
        await loadAggregatedWmoConfig();
      }

      // Traiter les données WMO agrégées
      aggregatedWmoData = await callAggregatedWmoProcessing(lat, lon);

      // Générer le tableau
      generateAggregatedWmoTable(aggregatedWmoData);

      // Afficher les statistiques
      displayAggregatedStats(aggregatedWmoData);

      // Afficher les résultats
      if (tableWrapper) tableWrapper.style.display = "block";
      if (statsContainer) statsContainer.style.display = "block";

      addAggregatedLog("info", "=== TRAITEMENT WMO AGRÉGÉ TERMINÉ ===");
    } catch (error) {
      addAggregatedLog(
        "error",
        `Échec du traitement WMO agrégé: ${error.message}`
      );
      showAggregatedError(`Erreur: ${error.message}`);
    } finally {
      // Reset interface
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.textContent = "🔄 Charger données agrégées";
      }
      if (loading) loading.style.display = "none";
    }
  }

  // Génération du tableau HTML agrégé
  function generateAggregatedWmoTable(data) {
    addAggregatedLog("info", "Génération du tableau HTML agrégé...");

    const table = document.getElementById("aggregated-wmo-table");
    const tbody = document.getElementById("aggregated-wmo-tbody");
    const hourHeaders = document.getElementById("aggregated-hour-headers");

    if (!table || !tbody || !hourHeaders) {
      addAggregatedLog("error", "Éléments du tableau agrégé non trouvés");
      return;
    }

    // Générer les en-têtes d'heures (0-23)
    hourHeaders.innerHTML = "";
    for (let h = 0; h < 24; h++) {
      const th = document.createElement("th");
      th.className = "hour-cell-agg";
      th.textContent = h.toString().padStart(2, "0");
      hourHeaders.appendChild(th);
    }

    // Grouper les données par jour (168h = 7 jours × 24h)
    const dayGroups = [];
    for (let day = 0; day < 7; day++) {
      const dayData = [];
      for (let hour = 0; hour < 24; hour++) {
        const hourIndex = day * 24 + hour;
        if (hourIndex < data.length) {
          dayData.push(data[hourIndex]);
        } else {
          dayData.push(null);
        }
      }
      dayGroups.push(dayData);
    }

    // Générer les lignes du tableau
    tbody.innerHTML = "";

    dayGroups.forEach((dayData, dayIndex) => {
      const tr = document.createElement("tr");

      // Cellule jour
      const dayCell = document.createElement("td");
      dayCell.className = "aggregated-day-cell";
      dayCell.textContent = `J+${dayIndex}`;
      tr.appendChild(dayCell);

      // Cellule heure de début
      const hourStartCell = document.createElement("td");
      hourStartCell.className = "aggregated-hour-start-cell";
      hourStartCell.textContent = `${dayIndex * 24}h`;
      tr.appendChild(hourStartCell);

      // Cellules pour chaque heure
      dayData.forEach((hourData, hourIndex) => {
        const td = document.createElement("td");
        td.className = "aggregated-wmo-cell";

        if (
          hourData &&
          (hourData.value === 0 ||
            (hourData.value !== null && hourData.value !== undefined))
        ) {
          // Code WMO seulement - style simplifié
          const codeDiv = document.createElement("div");
          codeDiv.className = "aggregated-wmo-code-simple";
          codeDiv.textContent = hourData.value;
          td.appendChild(codeDiv);

          // Appliquer la couleur selon le code WMO
          td.classList.add(`agg-wmo-${hourData.value}`);
        } else {
          const naDiv = document.createElement("div");
          naDiv.className = "aggregated-na";
          naDiv.textContent = "N/A";
          td.appendChild(naDiv);
        }

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });

    addAggregatedLog(
      "info",
      `Tableau agrégé généré avec ${dayGroups.length} jours et ${data.length} points de données`
    );
  }

  // Affichage des statistiques agrégées
  function displayAggregatedStats(data) {
    addAggregatedLog("info", "Calcul des statistiques agrégées...");

    const validData = data.filter(
      (d) => d.value !== null && d.value !== undefined
    );
    const codes = validData.map((d) => d.value);
    const algorithms = validData.map((d) => d.debug?.algorithm).filter(Boolean);

    // Distribution des codes
    const codeDistribution = {};
    codes.forEach((code) => {
      codeDistribution[code] = (codeDistribution[code] || 0) + 1;
    });

    // Distribution des algorithmes
    const algorithmDistribution = {};
    algorithms.forEach((algo) => {
      algorithmDistribution[algo] = (algorithmDistribution[algo] || 0) + 1;
    });

    // Calcul des risques maximum
    const maxRisks = {
      orage: Math.max(...validData.map((d) => d.risque?.orage || 0)),
      grele: Math.max(...validData.map((d) => d.risque?.grele || 0)),
      verglas: Math.max(...validData.map((d) => d.risque?.verglas || 0)),
      brouillard: Math.max(...validData.map((d) => d.risque?.brouillard || 0)),
    };

    const statsContent = document.getElementById("aggregated-stats-content");
    if (statsContent) {
      statsContent.innerHTML = `
        <div class="aggregated-stat-item">
          <div class="aggregated-stat-label">Points de données valides:</div>
          <div class="aggregated-stat-value">${validData.length}/${
        data.length
      }</div>
        </div>
        <div class="aggregated-stat-item">
          <div class="aggregated-stat-label">Plage temporelle:</div>
          <div class="aggregated-stat-value">${data[0]?.datetime} → ${
        data[data.length - 1]?.datetime
      }</div>
        </div>
        <div class="aggregated-stat-item">
          <div class="aggregated-stat-label">Distribution des codes WMO:</div>
          <div class="aggregated-stat-value">${Object.entries(codeDistribution)
            .map(([code, count]) => `${code}(${count})`)
            .join(", ")}</div>
        </div>
        <div class="aggregated-stat-item">
          <div class="aggregated-stat-label">Algorithmes utilisés:</div>
          <div class="aggregated-stat-value">${Object.entries(
            algorithmDistribution
          )
            .map(([algo, count]) => `${algo}(${count})`)
            .join(", ")}</div>
        </div>
        <div class="aggregated-stat-item">
          <div class="aggregated-stat-label">Risques maximaux:</div>
          <div class="aggregated-stat-value">Orage(${maxRisks.orage}), Grêle(${
        maxRisks.grele
      }), Verglas(${maxRisks.verglas}), Brouillard(${maxRisks.brouillard})</div>
        </div>
      `;
    }

    addAggregatedLog(
      "info",
      `Statistiques agrégées calculées - ${validData.length} points valides sur ${data.length}`
    );
  }

  // Affichage des erreurs agrégées
  function showAggregatedError(message) {
    const errorContainer = document.getElementById("aggregated-error");
    if (errorContainer) {
      errorContainer.innerHTML = message;
      errorContainer.style.display = "block";
    }
  }

  // Rendre les fonctions disponibles globalement
  window.clearAggregatedLogs = clearAggregatedLogs;
  window.loadAggregatedWmoData = loadAggregatedWmoData;

  // Export pour usage éventuel et marquage de chargement
  window.TestAlgoApp = {
    switchTab,
    loadModule,
    CONFIG,
    cleanup,
    initializeApp,
    // Nouvelles fonctions pour le tableau agrégé
    loadAggregatedWmoData,
    clearAggregatedLogs,
    initializeAggregatedWmoTable,
  };

  // Marquer que le script est chargé
  window.TestAlgoConfig = CONFIG;
})(); // Fin de l'IIFE
