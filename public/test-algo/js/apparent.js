// Module Température Apparente
(function () {
  "use strict";

  const { formatHour, showError } = window.TestAlgoCommon;

  async function init(config) {
    try {
      await fetchAndRender(config);
    } catch (error) {
      console.error("Erreur module température apparente:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module apparent-temperature: ${error.message}`
      );
    }
  }

  async function fetchAndRender(config) {
    const url = `${config.endpoints.apparent}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Erreur lors du traitement");
    renderData(result.data);
  }

  function renderData(data) {
    const statsElement = document.getElementById("apparent-stats");
    if (statsElement && data && data.length > 0) {
      const temps = data
        .map((i) => i.value)
        .filter((v) => v !== null && v !== undefined);
      const average = temps.reduce((s, v) => s + v, 0) / temps.length;
      const min = Math.min(...temps);
      const max = Math.max(...temps);
      const range = max - min;
      statsElement.innerHTML = `
        <div class="stat-card"><div class="stat-value">${
          data.length
        }</div><div class="stat-label">Points de données</div></div>
        <div class="stat-card"><div class="stat-value">${
          Math.round(average * 10) / 10
        }°C</div><div class="stat-label">Sensation moyenne</div></div>
        <div class="stat-card"><div class="stat-value">${
          Math.round(range * 10) / 10
        }°C</div><div class="stat-label">Écart max/min</div></div>
      `;
    }

    renderChart(data);
    renderTable(data);
  }

  function renderChart(data) {
    const canvas = document.getElementById("apparent-temperature-chart");
    if (!canvas || !data || data.length === 0) return;
    if (canvas.chart) canvas.chart.destroy();
    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((item) => formatHour(item.datetime)),
        datasets: [
          {
            label: "Température Apparente (°C)",
            data: data.map((item) => item.value),
            borderColor: "rgb(251, 146, 60)",
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
            title: { display: true, text: "Température Apparente (°C)" },
          },
        },
      },
    });
  }

  function renderTable(data) {
    const tableElement = document.getElementById("apparent-temperature-table");
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

  window.TestAlgoRegisterModule("apparent", { init });
})();
