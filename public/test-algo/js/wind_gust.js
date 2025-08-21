// Module Rafales de Vent
(function () {
  "use strict";

  const { formatHour, injectSpinner, showError } = window.TestAlgoCommon;

  async function init(config) {
    try {
      await fetchAndRenderWindGust(config);
    } catch (error) {
      console.error("Erreur module rafales de vent:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module wind_gust: ${error.message}`
      );
    }
  }

  async function fetchAndRenderWindGust(config) {
    const loadingEl = document.getElementById("wind-gust-loading");
    const errorEl = document.getElementById("wind-gust-error");
    const contentEl = document.getElementById("wind-gust-content");

    if (loadingEl) loadingEl.style.display = "block";
    if (errorEl) errorEl.style.display = "none";
    if (contentEl) contentEl.style.display = "none";

    try {
      const url = `${config.endpoints.wind_gust}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const result = await response.json();
      if (!result.success)
        throw new Error(result.error || "Erreur lors du traitement");

      if (loadingEl) loadingEl.style.display = "none";
      if (contentEl) contentEl.style.display = "block";
      renderWindGustData(result.data);
    } catch (error) {
      if (loadingEl) loadingEl.style.display = "none";
      if (errorEl) {
        errorEl.style.display = "block";
        errorEl.querySelector("p").textContent = error.message;
      }
      throw error;
    }
  }

  function renderWindGustData(data) {
    const gusts = data
      .map((item) => item.gust)
      .filter((v) => v !== null && v !== undefined);
    const gustsMax = data
      .map((item) => item.gust_max)
      .filter((v) => v !== null && v !== undefined);

    if (gusts.length === 0) {
      console.warn("Aucune donnée de rafales disponible");
      return;
    }

    const min = Math.min(...gusts);
    const max = Math.max(...gusts);
    const avg = gusts.reduce((sum, val) => sum + val, 0) / gusts.length;
    const absoluteMax = gustsMax.length > 0 ? Math.max(...gustsMax) : max;

    // Mise à jour des statistiques
    const minEl = document.getElementById("wind-gust-min");
    const maxEl = document.getElementById("wind-gust-max");
    const avgEl = document.getElementById("wind-gust-avg");
    const absMaxEl = document.getElementById("wind-gust-absolute-max");

    if (minEl) minEl.textContent = `${min.toFixed(1)} km/h`;
    if (maxEl) maxEl.textContent = `${max.toFixed(1)} km/h`;
    if (avgEl) avgEl.textContent = `${avg.toFixed(1)} km/h`;
    if (absMaxEl) absMaxEl.textContent = `${absoluteMax.toFixed(1)} km/h`;

    renderWindGustChart(data);
    renderWindGustTable(data);
  }

  function renderWindGustChart(data) {
    const canvas = document.getElementById("wind-gust-chart");
    if (!canvas || !window.Chart) return;

    // Détruire le graphique existant
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const hours = data.map((item) => formatHour(item.datetime));
    const gustsAvg = data.map((item) => item.gust);
    const gustsMax = data.map((item) => item.gust_max);

    canvas.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: hours,
        datasets: [
          {
            label: "Rafales moyennes (km/h)",
            data: gustsAvg,
            borderColor: "rgb(245, 158, 11)",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgb(245, 158, 11)",
            pointBorderColor: "white",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgb(245, 158, 11)",
            pointHoverBorderColor: "white",
            pointHoverBorderWidth: 3,
          },
          {
            label: "Rafales maximales (km/h)",
            data: gustsMax,
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderWidth: 3,
            fill: false,
            tension: 0.4,
            borderDash: [8, 4],
            pointBackgroundColor: "rgb(239, 68, 68)",
            pointBorderColor: "white",
            pointBorderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgb(239, 68, 68)",
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
            borderColor: "rgb(245, 158, 11)",
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

  function getWindLevel(gustSpeed) {
    if (gustSpeed < 40)
      return { level: "Faible", emoji: "🟢", class: "text-green-600" };
    if (gustSpeed < 60)
      return { level: "Modéré", emoji: "🟡", class: "text-yellow-600" };
    return { level: "Fort", emoji: "🔴", class: "text-red-600" };
  }

  function renderWindGustTable(data) {
    const tbody = document.getElementById("wind-gust-table-body");
    if (!tbody) return;

    // Prendre les 24 premières heures
    const first24 = data.slice(0, 24);
    let html = "";

    first24.forEach((item) => {
      const hour = formatHour(item.datetime);
      const gustAvg = item.gust !== null ? item.gust.toFixed(1) : "--";
      const gustMax = item.gust_max !== null ? item.gust_max.toFixed(1) : "--";

      const levelInfo =
        item.gust_max !== null
          ? getWindLevel(item.gust_max)
          : { level: "--", emoji: "⚪", class: "" };

      html += `
        <tr>
          <td>${hour}</td>
          <td><strong>${gustAvg} km/h</strong></td>
          <td><strong>${gustMax} km/h</strong></td>
          <td class="${levelInfo.class}">${levelInfo.emoji} ${levelInfo.level}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // Export du module
  if (!window.TestAlgoModules) window.TestAlgoModules = {};
  window.TestAlgoModules.wind_gust = { init };
})();
