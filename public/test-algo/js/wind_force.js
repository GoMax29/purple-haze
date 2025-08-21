// Module Force du Vent
(function () {
  "use strict";

  const { formatHour, injectSpinner, showError } = window.TestAlgoCommon;

  async function init(config) {
    try {
      await fetchAndRenderWindForce(config);
    } catch (error) {
      console.error("Erreur module force du vent:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module wind_force: ${error.message}`
      );
    }
  }

  async function fetchAndRenderWindForce(config) {
    const loadingEl = document.getElementById("wind-force-loading");
    const errorEl = document.getElementById("wind-force-error");
    const contentEl = document.getElementById("wind-force-content");

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";
    if (contentEl) contentEl.style.display = "none";

    try {
      const url = `${config.endpoints.wind_force}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Erreur lors du traitement");

      if (loadingEl) loadingEl.style.display = "none";
      if (contentEl) contentEl.style.display = "block";
      renderWindForceData(result.data);
    } catch (error) {
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.style.display = "block";
        errorEl.querySelector("p").textContent = error.message;
      }
      throw error;
    }
  }

  function renderWindForceData(data) {
    const speeds = data
      .map((item) => item.speed)
      .filter((v) => v !== null && v !== undefined);

    if (speeds.length === 0) {
      console.warn("Aucune donnée de force du vent disponible");
      return;
    }

    const min = Math.min(...speeds);
    const max = Math.max(...speeds);
    const avg = speeds.reduce((sum, val) => sum + val, 0) / speeds.length;

    // Mise à jour des statistiques
    const minEl = document.getElementById("wind-force-min");
    const maxEl = document.getElementById("wind-force-max");
    const avgEl = document.getElementById("wind-force-avg");
    const countEl = document.getElementById("wind-force-count");

    if (minEl) minEl.textContent = `${min.toFixed(1)} km/h`;
    if (maxEl) maxEl.textContent = `${max.toFixed(1)} km/h`;
    if (avgEl) avgEl.textContent = `${avg.toFixed(1)} km/h`;
    if (countEl) countEl.textContent = data.length;

    renderWindForceChart(data);
    renderWindForceTable(data);
  }

  function renderWindForceChart(data) {
    const canvas = document.getElementById("wind-force-chart");
    if (!canvas || !window.Chart) return;

    // Détruire le graphique existant
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const hours = data.map((item) => formatHour(item.datetime));
    const speeds = data.map((item) => item.speed);

    canvas.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: hours,
        datasets: [
          {
            label: "Force du vent (km/h)",
            data: speeds,
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "rgba(16, 185, 129, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgb(16, 185, 129)",
            pointBorderColor: "white",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgb(16, 185, 129)",
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 3,
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
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            titleColor: "white",
            bodyColor: "white",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function (context) {
                return `${context.dataset.label}: ${context.parsed.y.toFixed(
                  1
                )} km/h`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Vitesse (km/h)",
              font: {
                size: 14,
                weight: "600",
              },
              color: "#475569",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)",
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 12,
              },
              color: "#64748b",
              padding: 8,
            },
          },
          x: {
            title: {
              display: true,
              text: "Heures",
              font: {
                size: 14,
                weight: "600",
              },
              color: "#475569",
            },
            grid: {
              color: "rgba(148, 163, 184, 0.2)",
              drawBorder: false,
            },
            ticks: {
              font: {
                size: 12,
              },
              color: "#64748b",
              padding: 8,
              maxTicksLimit: 12,
            },
          },
        },
        interaction: {
          mode: "nearest",
          axis: "x",
          intersect: false,
        },
        elements: {
          line: {
            capBezierPoints: false,
          },
        },
      },
    });
  }

  function renderWindForceTable(data) {
    const tbody = document.getElementById("wind-force-table-body");
    if (!tbody) return;

    // Prendre les 24 premières heures
    const first24 = data.slice(0, 24);
    let html = "";

    first24.forEach((item, index) => {
      const hour = formatHour(item.datetime);
      const speed = item.speed !== null ? item.speed.toFixed(1) : "--";

      // Tendance (comparer avec l'heure précédente)
      let trend = "→";
      if (
        index > 0 &&
        item.speed !== null &&
        first24[index - 1].speed !== null
      ) {
        const diff = item.speed - first24[index - 1].speed;
        if (diff > 0.5) trend = "↗️";
        else if (diff < -0.5) trend = "↘️";
      }

      html += `
        <tr>
          <td>${hour}</td>
          <td><strong>${speed} km/h</strong></td>
          <td>${trend}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // Export du module
  if (!window.TestAlgoModules) window.TestAlgoModules = {};
  window.TestAlgoModules.wind_force = { init };
})();
