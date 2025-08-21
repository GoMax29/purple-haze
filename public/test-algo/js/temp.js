// Module Température
(function () {
  "use strict";

  const { formatHour, injectSpinner, showError } = window.TestAlgoCommon;

  async function init(config) {
    try {
      await fetchAndRenderTemperature(config);
    } catch (error) {
      console.error("Erreur module température:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module temperature: ${error.message}`
      );
    }
  }

  async function fetchAndRenderTemperature(config) {
    const url = `${config.endpoints.temp}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Erreur lors du traitement");
    renderTemperatureData(result.data);
  }

  function renderTemperatureData(data) {
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

    renderTemperatureChart(data);
    renderTemperatureTable(data);
  }

  function renderTemperatureChart(data) {
    const canvas = document.getElementById("temperature-chart");
    if (!canvas) return;
    if (canvas.chart) canvas.chart.destroy();
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
            title: { display: true, text: "Température (°C)" },
          },
        },
      },
    });
  }

  function renderTemperatureTable(data) {
    const tableElement = document.getElementById("temperature-table");
    if (!tableElement || !data || data.length === 0) return;
    const filteredData = data
      .filter((_, index) => index % 6 === 0)
      .slice(0, 28);
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

  window.TestAlgoRegisterModule("temp", { init });
})();
