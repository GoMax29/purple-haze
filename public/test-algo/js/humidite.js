// Module Humidité
(function () {
  "use strict";

  const { formatHour, showError } = window.TestAlgoCommon;

  async function init(config) {
    try {
      await fetchAndRender(config);
    } catch (error) {
      console.error("Erreur module humidité:", error);
      const contentArea = document.getElementById("content");
      showError(
        contentArea,
        `Erreur dans le module humidite: ${error.message}`
      );
    }
  }

  async function fetchAndRender(config) {
    const url = `${config.endpoints.humidite}?lat=${config.coords.lat}&lon=${config.coords.lon}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
    const result = await response.json();
    if (!result.success)
      throw new Error(result.error || "Erreur lors du traitement");
    renderData(result.data);
  }

  function renderData(data) {
    const statsElement = document.getElementById("humidity-stats");
    if (statsElement && data && data.length > 0) {
      const humidities = data
        .map((i) => i.value)
        .filter((v) => v !== null && v !== undefined);
      const average = humidities.reduce((s, v) => s + v, 0) / humidities.length;
      const variance =
        humidities.reduce((s, v) => s + Math.pow(v - average, 2), 0) /
        humidities.length;
      const stdDev = Math.sqrt(variance);
      statsElement.innerHTML = `
        <div class="stat-card"><div class="stat-value">${
          data.length
        }</div><div class="stat-label">Points de données</div></div>
        <div class="stat-card"><div class="stat-value">${Math.round(
          average
        )}%</div><div class="stat-label">Humidité moyenne</div></div>
        <div class="stat-card"><div class="stat-value">${
          Math.round(stdDev * 10) / 10
        }%</div><div class="stat-label">Écart-type</div></div>
      `;
    }

    updateGauge(data);
    renderChart(data);
    renderTable(data);
  }

  function updateGauge(data) {
    if (!data || data.length === 0) return;
    const currentHumidity = data[0]?.value || 0;
    const gaugeElement = document.getElementById("humidity-gauge");
    const humidityValueElement = document.getElementById("current-humidity");
    const humidityStatusElement = document.getElementById("humidity-status");
    if (gaugeElement && humidityValueElement && humidityStatusElement) {
      const percentage = Math.min(100, Math.max(0, currentHumidity));
      gaugeElement.style.width = `${percentage}%`;
      let status = "Optimal";
      let statusClass = "optimal";
      if (currentHumidity < 30) {
        status = "Sec";
        statusClass = "low";
      } else if (currentHumidity > 70) {
        status = "Humide";
        statusClass = "high";
      }
      humidityValueElement.textContent = `${Math.round(currentHumidity)}%`;
      humidityStatusElement.textContent = status;
      humidityStatusElement.className = `humidity-status ${statusClass}`;
    }
  }

  function renderChart(data) {
    const canvas = document.getElementById("humidity-chart");
    if (!canvas || !data || data.length === 0) return;
    if (canvas.chart) canvas.chart.destroy();
    const ctx = canvas.getContext("2d");
    canvas.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.map((item) => formatHour(item.datetime)),
        datasets: [
          {
            label: "Humidité Relative (%)",
            data: data.map((item) => item.value),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
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
            text: "Évolution de l'Humidité Relative - 7 jours",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: "Humidité Relative (%)" },
          },
        },
      },
    });
  }

  function renderTable(data) {
    const tableElement = document.getElementById("humidity-table");
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
              <td class="sticky-header"><strong>Humidité (%)</strong></td>
              ${filteredData
                .map((item) => {
                  const humidity = Math.round(item.value);
                  let statusClass = "humidity-optimal";
                  if (humidity < 30) statusClass = "humidity-low";
                  else if (humidity > 70) statusClass = "humidity-high";
                  return `<td><span class="humidity-value ${statusClass}">${humidity}%</span></td>`;
                })
                .join("")}
            </tr>
          </tbody>
        </table>
      </div>
    `;
    tableElement.innerHTML = tableHTML;
  }

  window.TestAlgoRegisterModule("humidite", { init });
})();
