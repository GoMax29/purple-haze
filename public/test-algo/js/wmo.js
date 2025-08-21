// Module WMO (matrice 168h + tableau agrégé)
(function () {
  "use strict";

  const {
    injectSpinner,
    showError,
    formatHour,
    getWmoIcon,
    getWmoDescription,
    getPastelColor,
    getContrastColor,
  } = window.TestAlgoCommon;

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

  function getStartHourRounded() {
    const now = new Date();
    const roundedHour = Math.floor(now.getHours() / 4) * 4;
    const startTime = new Date(now);
    startTime.setHours(roundedHour, 0, 0, 0);
    return startTime;
  }

  function generateTimeStamps() {
    const startTime = getStartHourRounded();
    const timestamps = [];
    for (let i = 0; i < 42; i++) {
      const t = new Date(startTime);
      t.setHours(startTime.getHours() + i * 4);
      timestamps.push(t);
    }
    return timestamps;
  }

  function formatColumnHeader(date) {
    const dayNames = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
    const dayName = dayNames[date.getDay()];
    const day = date.getDate();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    return `${dayName} ${day}/${month} - ${hour}h`;
  }

  function extractMultiHourWmoData(meteoData, wmoConfig = null) {
    if (!meteoData?.api1?.data?.hourly)
      throw new Error("Données météo invalides");
    const hourlyData = meteoData.api1.data.hourly;
    const allModels = meteoData.api1.models;
    const timestamps = hourlyData.time;
    const targetTimestamps = generateTimeStamps();
    const multiHourData = [];

    targetTimestamps.forEach((targetTime, columnIndex) => {
      const targetISOString = targetTime.toISOString();
      let foundIndex = -1;
      for (let i = 0; i < timestamps.length; i++) {
        const dataTime = new Date(timestamps[i]);
        if (Math.abs(dataTime.getTime() - targetTime.getTime()) < 3600000) {
          foundIndex = i;
          break;
        }
      }

      const columnData = { datetime: targetISOString, columnIndex, models: {} };
      if (foundIndex !== -1) {
        // Calculer l'heure de prévision pour cette colonne
        const forecastHour = columnIndex * 4;

        // Filtrer les modèles selon la configuration wmo.json si disponible
        let modelsToUse = allModels;
        if (wmoConfig && wmoConfig.models) {
          modelsToUse = allModels.filter((modelKey) => {
            const modelConfig = wmoConfig.models[modelKey];
            if (!modelConfig || !modelConfig.enabled) {
              return false;
            }

            // Vérifier si le modèle est dans sa plage d'échéances
            const [minHour, maxHour] = modelConfig.forecast_hours || [0, 168];
            return forecastHour >= minHour && forecastHour <= maxHour;
          });
        }

        modelsToUse.forEach((modelKey) => {
          const wmoParameterKey = `weather_code_${modelKey}`;
          if (
            hourlyData[wmoParameterKey] &&
            hourlyData[wmoParameterKey][foundIndex] !== null
          ) {
            columnData.models[modelKey] =
              hourlyData[wmoParameterKey][foundIndex];
          }
        });

        // Fallback vers modèles globaux si aucun modèle configuré n'a de données (zones non couvertes)
        if (Object.keys(columnData.models).length === 0 && wmoConfig) {
          const fallbackModels = ["ecmwf_ifs025", "gfs_global", "icon_global"];

          for (const fallbackKey of fallbackModels) {
            const fallbackParameterKey = `weather_code_${fallbackKey}`;

            if (
              hourlyData[fallbackParameterKey] &&
              hourlyData[fallbackParameterKey][foundIndex] !== null
            ) {
              columnData.models[fallbackKey] =
                hourlyData[fallbackParameterKey][foundIndex];
              console.log(
                `[WMO Matrix] H+${forecastHour}: Fallback ${fallbackKey} (zone non couverte) → code ${hourlyData[fallbackParameterKey][foundIndex]}`
              );
              break; // Arrêter dès qu'on trouve une valeur
            }
          }
        }
      }
      multiHourData.push(columnData);
    });

    // Log du filtrage pour la première colonne à titre d'exemple
    if (wmoConfig && wmoConfig.models && multiHourData.length > 0) {
      const firstColumnModels = Object.keys(multiHourData[0].models).length;
      console.log(
        `[WMO Matrix] Modèles filtrés: ${firstColumnModels}/${allModels.length} modèles affichés selon config wmo.json`
      );
    }

    return multiHourData;
  }

  function groupMultiHourDataBySeverity(multiHourData) {
    const groupedData = [];
    WMO_SEVERITY_GROUPS.forEach((group, groupIndex) => {
      groupedData[groupIndex] = [];
      multiHourData.forEach((columnData, columnIndex) => {
        groupedData[groupIndex][columnIndex] = {
          groupInfo: group,
          columnIndex,
          datetime: columnData.datetime,
          codesByCode: {},
        };
      });
    });
    multiHourData.forEach((columnData, columnIndex) => {
      Object.entries(columnData.models).forEach(([modelKey, wmoCode]) => {
        const groupIndex = WMO_SEVERITY_GROUPS.findIndex((g) =>
          g.codes.includes(wmoCode)
        );
        if (groupIndex !== -1) {
          const cell = groupedData[groupIndex][columnIndex];
          if (!cell.codesByCode[wmoCode]) cell.codesByCode[wmoCode] = [];
          cell.codesByCode[wmoCode].push(modelKey);
        }
      });
    });
    return groupedData;
  }

  function renderWmoPanels(codesByCode, groupBgColor) {
    const panels = [];
    const sortedEntries = Object.entries(codesByCode).sort(
      (a, b) => parseInt(b[0]) - parseInt(a[0])
    );
    sortedEntries.forEach(([wmoCode, models]) => {
      const pastel = getPastelColor(groupBgColor);
      panels.push(`
        <div class="wmo-panel" style="background-color:${pastel};">
          <div class="model-count-badge">${models.length}</div>
          <div class="wmo-panel-content"><img src="/icons/wmo/${getWmoIcon(
            parseInt(wmoCode)
          )}" class="wmo-panel-icon-60" alt="WMO ${wmoCode}"/></div>
          <div class="aggregated-code-badge">${wmoCode}</div>
          <div class="model-badges">${models
            .map((m) => {
              const cfg = MODEL_CONFIG[m];
              if (!cfg) return `<span class="model-badge unknown">?</span>`;
              return `<span class="model-badge" style="background-color:${
                cfg.color
              };color:${getContrastColor(cfg.color)};">${cfg.shortCode}</span>`;
            })
            .join("")}</div>
        </div>
      `);
    });
    return `<div class="wmo-panels-vertical">${panels.join("")}</div>`;
  }

  function renderExtendedWmoGroupRow(group, groupColumns) {
    const codesList = group.codes.map((c) => `[${c}]`).join(" ");
    const columnCells = groupColumns
      .map((columnData) => {
        const hasData = Object.keys(columnData.codesByCode).length > 0;
        return `<td class="wmo-panels-cell-extended">${
          hasData
            ? renderWmoPanels(columnData.codesByCode, group.bgColor)
            : '<div class="no-data-mini">-</div>'
        }</td>`;
      })
      .join("");
    return `
      <tr class="wmo-group-row" style="background-color:${group.bgColor};">
        <td class="group-name-cell-extended"><strong>${group.name}</strong><small>Codes WMO : ${codesList}</small></td>
        ${columnCells}
      </tr>
    `;
  }

  function renderDebugAggregationRow(debugInfo, columnCount) {
    const debugCells = Array(columnCount)
      .fill(0)
      .map((_, index) => {
        const info = debugInfo[index];
        if (!info) return '<td class="wmo-debug-cell">-</td>';
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
        <td class="group-name-cell-extended debug-header"><strong>Debug Agrégation</strong><small>(Seuil, Groupe, Type)</small></td>
        ${debugCells}
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
        <tr class="wmo-aggregated-row"><td class="group-name-cell-extended"><strong>Résultat Agrégé</strong></td>${emptyCells}</tr>
        ${renderDebugAggregationRow([], columnCount)}
      `;
    }

    const startHour = getStartHourRounded().getHours();
    const aggregatedFiltered = [];
    const debugInfo = [];
    for (let i = 0; i < columnCount; i++) {
      const realHourIndex = startHour + i * 4;
      const value =
        realHourIndex < aggregated.length ? aggregated[realHourIndex] : null;
      aggregatedFiltered.push(value);
      if (value) {
        const dbg = value.debug || {};
        debugInfo.push({
          hour: `H+${realHourIndex}`,
          threshold: dbg.threshold || "N/A",
          group: dbg.selectedGroup || "N/A",
          code: value.value,
          type: dbg.selectionType || "N/A",
        });
      } else debugInfo.push(null);
    }

    const cells = aggregatedFiltered
      .map((agg) => {
        if (!agg || (agg.value !== 0 && !agg.value))
          return '<td class="wmo-panels-cell-extended"><div class="no-data-mini">-</div></td>';
        const icon = `/icons/wmo/${getWmoIcon(agg.value)}`;
        const groupInfo = WMO_SEVERITY_GROUPS.find((g) =>
          g.codes.includes(agg.value)
        );
        return `
          <td class="wmo-panels-cell-extended">
            <div class="wmo-aggregated-mini" style="background-color:${
              groupInfo?.bgColor || "#f0f0f0"
            };">
              <img src="${icon}" class="wmo-icon-mini" alt="WMO ${agg.value}"/>
              <div class="aggregated-code-badge">${agg.value}</div>
            </div>
          </td>
        `;
      })
      .join("");

    return `
      <tr class="wmo-aggregated-row"><td class="group-name-cell-extended"><strong>Résultat Agrégé</strong><small>(Algorithme sévérité)</small></td>${cells}</tr>
      ${renderDebugAggregationRow(debugInfo, columnCount)}
    `;
  }

  function renderExtendedWmoMatrix(multiHourData, aggregated) {
    const matrixEl = document.getElementById("wmo-matrix");
    if (!matrixEl) return;
    const groupedData = groupMultiHourDataBySeverity(multiHourData);
    const timestamps = generateTimeStamps();
    const columnHeaders = timestamps.map(formatColumnHeader);
    const tableHTML = `
      <div class="extended-wmo-container">
        <table class="extended-wmo-table">
          <thead><tr><th class="group-header-extended">Conditions Météo (par sévérité)</th>${columnHeaders
            .map((h) => `<th class="time-header-extended">${h}</th>`)
            .join("")}</tr></thead>
          <tbody>
            ${WMO_SEVERITY_GROUPS.map((g, gi) =>
              renderExtendedWmoGroupRow(g, groupedData[gi])
            ).join("")}
            ${renderExtendedAggregatedRow(aggregated, timestamps.length)}
          </tbody>
        </table>
      </div>
    `;
    matrixEl.innerHTML = tableHTML;
  }

  // ----------- Compteurs modèles + cartes de risque -----------
  function updateExtendedWmoStats(multiHourData) {
    const allModels = new Set();
    const allCodes = [];
    multiHourData.forEach((columnData) => {
      Object.entries(columnData.models).forEach(([modelKey, code]) => {
        allModels.add(modelKey);
        allCodes.push(code);
      });
    });

    const modelsCountBadge = document.getElementById("wmo-models-count");
    if (modelsCountBadge)
      modelsCountBadge.textContent = `${allModels.size} modèles`;

    updateExtendedRiskStats(allCodes);
  }

  function updateExtendedRiskStats(allCodes) {
    const riskStatsElement = document.getElementById("wmo-risk-stats");
    if (!riskStatsElement) return;

    const thunderRisk = allCodes.filter((c) => [95, 96, 99].includes(c)).length;
    const hailRisk = allCodes.filter((c) => [96, 99].includes(c)).length;
    const iceRisk = allCodes.filter((c) => [56, 57, 66, 67].includes(c)).length;
    const fogRisk = allCodes.filter((c) => [45, 48].includes(c)).length;

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

  // ----------- Agrégé (logs + stats) -----------
  let aggregatedWmoConfig = null;
  let aggregatedLogEntries = [];

  function addAggregatedLog(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    aggregatedLogEntries.push({
      level,
      message: `[${timestamp}] ${level.toUpperCase()}: ${message}`,
      timestamp,
    });
    const logContent = document.getElementById("aggregated-log-content");
    if (logContent) {
      const el = document.createElement("div");
      el.className = `aggregated-log-entry agg-log-${level}`;
      el.textContent =
        aggregatedLogEntries[aggregatedLogEntries.length - 1].message;
      logContent.appendChild(el);
      logContent.scrollTop = logContent.scrollHeight;
    }
  }

  function clearAggregatedLogs() {
    aggregatedLogEntries = [];
    const logContent = document.getElementById("aggregated-log-content");
    if (logContent) logContent.innerHTML = "";
    addAggregatedLog("info", "Logs vidés");
  }

  async function loadAggregatedWmoConfig() {
    const res = await fetch("/api/config/wmo");
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const result = await res.json();
    if (!result.success) throw new Error(result.error || "Erreur config");
    aggregatedWmoConfig = result.data;
    const badge = document.getElementById("wmo-agg-algorithm");
    if (badge) badge.textContent = aggregatedWmoConfig.algorithm;
    return aggregatedWmoConfig;
  }

  async function callAggregatedWmoProcessing(config) {
    const { lat, lon } = config.coords;
    const res = await fetch(
      `${config.endpoints.wmo}/agg?lat=${lat}&lon=${lon}`
    );
    if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
    const result = await res.json();
    if (!result.success)
      throw new Error(result.error || "Erreur lors du traitement");
    return result.data;
  }

  async function loadAggregatedWmoData(config) {
    const loadBtn = document.getElementById("load-aggregated-btn");
    const loading = document.getElementById("aggregated-loading");
    const tableWrapper = document.getElementById("aggregated-table-wrapper");
    const statsContainer = document.getElementById("aggregated-stats");
    const errorContainer = document.getElementById("aggregated-error");
    try {
      if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.textContent = "⏳ Chargement...";
      }
      if (loading) loading.style.display = "block";
      if (errorContainer) errorContainer.style.display = "none";
      if (!aggregatedWmoConfig) await loadAggregatedWmoConfig();
      const data = await callAggregatedWmoProcessing(config);
      generateAggregatedWmoTable(data);
      displayAggregatedStats(data);
      if (tableWrapper) tableWrapper.style.display = "block";
      if (statsContainer) statsContainer.style.display = "block";
    } catch (e) {
      if (errorContainer) {
        errorContainer.style.display = "block";
        errorContainer.textContent = e.message;
      }
    } finally {
      if (loadBtn) {
        loadBtn.disabled = false;
        loadBtn.textContent = "🔄 Charger données agrégées";
      }
      if (loading) loading.style.display = "none";
    }
  }

  function generateAggregatedWmoTable(data) {
    const tbody = document.getElementById("aggregated-wmo-tbody");
    const hourHeaders = document.getElementById("aggregated-hour-headers");
    if (!tbody || !hourHeaders) return;
    hourHeaders.innerHTML = "";
    for (let h = 0; h < 24; h++) {
      const th = document.createElement("th");
      th.className = "hour-cell-agg";
      th.textContent = h.toString().padStart(2, "0");
      hourHeaders.appendChild(th);
    }
    const dayGroups = [];
    for (let day = 0; day < 7; day++) {
      const dayData = [];
      for (let hour = 0; hour < 24; hour++) {
        const idx = day * 24 + hour;
        dayData.push(idx < data.length ? data[idx] : null);
      }
      dayGroups.push(dayData);
    }
    tbody.innerHTML = "";
    dayGroups.forEach((dayData, dayIndex) => {
      const tr = document.createElement("tr");
      const dayCell = document.createElement("td");
      dayCell.className = "aggregated-day-cell";
      dayCell.textContent = `J+${dayIndex}`;
      tr.appendChild(dayCell);
      const hourStartCell = document.createElement("td");
      hourStartCell.className = "aggregated-hour-start-cell";
      hourStartCell.textContent = `${dayIndex * 24}h`;
      tr.appendChild(hourStartCell);
      dayData.forEach((hourData) => {
        const td = document.createElement("td");
        td.className = "aggregated-wmo-cell";
        if (
          hourData &&
          (hourData.value === 0 ||
            (hourData.value !== null && hourData.value !== undefined))
        ) {
          const codeDiv = document.createElement("div");
          codeDiv.className = "aggregated-wmo-code-simple";
          codeDiv.textContent = hourData.value;
          td.appendChild(codeDiv);
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
  }

  function displayAggregatedStats(data) {
    const statsContent = document.getElementById("aggregated-stats-content");
    if (!statsContent) return;
    const validData = data.filter(
      (d) => d && (d.value === 0 || (d.value !== null && d.value !== undefined))
    );
    const codeDistribution = {};
    validData.forEach(
      (d) => (codeDistribution[d.value] = (codeDistribution[d.value] || 0) + 1)
    );
    statsContent.innerHTML = `
      <div class="aggregated-stat-item"><div class="aggregated-stat-label">Points de données valides:</div><div class="aggregated-stat-value">${
        validData.length
      }/${data.length}</div></div>
      <div class="aggregated-stat-item"><div class="aggregated-stat-label">Plage temporelle:</div><div class="aggregated-stat-value">${
        data[0]?.datetime
      } → ${data[data.length - 1]?.datetime}</div></div>
      <div class="aggregated-stat-item"><div class="aggregated-stat-label">Distribution des codes WMO:</div><div class="aggregated-stat-value">${Object.entries(
        codeDistribution
      )
        .map(([c, n]) => `${c}(${n})`)
        .join(", ")}</div></div>
    `;
  }

  function initWmo(config) {
    const matrixEl = document.getElementById("wmo-matrix");
    injectSpinner(matrixEl);
    const { lat, lon } = config.coords;
    Promise.all([
      fetch(`/api/fetchMeteoData?lat=${lat}&lon=${lon}`),
      fetch(`${config.endpoints.wmo}?lat=${lat}&lon=${lon}`, {
        headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
      }),
      loadAggregatedWmoConfig().catch(() => null), // Charger la config WMO
    ])
      .then(async ([rawRes, aggRes, wmoConfig]) => {
        if (!rawRes.ok || !aggRes.ok)
          throw new Error(`HTTP ${rawRes.status}/${aggRes.status}`);
        const meteoData = await rawRes.json();
        const agg = await aggRes.json();
        const aggregated = agg.data;
        const multiHourData = extractMultiHourWmoData(meteoData, wmoConfig);
        renderExtendedWmoMatrix(multiHourData, aggregated);
        updateExtendedWmoStats(multiHourData);
        // init agrégé
        initializeAggregatedWmoTable(config);
      })
      .catch((e) => {
        if (matrixEl)
          matrixEl.innerHTML = `<div class="error-message">❌ ${e.message}</div>`;
      });
  }

  function initializeAggregatedWmoTable(config) {
    const coordsElement = document.getElementById("aggregated-coords");
    if (coordsElement)
      coordsElement.textContent = `lat=${config.coords.lat}, lon=${config.coords.lon}`;
    const loadBtn = document.getElementById("load-aggregated-btn");
    if (loadBtn)
      loadBtn.addEventListener("click", () => loadAggregatedWmoData(config));
    loadAggregatedWmoConfig().catch((e) => {
      const err = document.getElementById("aggregated-error");
      if (err) {
        err.style.display = "block";
        err.textContent = e.message;
      }
    });
    window.clearAggregatedLogs = clearAggregatedLogs;
    window.loadAggregatedWmoData = () => loadAggregatedWmoData(config);
  }

  window.TestAlgoRegisterModule("wmo", { init: initWmo });
})();
