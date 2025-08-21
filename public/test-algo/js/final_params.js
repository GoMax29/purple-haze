/**
 * Module Final Params - JavaScript séparé pour l'architecture test-algo
 * Ce fichier est automatiquement chargé par app.js
 */

(function () {
  "use strict";

  console.log("🔥 [Final Params JS] Script démarré");

  // Variables du module
  let moduleData = null;
  let currentCoords = { lat: 47.8322, lon: -4.2967 };

  // Mapping des icônes WMO (copié depuis wmoIconMapping.js)
  const WMO_EMOJIS = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    52: "🌦️",
    53: "🌧️",
    54: "🌧️",
    55: "🌧️",
    56: "🌨️",
    57: "🌨️",
    61: "🌧️",
    62: "🌧️",
    63: "🌧️",
    64: "🌨️",
    65: "🌨️",
    66: "🌨️",
    67: "🌨️",
    71: "🌨️",
    72: "❄️",
    73: "❄️",
    74: "🌨️",
    75: "❄️",
    76: "❄️",
    77: "🌨️",
    80: "🌦️",
    81: "🌧️",
    82: "⛈️",
    85: "🌨️",
    86: "❄️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  function getWmoEmoji(code) {
    return WMO_EMOJIS[code] || "❓";
  }

  // Simulation de l'algorithme smart_bary pour l'agrégation des tranches
  // (en attendant l'intégration complète du module time_slots_smart_bary.js)
  function aggregateWmoCodesWithSmartBary(codes) {
    if (!codes || codes.length === 0) return null;

    // Pour cette simulation, on utilise une logique simplifiée basée sur smart_bary
    // TODO: Remplacer par l'import réel du module time_slots_smart_bary.js
    const validCodes = codes.filter((c) => c !== null && c !== undefined);
    if (validCodes.length === 0) return null;

    // Logique simplifiée : médiane pondérée
    const sorted = [...validCodes].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? sorted[mid] : sorted[mid];
  }

  // Création des tooltips pour les codes WMO agrégés
  function createWmoTooltip(hourlyCodesInSlot, aggregatedCode) {
    if (!hourlyCodesInSlot || hourlyCodesInSlot.length === 0) return "";

    const codesList = hourlyCodesInSlot
      .map((code) => `${code} (${getWmoEmoji(code)})`)
      .join(", ");

    return `[${codesList}] = ${aggregatedCode} (${getWmoEmoji(
      aggregatedCode
    )})`;
  }

  // Détection des risques dans une tranche horaire selon la règle INSTANT
  function detectRisksInSlot(hourlyData, slotStart, slotEnd) {
    const risks = [];

    for (let i = 0; i < hourlyData.length; i++) {
      const item = hourlyData[i];
      const hour = new Date(item.time).getHours();

      // Vérifier si l'heure est dans la tranche (règle INSTANT pour WMO)
      // Ex: tranche 06-12h inclut les heures 6, 7, 8, 9, 10, 11
      let inSlot = false;
      if (slotStart < slotEnd) {
        inSlot = hour >= slotStart && hour < slotEnd;
      } else {
        // Cas 18-00 (18h à minuit) : 18, 19, 20, 21, 22, 23
        inSlot = hour >= slotStart || hour < slotEnd;
      }

      if (inSlot && item.wmo) {
        // Détecter les codes à risque (orages, grêle, etc.)
        const riskCodes = [95, 96, 99, 80, 81, 82]; // Orages et averses importantes
        if (riskCodes.includes(item.wmo)) {
          const hourStr = `${hour.toString().padStart(2, "0")}h–${(
            (hour + 1) %
            24
          )
            .toString()
            .padStart(2, "0")}h`;
          let riskType = "Risque météo";

          if ([95, 96, 99].includes(item.wmo)) {
            riskType = [96, 99].includes(item.wmo)
              ? "Orage avec grêle"
              : "Orage";
          } else if ([80, 81, 82].includes(item.wmo)) {
            riskType = "Averse";
          }

          risks.push({
            hour: hourStr,
            type: riskType,
            modelsCount: 1, // Simulation - dans la vraie implémentation, compter les modèles
          });
        }
      }
    }

    return risks;
  }

  // Calcul des précipitations de tranche selon la règle PRECEDING_HOUR
  function calculateSlotPrecipitation(
    hourlyData,
    slotStart,
    slotEnd,
    dayIndex
  ) {
    const dayStartIndex = dayIndex * 24;
    const dayEndIndex = Math.min((dayIndex + 1) * 24, hourlyData.length);
    const dayHourlyData = hourlyData.slice(dayStartIndex, dayEndIndex);

    let totalPrecip = 0;

    for (let i = 0; i < dayHourlyData.length; i++) {
      const item = dayHourlyData[i];
      const hour = new Date(item.time).getHours();

      // Pour les précipitations, il faut prendre les heures décalées
      // Ex: tranche 06-12h, on veut les précipitations de 07, 08, 09, 10, 11, 12
      // car 07:00 = cumul 06→07h, 08:00 = cumul 07→08h, etc.
      let inPrecipSlot = false;
      const adjustedStart = (slotStart + 1) % 24;
      const adjustedEnd = slotEnd === 0 ? 0 : (slotEnd + 1) % 24;

      if (adjustedStart < adjustedEnd) {
        inPrecipSlot = hour >= adjustedStart && hour <= adjustedEnd;
      } else {
        // Cas spécial qui chevauche minuit
        inPrecipSlot = hour >= adjustedStart || hour <= adjustedEnd;
      }

      if (inPrecipSlot && item.precipitation && item.precipitation.mm) {
        totalPrecip += item.precipitation.mm;
      }
    }

    return totalPrecip;
  }

  // Création du tooltip pour les risques
  function createRiskTooltip(risks) {
    if (!risks || risks.length === 0) return "";

    return risks
      .map(
        (risk) =>
          `${risk.hour} : ${risk.type} prévu par ${risk.modelsCount} modèle(s)`
      )
      .join("\n");
  }

  // Formatage des dates en locale française
  function formatDateTimeShort(isoString) {
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const hour = date.getHours();
    return `${day}/${month} ${hour}h`;
  }

  function formatDayShort(isoDate) {
    const date = new Date(isoDate + "T00:00:00");
    const dayNames = ["D", "L", "M", "Me", "J", "V", "S"];
    const dayOfWeek = dayNames[date.getDay()];
    const dayOfMonth = date.getDate();
    return `${dayOfWeek}. ${dayOfMonth}`;
  }

  // Formatage des valeurs
  function formatValue(value, unit, precision = 1) {
    if (value === null || value === undefined) return "N/A";

    switch (unit) {
      case "°C":
        return `${Number(value).toFixed(precision)}°C`;
      case "mm":
        return `${Number(value).toFixed(precision)} mm`;
      case "%":
        return `${Number(value).toFixed(precision)}%`;
      case "km/h":
        return `${Number(value).toFixed(precision)} km/h`;
      case "°":
        return `${Math.round(value)}°`;
      case "wmo":
        return `WMO ${value}`;
      case "uv":
        return `UV ${Number(value).toFixed(1)}`;
      case "aqi":
        return `AQI ${Math.round(value)}`;
      default:
        return String(value);
    }
  }

  // Construction du tableau horaire
  function buildHourlyTable(data, title, groupClass, rows) {
    const firstFive = data.slice(0, 5);
    const lastFive = data.slice(-5);
    const allColumns = [...firstFive, "...", ...lastFive];

    let html = `<table class="data-table ${groupClass}">`;

    // En-tête
    html += "<thead><tr>";
    html += '<th style="width: 140px;">Paramètre</th>';
    allColumns.forEach((item) => {
      if (item === "...") {
        html += '<th class="ellipsis-col">...</th>';
      } else {
        html += `<th>${formatDateTimeShort(item.time)}</th>`;
      }
    });
    html += "</tr></thead>";

    // Corps du tableau
    html += "<tbody>";
    rows.forEach((row) => {
      html += "<tr>";
      html += `<td class="param-label">${row.label}</td>`;
      allColumns.forEach((item) => {
        if (item === "...") {
          html += '<td class="ellipsis-col">...</td>';
        } else {
          const value = row.getValue(item);
          const formattedValue = formatValue(value, row.unit, row.precision);
          const className =
            value === null || value === undefined ? "na-value" : "";
          html += `<td class="${className}">${formattedValue}</td>`;
        }
      });
      html += "</tr>";
    });
    html += "</tbody></table>";

    return html;
  }

  // Construction du tableau quotidien avec smart_bary et gestion des risques
  function buildDailyTable(dailyData, hourlyData) {
    let html = `<table class="daily-table">`;

    // En-tête
    html += `<thead><tr>
    <th style="width: 80px;">Jour</th>
    <th>00-06</th>
    <th>06-12</th>
    <th>12-18</th>
    <th>18-00</th>
    <th>T° min</th>
    <th>T° max</th>
    <th>UV max</th>
    <th>mm totaux</th>
  </tr></thead>`;

    // Corps
    html += "<tbody>";
    dailyData.slice(0, 7).forEach((day, dayIndex) => {
      html += "<tr>";
      html += `<td class="daily-date">${formatDayShort(day.date)}</td>`;

      // Tranches horaires avec emojis WMO et fonctionnalités avancées
      const tranches = [
        { key: "00-06", start: 0, end: 6 },
        { key: "06-12", start: 6, end: 12 },
        { key: "12-18", start: 12, end: 18 },
        { key: "18-00", start: 18, end: 24 },
      ];

      tranches.forEach((tranche) => {
        // Collecter les codes WMO de cette tranche pour ce jour (règle INSTANT)
        const dayStartIndex = dayIndex * 24;
        const dayEndIndex = Math.min((dayIndex + 1) * 24, hourlyData.length);
        const dayHourlyData = hourlyData.slice(dayStartIndex, dayEndIndex);

        const slotCodes = [];
        dayHourlyData.forEach((item) => {
          const hour = new Date(item.time).getHours();
          let inSlot = false;

          // Règle INSTANT pour les codes WMO
          if (tranche.start < tranche.end) {
            inSlot = hour >= tranche.start && hour < tranche.end;
          } else {
            // Cas 18-00 : 18, 19, 20, 21, 22, 23 (pas 0-5)
            inSlot = hour >= tranche.start;
          }

          if (inSlot && item.wmo !== null && item.wmo !== undefined) {
            slotCodes.push(item.wmo);
          }
        });

        // Agréger avec smart_bary (simulation)
        const aggregatedCode = aggregateWmoCodesWithSmartBary(slotCodes);
        const emoji = getWmoEmoji(aggregatedCode);

        // Détecter les risques (selon règle INSTANT)
        const risks = detectRisksInSlot(
          dayHourlyData,
          tranche.start,
          tranche.end
        );
        const hasRisks = risks.length > 0;

        // Calculer les précipitations (selon règle PRECEDING_HOUR)
        const precipTotal = calculateSlotPrecipitation(
          hourlyData,
          tranche.start,
          tranche.end,
          dayIndex
        );

        // Créer les tooltips avec info cohérence temporelle
        const wmoTooltip =
          createWmoTooltip(slotCodes, aggregatedCode) +
          ` | Précip: ${precipTotal.toFixed(1)}mm (preceding_hour)`;
        const riskTooltip = createRiskTooltip(risks);

        html += `<td class="wmo-slot-cell" style="position: relative;">`;

        // Badge de risque si nécessaire
        if (hasRisks) {
          html += `<span class="risk-badge" title="${riskTooltip}">!</span>`;
        }

        // Emoji WMO avec tooltip
        html += `<span class="wmo-emoji-with-tooltip" title="${wmoTooltip}">${emoji}</span>`;

        html += `</td>`;
      });

      // Autres données
      html += `<td>${formatValue(day.temperature.min, "°C")}</td>`;
      html += `<td>${formatValue(day.temperature.max, "°C")}</td>`;
      html += `<td>${formatValue(day.uv.max, "uv")}</td>`;
      html += `<td>${formatValue(day.precipitation.total_mm, "mm")}</td>`;
      html += "</tr>";
    });
    html += "</tbody></table>";

    return html;
  }

  // Rendu principal
  function renderFinalParams(data) {
    const { hourlyData, dailyData } = data;
    let html = "";

    // Groupe Température
    html += buildHourlyTable(hourlyData, "Températures", "temp-group", [
      {
        label: "Température",
        getValue: (item) => item.temperature,
        unit: "°C",
        precision: 1,
      },
      {
        label: "Temp. Apparente",
        getValue: (item) => item.apparentTemperature,
        unit: "°C",
        precision: 1,
      },
    ]);

    // Groupe Vent
    html += buildHourlyTable(hourlyData, "Vent", "wind-group", [
      {
        label: "Force Vent",
        getValue: (item) => item.wind.speed,
        unit: "km/h",
        precision: 1,
      },
      {
        label: "Rafales",
        getValue: (item) => item.wind.gust,
        unit: "km/h",
        precision: 1,
      },
      {
        label: "Direction",
        getValue: (item) => item.wind.direction,
        unit: "°",
        precision: 0,
      },
    ]);

    // Groupe Précipitations
    html += buildHourlyTable(hourlyData, "Précipitations", "precip-group", [
      {
        label: "Précip. mm",
        getValue: (item) => item.precipitation.mm,
        unit: "mm",
        precision: 2,
      },
      {
        label: "Prob. PoP",
        getValue: (item) => item.precipitation.PoP,
        unit: "%",
        precision: 1,
      },
      {
        label: "IC",
        getValue: (item) => item.precipitation.CI,
        unit: "mm",
        precision: 2,
      },
      {
        label: "IQR",
        getValue: (item) => item.precipitation.IQR,
        unit: "mm",
        precision: 2,
      },
    ]);

    // Humidité
    html += buildHourlyTable(hourlyData, "Humidité", "humidity-group", [
      {
        label: "Humidité Rel.",
        getValue: (item) => item.humidity,
        unit: "%",
        precision: 1,
      },
    ]);

    // WMO
    html += buildHourlyTable(hourlyData, "Code WMO", "wmo-group", [
      {
        label: "Code WMO",
        getValue: (item) => item.wmo,
        unit: "wmo",
        precision: 0,
      },
    ]);

    // UV
    html += buildHourlyTable(hourlyData, "UV Index", "uv-group", [
      {
        label: "UV Index",
        getValue: (item) => item.uvIndex,
        unit: "uv",
        precision: 1,
      },
    ]);

    // AQI
    html += buildHourlyTable(hourlyData, "Qualité Air", "aqi-group", [
      {
        label: "AQI Européen",
        getValue: (item) => item.aqi,
        unit: "aqi",
        precision: 0,
      },
    ]);

    // Tableau quotidien avec données horaires pour smart_bary
    html += buildDailyTable(dailyData, hourlyData);

    return html;
  }

  // Fonctions principales
  async function fetchAndRenderFinalParams() {
    try {
      console.log(
        "🔄 [Final Params JS] fetchAndRenderFinalParams démarrée avec coords:",
        currentCoords
      );

      const url = `/api/test-param/final-params?lat=${currentCoords.lat}&lon=${currentCoords.lon}`;
      console.log(`🎯 [Final Params JS] URL API construite: ${url}`);

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Erreur API");
      }

      moduleData = result.data;
      console.log(`✅ [Final Params JS] Données reçues:`, result.stats);

      const content = renderFinalParams(moduleData);
      document.getElementById("final-params-content").innerHTML = content;
      document.getElementById("final-params-loading").style.display = "none";
      document.getElementById("final-params-content").style.display = "block";
    } catch (error) {
      console.error("❌ [Final Params JS] Erreur Final Params:", error);
      document.getElementById("final-params-loading").innerHTML = `
      <div style="color: #ef4444; padding: 2rem; text-align: center;">
        <p><strong>Erreur de chargement</strong></p>
        <p>${error.message}</p>
        <button onclick="window.TestAlgoModules.final_params.retry()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Réessayer
        </button>
      </div>
    `;
    }
  }

  // API du module exposée pour app.js
  const finalParamsModule = {
    /**
     * Initialisation du module - NOUVELLE APPROCHE SIMPLE
     * @param {Object} config - Configuration globale de l'application
     */
    async init(config) {
      try {
        console.log(
          "🎯 [Final Params JS] Initialisation DIRECTE du module avec config:",
          config
        );

        // Récupérer les coordonnées de la ville active depuis les boutons
        const activeBtn = document.querySelector(
          ".city-buttons .city-btn.active"
        );
        if (activeBtn) {
          const lat = parseFloat(activeBtn.getAttribute("data-lat"));
          const lon = parseFloat(activeBtn.getAttribute("data-lon"));
          if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
            currentCoords = { lat, lon };
            console.log(
              "📍 [Final Params JS] Coordonnées ville active récupérées:",
              currentCoords
            );
          }
        }

        // Synchroniser avec la config globale si disponible
        if (config && config.coords) {
          currentCoords = { lat: config.coords.lat, lon: config.coords.lon };
          console.log(
            "📍 [Final Params JS] Coordonnées config utilisées:",
            currentCoords
          );
        }

        console.log("🚀 [Final Params JS] Coordonnées finales:", currentCoords);

        // Appeler directement notre fonction de rendu (plus de bridge HTML!)
        await fetchAndRenderFinalParams();

        console.log(
          "🎉 [Final Params JS] Initialisation terminée avec succès!"
        );
      } catch (error) {
        console.error("❌ [Final Params JS] Erreur init:", error);
        throw error;
      }
    },

    /**
     * Mise à jour des coordonnées
     * @param {number} lat - Latitude
     * @param {number} lon - Longitude
     */
    updateCoords(lat, lon) {
      console.log("📍 [Final Params JS] Mise à jour coordonnées:", {
        lat,
        lon,
      });
      currentCoords = { lat, lon };

      // Afficher le loading et relancer le fetch
      const loadingEl = document.getElementById("final-params-loading");
      const contentEl = document.getElementById("final-params-content");
      if (loadingEl) loadingEl.style.display = "block";
      if (contentEl) contentEl.style.display = "none";

      fetchAndRenderFinalParams();
    },

    /**
     * Fonction retry pour le bouton d'erreur
     */
    retry() {
      console.log("🔄 [Final Params JS] Retry demandé");
      fetchAndRenderFinalParams();
    },

    /**
     * Retourne les données du module
     */
    data() {
      return moduleData;
    },
  };

  // Ajouter les styles CSS dynamiquement
  function injectStyles() {
    if (document.getElementById("final-params-custom-styles")) return;

    const style = document.createElement("style");
    style.id = "final-params-custom-styles";
    style.textContent = `
      /* Styles pour les badges de risque et tooltips */
      .wmo-slot-cell {
        position: relative !important;
        text-align: center;
        padding: 8px;
      }
      
      .risk-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: #dc2626;
        color: white;
        border-radius: 50%;
        width: 16px;
        height: 16px;
        font-size: 10px;
        font-weight: bold;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: help;
        z-index: 10;
        animation: pulse-risk 2s infinite;
      }
      
      @keyframes pulse-risk {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }
      
      .wmo-emoji-with-tooltip {
        cursor: pointer;
        display: inline-block;
        font-size: 1.5em;
        transition: transform 0.2s ease;
      }
      
      .wmo-emoji-with-tooltip:hover {
        transform: scale(1.2);
      }
      
      /* Amélioration des tooltips natifs */
      [title] {
        position: relative;
      }
      
      /* Style pour le tableau quotidien */
      .daily-table .wmo-slot-cell {
        min-width: 50px;
        height: 50px;
        vertical-align: middle;
      }
      
      /* Animation pour les emojis */
      .wmo-emoji {
        font-size: 1.5em;
        transition: all 0.2s ease;
      }
      
      .wmo-emoji:hover {
        transform: scale(1.2) rotate(5deg);
      }
    `;
    document.head.appendChild(style);
  }

  // Exposer le module
  if (!window.TestAlgoModules) {
    window.TestAlgoModules = {};
  }

  window.TestAlgoModules.final_params = finalParamsModule;

  // Injecter les styles au chargement
  injectStyles();

  console.log(
    "✅ [Final Params JS] Module final_params exposé avec styles smart_bary"
  );
})();
