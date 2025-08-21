/**
 * Application principale - Gestion des onglets et chargement dynamique
 * Architecture: JavaScript Vanilla moderne
 */

// Configuration globale
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

  // Gestion des clics
  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabId = button.dataset.tab;
      switchTab(tabId);
    });
  });

  // Position initiale de l'indicateur
  updateTabIndicator();

  // Chargement du premier onglet
  loadModule(currentTab);
}

// Basculement d'onglet
function switchTab(tabId) {
  if (tabId === currentTab) return;

  // Mise à jour de l'état
  const oldTab = currentTab;
  currentTab = tabId;

  // Mise à jour UI
  updateActiveTab();
  updateTheme(tabId);
  updateTabIndicator();

  // Chargement du contenu
  loadModule(tabId);

  console.log(`Basculement: ${oldTab} → ${tabId}`);
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
    const modulePath = `modules/${moduleId}.html`;
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
  if (!tableElement) return;

  // Filtrer les données (toutes les 6h)
  const filteredData = data.filter((_, index) => index % 6 === 0).slice(0, 28);

  const tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date/Heure</th>
                    <th>Température</th>
                    <th>Modèles Actifs</th>
                </tr>
            </thead>
            <tbody>
                ${filteredData
                  .map((item, index) => {
                    const date = new Date(item.datetime);
                    const dayName = date.toLocaleDateString("fr-FR", {
                      weekday: "short",
                    });
                    const timeStr = formatHour(item.datetime);

                    return `
                        <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
                            <td>
                                <div class="date-cell">
                                    <div class="day-name">${dayName}</div>
                                    <div class="time-str">${timeStr}</div>
                                </div>
                            </td>
                            <td>
                                <span class="temp-value">${item.value}°C</span>
                            </td>
                            <td>
                                <span class="badge">Multi-modèles</span>
                            </td>
                        </tr>
                    `;
                  })
                  .join("")}
            </tbody>
        </table>
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
  // Implémentation similaire à renderTemperatureData
  console.log("Données température apparente:", data);
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
  // Implémentation pour l'humidité
  console.log("Données humidité:", data);
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

async function fetchAndRenderWmo() {
  const url = `${CONFIG.endpoints.wmo}?lat=${CONFIG.coords.lat}&lon=${CONFIG.coords.lon}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || "Erreur lors du traitement");
  }

  renderWmoData(result.data);
}

function renderWmoData(data) {
  // Implémentation pour WMO
  console.log("Données WMO:", data);
}

// Module Méthodologie
async function initMethodoModule() {
  // Module statique - pas d'appel API
  console.log("Module méthodologie initialisé");
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
 * INITIALISATION DE L'APPLICATION
 */
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Initialisation de l'application test-algo");

  // Initialisation des composants
  initTabs();

  // Gestion du redimensionnement
  window.addEventListener("resize", handleResize);

  console.log("✅ Application initialisée avec succès");
});

// Export pour usage éventuel
window.TestAlgoApp = {
  switchTab,
  loadModule,
  CONFIG,
};
