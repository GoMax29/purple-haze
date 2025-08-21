/**
 * Commun - utilitaires partagés et registre de modules pour test-algo
 * Contexte: JS vanilla sans bundler. Expose un objet global `TestAlgoCommon`
 * et un registre `TestAlgoModules` accessible par `app.js`.
 */

(function () {
  "use strict";

  if (window.TestAlgoCommon && window.TestAlgoModules) {
    return; // déjà chargé
  }

  // Registre des modules par onglet (ex: temp, apparent, humidite, wmo)
  const modulesRegistry = {};

  function registerModule(name, api) {
    modulesRegistry[name] = api;
  }

  // Helpers génériques utilisés par plusieurs onglets
  function formatHour(dateStr) {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`;
  }

  function injectSpinner(target) {
    if (!target) return;
    target.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    `;
  }

  function showError(target, message) {
    if (!target) return;
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

  function clearContainer(el) {
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  // WMO: mapping icônes + descriptions partagé (utilisé par plusieurs rendus)
  const WMO_ICON_MAP = {
    0: "day.svg",
    1: "cloudy-day-1.svg",
    2: "cloudy-day-2.svg",
    3: "cloudy.svg",
    45: "cloudy.svg",
    48: "cloudy.svg",
    51: "rainy-1.svg",
    52: "rainy-2.svg",
    53: "rainy-3.svg",
    54: "rainy-1.svg",
    55: "rainy-2.svg",
    61: "rainy-4.svg",
    62: "rainy-5.svg",
    63: "rainy-6.svg",
    64: "rainy-5.svg",
    65: "rainy-6.svg",
    56: "rainy-3.svg",
    57: "rainy-6.svg",
    66: "rainy-5.svg",
    67: "rainy-7.svg",
    80: "rainy-5.svg",
    81: "rainy-6.svg",
    82: "rainy-7.svg",
    71: "snowy-1.svg",
    72: "snowy-2.svg",
    73: "snowy-3.svg",
    74: "snowy-4.svg",
    75: "snowy-5.svg",
    76: "snowy-6.svg",
    77: "snowy-3.svg",
    85: "snowy-5.svg",
    86: "snowy-6.svg",
    95: "thunder.svg",
    96: "thunder.svg",
    99: "thunder.svg",
  };

  function getWmoIcon(wmoCode) {
    return WMO_ICON_MAP[wmoCode] || "cloudy.svg";
  }

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
    const colorMap = {
      "#7E57C2": "#E1BEE7",
      "#9575CD": "#C39BD3",
      "#E1F5FE": "#F0F8FF",
      "#2196F3": "#BBDEFB",
      "#4FC3F7": "#E1F5FE",
      "#64B5F6": "#E3F2FD",
      "#CFD8DC": "#ECEFF1",
      "#B0BEC5": "#E0E0E0",
      "#FFF176": "#FFFDE7",
    };
    return colorMap[bgColor] || "#F5F5F5";
  }

  function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#ffffff";
  }

  window.TestAlgoCommon = {
    formatHour,
    injectSpinner,
    showError,
    clearContainer,
    getWmoIcon,
    getWmoDescription,
    getPastelColor,
    getContrastColor,
  };

  window.TestAlgoModules = modulesRegistry;
  window.TestAlgoRegisterModule = registerModule;
})();
