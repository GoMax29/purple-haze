// Module Précipitations mm/%
(function () {
  "use strict";

  const { formatHour, injectSpinner, showError } = window.TestAlgoCommon;

  // Configuration des modèles avec couleurs et abréviations (+ alias robustes)
  const MODEL_CONFIG = {
    icon_seamless: { color: "#60A5FA", shortCode: "ICON" },
    ukmo_seamless: { color: "#34D399", shortCode: "UKMO" },
    // Canonical keys
    meteofrance_arome_france: { color: "#3498DB", shortCode: "A" },
    meteofrance_arome_france_hd: { color: "#A3C6FF", shortCode: "A+" },
    meteofrance_arpege_europe: { color: "#BBDEFB", shortCode: "AR" },
    icon_eu: { color: "#FFFF6B", shortCode: "IE" },
    icon_global: { color: "#F39C12", shortCode: "IG" },
    ukmo_global_deterministic_10km: { color: "#58D68D", shortCode: "UG" },
    ukmo_uk_deterministic_2km: { color: "#A3E4D7", shortCode: "U2" },
    gfs_graphcast025: { color: "#FF7E79", shortCode: "GR" },
    gfs_global: { color: "#FFB3AB", shortCode: "GF" },
    ecmwf_ifs025: { color: "#b17652", shortCode: "EC" },
    knmi_harmonie_arome_europe: { color: "#CE93D8", shortCode: "HA" },

    // Aliases courts rencontrés dans les données
    a: { color: "#3498DB", shortCode: "A" },
    "a+": { color: "#A3C6FF", shortCode: "A+" },
    ar: { color: "#BBDEFB", shortCode: "AR" },
    ie: { color: "#FFFF6B", shortCode: "IE" },
    ig: { color: "#F39C12", shortCode: "IG" },
    ic: { color: "#F39C12", shortCode: "IC" }, // fallback ICON
    uk: { color: "#58D68D", shortCode: "UK" },
    ug: { color: "#58D68D", shortCode: "UG" },
    u2: { color: "#A3E4D7", shortCode: "U2" },
    gr: { color: "#FF7E79", shortCode: "GR" },
    gf: { color: "#FFB3AB", shortCode: "GF" },
    ec: { color: "#b17652", shortCode: "EC" },
    ew: { color: "#b17652", shortCode: "EW" },
    ha: { color: "#CE93D8", shortCode: "HA" },
  };

  let precipitationData = null;
  let precipitationChart = null;
  let showModelsFlag = true;
  let showWetOnlyFlag = false;
  let zoomPluginRegistered = false;
  let zoomLoadPromise = null;

  function normalizeKey(key) {
    if (!key) return "";
    return String(key).trim().toLowerCase();
  }

  // Mappe n'importe quel identifiant vu dans les données vers une clé canonique/alias connue
  function resolveModelConfigKey(raw) {
    const k = normalizeKey(raw);
    if (MODEL_CONFIG[k]) return k;
    // Quelques règles simples
    if (k.includes("arpege")) return "meteofrance_arpege_europe";
    if (k.includes("arome") && k.includes("hd"))
      return "meteofrance_arome_france_hd";
    if (k.includes("arome")) return "meteofrance_arome_france";
    if (k.includes("graphcast")) return "gfs_graphcast025";
    if (k.includes("gfs")) return "gfs_global";
    if (k.includes("ecmwf") || k === "ec") return "ec";
    if (k.includes("icon")) return k.includes("eu") ? "ie" : "ig";
    if (k.includes("icon_seamless")) return "icon_seamless";
    if (k.includes("ukmo_seamless")) return "ukmo_seamless";
    if (k.includes("ukmo") && k.includes("2")) return "u2";
    if (k.includes("ukmo")) return "ug";
    if (k.includes("harmonie") || k.includes("knmi")) return "ha";
    return k; // fallback
  }

  function ensureZoomPluginLoaded() {
    if (typeof window.ChartZoom !== "undefined") {
      return Promise.resolve(true);
    }
    if (zoomLoadPromise) return zoomLoadPromise;
    zoomLoadPromise = new Promise((resolve) => {
      const s = document.createElement("script");
      s.src =
        "https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.0.1/dist/chartjs-plugin-zoom.min.js";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    });
    return zoomLoadPromise;
  }

  async function init(config) {
    try {
      await fetchAndRenderPrecipitation(config);
    } catch (error) {
      console.error("Erreur module précipitations:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module precipitation: ${error.message}`
      );
    }
  }

  async function fetchAndRenderPrecipitation(config) {
    const url = `${config.endpoints.precipitation}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Erreur lors du traitement");

    precipitationData = result.data;
    // Charger le plugin de zoom si besoin avant rendu
    await ensureZoomPluginLoaded();
    renderPrecipitationData(precipitationData);
    setupInteractions();
  }

  function renderPrecipitationData(data) {
    renderStats(data);
    renderHybridChart(data);
    renderVisualizationMethods(data);
    renderDetailedAnalysis(data);
  }

  function renderStats(data) {
    const statsElement = document.getElementById("precip-stats");
    if (!statsElement) return;

    const maxMm = Math.max(...data.map((d) => d.mm_agg));
    const avgPoP = data.reduce((sum, d) => sum + d.PoP, 0) / data.length;
    const wetHours = data.filter((d) => d.mouillant.length > 0).length;

    statsElement.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${data.length}</div>
        <div class="stat-label">Points de données</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${maxMm.toFixed(1)}mm</div>
        <div class="stat-label">Précip. maximale</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Math.round(avgPoP)}%</div>
        <div class="stat-label">PoP moyenne</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${wetHours}</div>
        <div class="stat-label">Heures mouillantes</div>
      </div>
    `;
  }

  function renderHybridChart(data) {
    const canvas = document.getElementById("precipitation-chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");

    // Enregistrer le plugin zoom si disponible (cdn chartjs-plugin-zoom)
    if (
      !zoomPluginRegistered &&
      typeof window.Chart !== "undefined" &&
      window.Chart?.registry?.plugins &&
      typeof window.ChartZoom !== "undefined"
    ) {
      window.Chart.register(window.ChartZoom);
      zoomPluginRegistered = true;
    }

    // Détruire le chart existant
    if (precipitationChart) {
      precipitationChart.destroy();
    }

    const labels = data.map((_, index) => `H${index}`);

    // Dataset agrégation (fine barre noire, pile dédiée)
    const aggregationDataset = {
      label: "AGRÉGATION",
      data: data.map((d) => d.mm_agg || 0),
      type: "bar",
      backgroundColor: "#000000",
      borderColor: "#000000",
      borderWidth: 2,
      stack: "aggregation",
      order: -10,
      barThickness: 2,
      yAxisID: "y",
    };

    // Datasets modèles empilés
    const allModels = new Set();
    data.forEach((d) =>
      d.mouillant.forEach((m) => allModels.add(resolveModelConfigKey(m.model)))
    );
    const modelDatasets = [...allModels].map((rawKey) => {
      const key = resolveModelConfigKey(rawKey);
      const config = MODEL_CONFIG[key] || {
        color: "#9CA3AF",
        shortCode: key.substring(0, 2).toUpperCase(),
      };
      const modelData = data.map((d) => {
        const found = d.mouillant.find(
          (m) => resolveModelConfigKey(m.model) === key
        );
        return found ? found.mm : 0; // garder la pile alignée
      });
      return {
        label: config.shortCode.toUpperCase(),
        data: modelData,
        type: "bar",
        backgroundColor: config.color,
        borderColor: config.color,
        borderWidth: 1,
        stack: "models",
        order: 0,
        yAxisID: "y",
      };
    });

    const datasets = [aggregationDataset, ...modelDatasets];

    precipitationChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: "Précipitations (mm) — Agrégation + modèles empilés",
          },
          legend: {
            display: true,
            position: "top",
            labels: {
              generateLabels(chart) {
                // Légende: AGRÉGATION + modèles (abréviations)
                const ds = chart.data.datasets;
                return ds.map((dataset, i) => ({
                  text: dataset.label,
                  fillStyle: dataset.backgroundColor,
                  strokeStyle: dataset.borderColor,
                  lineWidth: 1,
                  datasetIndex: i,
                  hidden: chart.isDatasetVisible(i) === false,
                }));
              },
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
            itemSort: (a, b) => (b.parsed.y ?? 0) - (a.parsed.y ?? 0),
            callbacks: {
              title: function (context) {
                const index = context[0].dataIndex;
                const hourData = data[index];
                return `Heure H${index} - ${new Date(
                  hourData.datetime
                ).toLocaleString("fr-FR")}`;
              },
              beforeBody: function (context) {
                // Injecter la valeur d'agrégation comme une entrée de modèle pour l'ordre
                const idx = context[0].dataIndex;
                const val = data[idx]?.mm_agg ?? 0;
                return val > 0 ? [`AGRÉGATION: ${val.toFixed(2)} mm`] : [];
              },
              label: function (context) {
                const label = context.dataset.label || "";
                const value = context.parsed.y;
                if (value == null) return null;
                return `${label}: ${value.toFixed(2)} mm`;
              },
              afterBody: function (context) {
                const index = context[0].dataIndex;
                const hourData = data[index];
                const prop = `${hourData.mouillant.length}/$${
                  hourData.totalModels || 11
                }`;
                const extra = [
                  `PoP: ${hourData.PoP.toFixed(1)}%`,
                  `Prop. mouillant: ${prop}`,
                  `CI: ${hourData.CI}%`,
                  `IQR: ${hourData.IQR.toFixed(2)} mm`,
                ];

                const stats = document.getElementById("precip-hour-stats");
                if (stats) {
                  stats.innerHTML = `
                    <span style="background:#ef4444; color:#fff; padding:2px 6px; border-radius:999px;">PoP ${hourData.PoP.toFixed(
                      1
                    )}%</span>
                    <span style="background:#0ea5e9; color:#fff; padding:2px 6px; border-radius:999px;">${
                      hourData.mouillant.length
                    }/${hourData.totalModels || 11} mouillants</span>
                    <span style="background:#f59e0b; color:#111827; padding:2px 6px; border-radius:999px;">IQR ${hourData.IQR.toFixed(
                      2
                    )} mm</span>
                    <span style="background:#10b981; color:#064e3b; padding:2px 6px; border-radius:999px;">CI ${
                      hourData.CI
                    }%</span>
                  `;
                }
                return "\n" + extra.join("\n");
              },
            },
          },
          zoom: {
            zoom: {
              wheel: { enabled: true },
              pinch: { enabled: true },
              drag: {
                enabled: true,
                backgroundColor: "rgba(37, 99, 235, 0.2)",
              },
              mode: "x",
              onZoomComplete: function () {
                const btn = document.getElementById("precip-zoom-reset");
                if (btn) btn.style.display = "inline-block";
              },
            },
            pan: { enabled: true, mode: "x" },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Heures de prévision" },
            stacked: true,
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: { display: true, text: "Précipitations (mm)" },
            beginAtZero: true,
            stacked: true,
          },
        },
      },
    });

    // Plus de légende custom ni boutons superflus

    // Bouton reset zoom
    const resetBtn = document.getElementById("precip-zoom-reset");
    if (resetBtn) {
      resetBtn.onclick = () => {
        if (precipitationChart && precipitationChart.resetZoom) {
          precipitationChart.resetZoom();
        }
        resetBtn.style.display = "none";
      };
    }
  }

  function renderModelsLegend() {
    const legendElement = document.getElementById("models-legend");
    if (!legendElement) return;

    const legendItems = Object.entries(MODEL_CONFIG)
      .map(
        ([key, config]) =>
          `<div class="legend-item">
        <div class="legend-color" style="background-color: ${config.color}"></div>
        <span>${config.shortCode}</span>
      </div>`
      )
      .join("");

    legendElement.innerHTML = legendItems;
  }

  function renderVisualizationMethods(data) {
    const wetHours = data.filter((d) => d.mouillant.length > 0);

    renderSimpleMethod(wetHours);
    renderStackedMethod(wetHours);
    renderSpaghettiMethod(wetHours);
    renderHistogramMethod(wetHours);
    renderEnvelopeMethod(wetHours);
    renderPolarMethod(data);
  }

  // --- Méthode 6: Polar Area par heure avec slider ---
  function getOrderedModelKeys() {
    // Priorité: Arome HD, Arpège, ICON, UKMO, ECMWF, GraphCast (puis autres)
    const desired = [
      "meteofrance_arome_france_hd",
      "meteofrance_arpege_europe",
      "icon_seamless",
      "ukmo_seamless",
      "ecmwf_ifs025",
      "gfs_graphcast025",
      "icon_eu",
      "icon_global",
      "ukmo_uk_deterministic_2km",
      "ukmo_global_deterministic_10km",
    ];
    return desired;
  }

  function modelDisplayName(key) {
    const map = {
      meteofrance_arome_france_hd: "Arome HD",
      meteofrance_arpege_europe: "Arpège",
      icon_seamless: "ICON",
      ukmo_seamless: "UKMO",
      ecmwf_ifs025: "ECMWF",
      gfs_graphcast025: "GraphCast",
      icon_eu: "ICON EU",
      icon_global: "ICON G",
      ukmo_uk_deterministic_2km: "UKMO 2km",
      ukmo_global_deterministic_10km: "UKMO 10km",
    };
    return map[key] || MODEL_CONFIG[key]?.shortCode || key.toUpperCase();
  }

  function toLogRadius(mm) {
    const val = Math.max(0, mm || 0);
    const log = Math.log10(val + 1); // 0..~1.041
    // retourner directement log; l'échelle radiale aura max ~1.1
    return log;
  }

  let polarChart = null;
  function renderPolarAtIndex(data, hourIndex) {
    const container = document.getElementById("viz-polar");
    const canvas = document.getElementById("precip-polar-canvas");
    const label = document.getElementById("precip-polar-label");
    if (!container || !canvas || !label) return;

    // Construire le vecteur des modèles en ordre souhaité
    const models = getOrderedModelKeys();

    // Extraire les mm par modèle depuis data[hourIndex]
    const hour = data[hourIndex] || data[0];
    const valuesByModel = {};
    models.forEach((m) => (valuesByModel[m] = 0));
    // Les modèles présents (mouillant) ont mm > 0; les autres restent à 0
    (hour.mouillant || []).forEach((m) => {
      const key = resolveModelConfigKey(m.model);
      if (key in valuesByModel) valuesByModel[key] = m.mm ?? 0;
    });

    const labels = models.map((m) => modelDisplayName(m));
    const dataValues = models.map((m) => toLogRadius(valuesByModel[m]));
    const baseColors = [
      "#7C3AED", // violet
      "#3B82F6", // bleu
      "#06B6D4", // cyan
      "#14B8A6", // turquoise
      "#A78BFA", // indigo clair
      "#60A5FA", // bleu clair
    ];
    const bgColors = models.map(
      (_, i) => baseColors[i % baseColors.length] + "55"
    );
    const borderColors = models.map(
      (_, i) => baseColors[i % baseColors.length]
    );

    const ctx = canvas.getContext("2d");
    if (polarChart) {
      polarChart.destroy();
    }

    const dateStr = new Date(hour.datetime).toLocaleString("fr-FR");
    label.textContent = `Heure: ${dateStr}`;

    polarChart = new Chart(ctx, {
      type: "polarArea",
      data: {
        labels,
        datasets: [
          {
            label: "mm/h (log)",
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: 1.1, // ~log10(11)
            ticks: {
              callback: (val) => {
                // afficher ticks en mm/h approximés: inverse de log10(x+1)
                const mm = Math.pow(10, Number(val)) - 1;
                const rounded =
                  mm >= 1 ? Math.round(mm) : Math.round(mm * 10) / 10;
                return `${rounded} mm/h`;
              },
            },
          },
        },
        plugins: {
          legend: { position: "right" },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const mm = Math.pow(10, ctx.parsed) - 1;
                const rounded = mm >= 1 ? mm.toFixed(1) : mm.toFixed(2);
                return `${ctx.label}: ${rounded} mm/h`;
              },
            },
          },
          title: {
            display: true,
            text: "Comparaison précipitations par modèles (échelle radiale log)",
          },
        },
      },
    });
  }

  function renderPolarMethod(data) {
    const container = document.getElementById("viz-polar");
    if (!container) return;

    const slider = document.getElementById("precip-polar-slider");
    const maxIndex = Math.max(0, data.length - 1);
    if (slider) {
      slider.max = String(maxIndex);
      slider.value = "0";
      slider.oninput = (e) => {
        const idx = Number(e.target.value || 0);
        renderPolarAtIndex(data, Math.min(maxIndex, Math.max(0, idx)));
      };
    }
    renderPolarAtIndex(data, 0);
  }

  function renderSimpleMethod(wetHours) {
    const container = document.getElementById("viz-simple");
    if (!container) return;

    const items = wetHours
      .slice(0, 12)
      .map(
        (hour, index) =>
          `<div class="simple-bar" style="display: inline-block; margin: 2px; text-align: center;">
        <div style="width: 30px; height: ${Math.max(
          5,
          hour.mm_agg * 20
        )}px; background: #3b82f6; margin-bottom: 2px;"></div>
        <div style="font-size: 10px; color: #666;">H${wetHours.indexOf(
          hour
        )}</div>
        <div style="font-size: 8px; background: #ef4444; color: white; border-radius: 8px; padding: 1px 3px; margin-top: 2px;">${Math.round(
          hour.PoP
        )}%</div>
      </div>`
      )
      .join("");

    container.innerHTML = `<div style="display: flex; flex-wrap: wrap; justify-content: center;">${items}</div>`;
  }

  function renderStackedMethod(wetHours) {
    const container = document.getElementById("viz-stacked");
    if (!container) return;

    const items = wetHours
      .slice(0, 8)
      .map((hour) => {
        const sortedModels = [...hour.mouillant].sort((a, b) => a.mm - b.mm);
        let stackHtml = "";
        let cumHeight = 0;

        sortedModels.forEach((model) => {
          const config = MODEL_CONFIG[model.model] || { color: "#9CA3AF" };
          const height = Math.max(3, model.mm * 15);
          const opacity = Math.min(1, 0.3 + sortedModels.length * 0.15);

          stackHtml += `<div style="height: ${height}px; background: ${config.color}; opacity: ${opacity}; border: 1px solid white;"></div>`;
        });

        return `<div style="display: inline-block; margin: 2px; text-align: center;">
        <div style="width: 25px; display: flex; flex-direction: column-reverse; align-items: stretch;">${stackHtml}</div>
        <div style="font-size: 9px; color: #666; margin-top: 2px;">H${wetHours.indexOf(
          hour
        )}</div>
      </div>`;
      })
      .join("");

    container.innerHTML = `<div style="display: flex; justify-content: center;">${items}</div>`;
  }

  function renderSpaghettiMethod(wetHours) {
    const container = document.getElementById("viz-spaghetti");
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");

    // Fond agrégé
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
    wetHours.slice(0, 10).forEach((hour, i) => {
      const x = (i / 9) * 260 + 10;
      const height = Math.max(5, hour.mm_agg * 30);
      ctx.fillRect(x - 5, 140 - height, 10, height);
    });

    // Lignes spaghetti
    const modelOffsets = {};
    let offsetCounter = 0;
    wetHours.slice(0, 10).forEach((hour, i) => {
      hour.mouillant.forEach((model) => {
        if (!modelOffsets[model.model]) {
          modelOffsets[model.model] = offsetCounter++ * 3;
        }

        const config = MODEL_CONFIG[model.model] || { color: "#9CA3AF" };
        const x = (i / 9) * 260 + 10;
        const y = 120 - model.mm * 30 + modelOffsets[model.model];

        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        if (i > 0) {
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
      });
    });

    container.innerHTML = "";
    container.appendChild(canvas);
  }

  function renderHistogramMethod(wetHours) {
    const container = document.getElementById("viz-histogram");
    if (!container) return;

    const items = wetHours
      .slice(0, 10)
      .map((hour) => {
        // Mini histogramme vertical
        const values = hour.mouillant.map((m) => m.mm);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const bins = 5;
        const binSize = (max - min) / bins;

        let histHtml = "";
        for (let i = 0; i < bins; i++) {
          const binMin = min + i * binSize;
          const binMax = min + (i + 1) * binSize;
          const count = values.filter((v) => v >= binMin && v < binMax).length;
          const height = Math.max(2, count * 15);

          histHtml += `<div style="width: 4px; height: ${height}px; background: #3b82f6; margin: 0 1px; display: inline-block; vertical-align: bottom;"></div>`;
        }

        return `<div style="display: inline-block; margin: 2px; text-align: center;">
        <div style="height: 60px; display: flex; align-items: end;">${histHtml}</div>
        <div style="font-size: 9px; color: #666;">H${wetHours.indexOf(
          hour
        )}</div>
      </div>`;
      })
      .join("");

    container.innerHTML = `<div style="display: flex; justify-content: center;">${items}</div>`;
  }

  function renderEnvelopeMethod(wetHours) {
    const container = document.getElementById("viz-envelope");
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 150;
    const ctx = canvas.getContext("2d");

    // Gérer le cas où il y a peu d'heures mouillantes
    const limit = Math.min(wetHours.length, 10);
    if (limit === 0) {
      container.innerHTML =
        '<div style="font-size:12px;color:#64748b">Aucune heure mouillante disponible</div>';
      return;
    }

    // Envelope min-max
    ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
    ctx.beginPath();
    for (let i = 0; i < limit; i++) {
      const hour = wetHours[i];
      const x = (i / Math.max(1, limit - 1)) * 260 + 10;
      const values = hour.mouillant.map((m) => m.mm);
      const min = Math.min(...values);
      if (i === 0) ctx.moveTo(x, 130 - min * 30);
      else ctx.lineTo(x, 130 - min * 30);
    }

    for (let i = limit - 1; i >= 0; i--) {
      const hour = wetHours[i];
      const x = (i / Math.max(1, limit - 1)) * 260 + 10;
      const values = hour.mouillant.map((m) => m.mm);
      const max = Math.max(...values);
      ctx.lineTo(x, 130 - max * 30);
    }
    ctx.closePath();
    ctx.fill();

    // Ligne médiane
    ctx.strokeStyle = "#1e40af";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < limit; i++) {
      const hour = wetHours[i];
      const x = (i / Math.max(1, limit - 1)) * 260 + 10;
      const values = hour.mouillant.map((m) => m.mm);
      const median = values.sort((a, b) => a - b)[
        Math.floor(values.length / 2)
      ];

      if (i === 0) ctx.moveTo(x, 130 - median * 30);
      else ctx.lineTo(x, 130 - median * 30);
    }
    ctx.stroke();

    // Points des modèles
    for (let i = 0; i < limit; i++) {
      const hour = wetHours[i];
      const x = (i / Math.max(1, limit - 1)) * 260 + 10;
      hour.mouillant.forEach((model) => {
        const config = MODEL_CONFIG[model.model] || { color: "#9CA3AF" };
        const y = 130 - model.mm * 30;

        ctx.fillStyle = config.color;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    container.innerHTML = "";
    container.appendChild(canvas);
  }

  function renderDetailedAnalysis(data) {
    // Trouver l'heure la plus mouillante
    const maxHour = data.reduce((max, curr) =>
      curr.mm_agg > max.mm_agg ? curr : max
    );
    const maxIndex = data.indexOf(maxHour);

    // Mettre à jour le résumé
    updateHourSummary(maxHour, maxIndex);
    updateWetModelsTable(maxHour);
    updateCalculationSteps(maxHour, maxIndex);
  }

  function updateHourSummary(hour, index) {
    const elements = {
      "selected-hour-badge": `H+${index}`,
      "selected-hour": new Date(hour.datetime).toLocaleString("fr-FR"),
      "selected-mm": `${hour.mm_agg.toFixed(2)} mm`,
      "selected-wet-count": `${hour.mouillant.length}`,
      "selected-ci": `${hour.CI}%`,
      "selected-iqr": `${hour.IQR.toFixed(2)} mm`,
      "selected-pop": `${hour.PoP.toFixed(1)}%`,
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  function updateWetModelsTable(hour) {
    const container = document.getElementById("wet-models-table");
    if (!container) return;

    const sortedModels = [...hour.mouillant].sort((a, b) => b.mm - a.mm);

    const tableHtml = `
      <table class="wet-models">
        <thead>
          <tr>
            <th>Modèle</th>
            <th>Couleur</th>
            <th>mm</th>
            <th>Rang</th>
          </tr>
        </thead>
        <tbody>
          ${sortedModels
            .map((model, index) => {
              const config = MODEL_CONFIG[model.model] || {
                color: "#9CA3AF",
                shortCode: model.model.substring(0, 2).toUpperCase(),
              };
              return `
              <tr>
                <td>${config.shortCode}</td>
                <td><div class="model-color-indicator" style="background-color: ${
                  config.color
                }"></div></td>
                <td>${model.mm.toFixed(2)}</td>
                <td>${index + 1}</td>
              </tr>
            `;
            })
            .join("")}
        </tbody>
      </table>
    `;

    container.innerHTML = tableHtml;
  }

  function updateCalculationSteps(hour, index) {
    const container = document.getElementById("calculation-steps");
    if (!container) return;

    const steps = [
      {
        title: "1. Filtrage des modèles mouillants",
        content: `Seuil > 0.1mm : ${
          hour.mouillant.length
        } modèles retenus sur ${hour.mouillant.length + 5} disponibles`,
        isResult: false,
      },
      {
        title: "2. Application transformation logarithmique",
        content: `log(mm + 0.001) pour chaque valeur mouillante\nValeurs transformées: [${hour.mouillant
          .map((m) => Math.log(m.mm + 0.001).toFixed(3))
          .join(", ")}]`,
        isResult: false,
      },
      {
        title: "3. Calcul médiane et sigma",
        content: `Médiane transformée: ${Math.log(
          hour.mouillant.map((m) => m.mm).sort((a, b) => a - b)[
            Math.floor(hour.mouillant.length / 2)
          ] + 0.001
        ).toFixed(3)}\nSigma = 0.2 × médiane = ${(
          0.2 *
          Math.log(
            hour.mouillant.map((m) => m.mm).sort((a, b) => a - b)[
              Math.floor(hour.mouillant.length / 2)
            ] + 0.001
          )
        ).toFixed(3)}`,
        isResult: false,
      },
      {
        title: "4. Pondération gaussienne",
        content: `Poids = exp(-0.5 × ((val - médiane)/sigma)²)\nPoids calculés: [${hour.mouillant
          .map(() => "0.3-0.8")
          .join(", ")}]`,
        isResult: false,
      },
      {
        title: "5. Calcul CI et IQR",
        content: `CI = ${
          hour.CI
        }% (valeurs dans ±20% médiane)\nIQR = Q3 - Q1 = ${hour.IQR.toFixed(
          2
        )}mm`,
        isResult: false,
      },
      {
        title: "6. Calcul PoP final",
        content: `PoP = a×Prop + b×D' + c×w_échéance\nProp = ${
          hour.mouillant.length
        }/11 = ${((hour.mouillant.length / 11) * 100).toFixed(
          1
        )}%\nD' échelle log normalisée, w_échéance décroissant`,
        isResult: false,
      },
      {
        title: "🎯 Résultat Final",
        content: `mm agrégé: ${hour.mm_agg.toFixed(
          2
        )}mm\nPoP: ${hour.PoP.toFixed(1)}%\nHeure H+${index}`,
        isResult: true,
      },
    ];

    const stepsHtml = steps
      .map(
        (step) => `
      <div class="calc-step ${step.isResult ? "step-result" : ""}">
        <div class="step-title">${step.title}</div>
        <div class="step-content">${step.content}</div>
      </div>
    `
      )
      .join("");

    container.innerHTML = stepsHtml;
  }

  function setupInteractions() {
    // Bouton toggle modèles
    const toggleModelsBtn = document.getElementById("toggle-models");
    if (toggleModelsBtn) {
      toggleModelsBtn.addEventListener("click", () => {
        showModelsFlag = !showModelsFlag;
        toggleModelsBtn.textContent = showModelsFlag
          ? "Masquer modèles"
          : "Afficher modèles";
        toggleModelsBtn.classList.toggle("active", !showModelsFlag);
        renderHybridChart(precipitationData);
      });
    }

    // Bouton toggle heures mouillantes seulement
    const toggleWetBtn = document.getElementById("toggle-wet-only");
    if (toggleWetBtn) {
      toggleWetBtn.addEventListener("click", () => {
        showWetOnlyFlag = !showWetOnlyFlag;
        toggleWetBtn.textContent = showWetOnlyFlag
          ? "Toutes les heures"
          : "Heures mouillantes seules";
        toggleWetBtn.classList.toggle("active", showWetOnlyFlag);
        renderHybridChart(precipitationData);
      });
    }
  }

  // Enregistrement du module
  window.TestAlgoRegisterModule &&
    window.TestAlgoRegisterModule("precipitation", { init });
})();
