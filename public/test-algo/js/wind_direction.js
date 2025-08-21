// Module Direction du Vent
(function () {
  "use strict";

  const { formatHour, injectSpinner, showError } = window.TestAlgoCommon;

  async function init(config) {
    try {
      await fetchAndRenderWindDirection(config);
    } catch (error) {
      console.error("Erreur module direction du vent:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module wind_direction: ${error.message}`
      );
    }
  }

  async function fetchAndRenderWindDirection(config) {
    const loadingEl = document.getElementById("wind-direction-loading");
    const errorEl = document.getElementById("wind-direction-error");
    const contentEl = document.getElementById("wind-direction-content");

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";
    if (contentEl) contentEl.style.display = "none";

    try {
      const url = `${config.endpoints.wind_direction}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Erreur lors du traitement");

      if (loadingEl) loadingEl.style.display = "none";
      if (contentEl) contentEl.style.display = "block";
      renderWindDirectionData(result.data);
    } catch (error) {
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.style.display = "block";
        errorEl.querySelector("p").textContent = error.message;
      }
      throw error;
    }
  }

  function degreeToCardinal(degree) {
    if (degree === null || degree === undefined) return "--";
    const directions = [
      "N",
      "NNE",
      "NE",
      "ENE",
      "E",
      "ESE",
      "SE",
      "SSE",
      "S",
      "SSW",
      "SW",
      "WSW",
      "W",
      "WNW",
      "NW",
      "NNW",
    ];
    const index = Math.round(degree / 22.5) % 16;
    return directions[index];
  }

  function getWindSector(degree) {
    if (degree === null || degree === undefined) return "--";
    if (degree >= 315 || degree < 45) return "Nord";
    if (degree >= 45 && degree < 135) return "Est";
    if (degree >= 135 && degree < 225) return "Sud";
    return "Ouest";
  }

  function calculateDirectionStats(data) {
    const directions = data
      .map((item) => item.direction)
      .filter((v) => v !== null && v !== undefined);

    if (directions.length === 0) return null;

    // Calcul de la direction dominante (moyenne vectorielle)
    let x = 0,
      y = 0;
    directions.forEach((deg) => {
      const rad = (deg * Math.PI) / 180;
      x += Math.cos(rad);
      y += Math.sin(rad);
    });

    const dominant = (Math.atan2(y, x) * 180) / Math.PI;
    const dominantNormalized = dominant < 0 ? dominant + 360 : dominant;

    // Calcul de la variation (écart-type circulaire approximé)
    const deviations = directions.map((deg) => {
      let diff = Math.abs(deg - dominantNormalized);
      if (diff > 180) diff = 360 - diff;
      return diff;
    });
    const variation = Math.sqrt(
      deviations.reduce((sum, d) => sum + d * d, 0) / deviations.length
    );

    // Stabilité (pourcentage de directions dans ±30° de la dominante)
    const stable = deviations.filter((d) => d <= 30).length;
    const stability = (stable / directions.length) * 100;

    return {
      dominant: dominantNormalized,
      variation,
      stability,
      count: directions.length,
    };
  }

  function renderWindDirectionData(data) {
    const stats = calculateDirectionStats(data);

    if (!stats) {
      console.warn("Aucune donnée de direction disponible");
      return;
    }

    // Mise à jour des statistiques
    const dominantEl = document.getElementById("wind-direction-dominant");
    const cardinalEl = document.getElementById("wind-direction-cardinal");
    const variationEl = document.getElementById("wind-direction-variation");
    const stabilityEl = document.getElementById("wind-direction-stability");
    const countEl = document.getElementById("wind-direction-count");

    if (dominantEl) dominantEl.textContent = `${Math.round(stats.dominant)}°`;
    if (cardinalEl) cardinalEl.textContent = degreeToCardinal(stats.dominant);
    if (variationEl)
      variationEl.textContent = `±${Math.round(stats.variation)}°`;
    if (stabilityEl)
      stabilityEl.textContent = `${Math.round(stats.stability)}%`;
    if (countEl) countEl.textContent = stats.count;

    renderWindDirectionChart(data);
    renderWindCompass(data);
    renderWindDirectionTable(data);
  }

  function renderWindDirectionChart(data) {
    const canvas = document.getElementById("wind-direction-chart");
    if (!canvas || !window.Chart) return;

    // Détruire le graphique existant
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    // Préparer données: abscisse = heure, ordonnée = direction (0° → 360°)
    const hours = data.map((item) => formatHour(item.datetime));
    const directions = data.map((item) =>
      item.direction !== null && item.direction !== undefined
        ? Math.round(item.direction)
        : null
    );

    canvas.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: hours,
        datasets: [
          {
            label: "Direction du vent (°)",
            data: directions,
            borderColor: "rgb(139, 92, 246)",
            backgroundColor: "rgba(139, 92, 246, 0.15)",
            borderWidth: 2,
            fill: false,
            showLine: false, // scatter-like
            tension: 0.4,
            pointRadius: 5,
            pointBackgroundColor: "rgba(139, 92, 246, 0.9)",
            pointBorderColor: "white",
            pointBorderWidth: 2,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: "rgb(139, 92, 246)",
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 3,
            spanGaps: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              padding: 20,
              font: {
                size: 12,
                weight: "600",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgb(139, 92, 246)",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function (context) {
                const dir = context.parsed.y;
                return `${context.label}: ${dir.toFixed(
                  0
                )}° (${degreeToCardinal(dir)})`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "category",
            title: {
              display: true,
              text: "Heures",
              font: { size: 14, weight: "600" },
              color: "#475569",
            },
            grid: { color: "rgba(148, 163, 184, 0.15)", drawBorder: false },
            ticks: {
              maxTicksLimit: 12,
              autoSkip: true,
              color: "#64748b",
              font: { size: 12 },
            },
          },
          y: {
            type: "linear",
            min: 0,
            max: 360,
            title: {
              display: true,
              text: "Direction (°)",
              font: { size: 14, weight: "600" },
              color: "#475569",
            },
            grid: { color: "rgba(148, 163, 184, 0.2)", drawBorder: false },
            ticks: {
              stepSize: 45,
              color: "#64748b",
              callback: (value) => `${value}°`,
              font: { size: 12 },
            },
          },
        },
        elements: {
          point: {
            hoverBorderWidth: 3,
          },
        },
      },
    });
  }

  function renderWindCompass(data) {
    const compass = document.getElementById("wind-compass");
    if (!compass) return;

    // Nettoyer la boussole
    compass.innerHTML = "";

    // Ajouter les labels cardinaux
    const labels = [
      { text: "N", top: "10px", left: "50%" },
      { text: "E", top: "50%", right: "10px" },
      { text: "S", bottom: "10px", left: "50%" },
      { text: "W", top: "50%", left: "10px" },
    ];

    labels.forEach((label) => {
      const el = document.createElement("div");
      el.className = "compass-label";
      el.textContent = label.text;
      Object.assign(el.style, label);
      compass.appendChild(el);
    });

    // Ajouter le centre
    const center = document.createElement("div");
    center.className = "compass-center";
    compass.appendChild(center);

    // Ajouter les points de direction (24 premières heures)
    const first24 = data.slice(0, 24).filter((item) => item.direction !== null);
    first24.forEach((item, index) => {
      const angle = (item.direction * Math.PI) / 180 - Math.PI / 2; // -90° pour que 0° soit en haut
      const radius = 145; // Rayon du cercle (ajusté pour la nouvelle taille)
      const x = 160 + radius * Math.cos(angle); // Centre à 160px
      const y = 160 + radius * Math.sin(angle);

      const point = document.createElement("div");
      point.className = "compass-point";
      point.style.left = `${x}px`;
      point.style.top = `${y}px`;

      // Gradient d'opacité plus subtle et couleur dégradée
      const opacity = 0.4 + (0.6 * (24 - index)) / 24;
      point.style.opacity = opacity;

      // Couleur qui change avec le temps (plus récent = plus vif)
      const intensity = (24 - index) / 24;
      if (intensity > 0.7) {
        point.style.background = "var(--accent)";
      } else if (intensity > 0.4) {
        point.style.background = "rgba(139, 92, 246, 0.8)";
      } else {
        point.style.background = "rgba(139, 92, 246, 0.5)";
      }

      point.title = `${formatHour(item.datetime)}: ${Math.round(
        item.direction
      )}° (${degreeToCardinal(item.direction)})`;
      compass.appendChild(point);
    });
  }

  function renderWindDirectionTable(data) {
    const tbody = document.getElementById("wind-direction-table-body");
    if (!tbody) return;

    // Prendre les 24 premières heures
    const first24 = data.slice(0, 24);
    let html = "";

    first24.forEach((item) => {
      const hour = formatHour(item.datetime);
      const direction =
        item.direction !== null ? `${Math.round(item.direction)}°` : "--";
      const cardinal = degreeToCardinal(item.direction);
      const sector = getWindSector(item.direction);

      html += `
        <tr>
          <td>${hour}</td>
          <td><strong>${direction}</strong></td>
          <td>${cardinal}</td>
          <td>${sector}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // Export du module
  if (!window.TestAlgoModules) window.TestAlgoModules = {};
  window.TestAlgoModules.wind_direction = { init };
})();
