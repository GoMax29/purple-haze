(function () {
  const TAB_ID = "results_all";

  function toLocalParis(dateIso) {
    try {
      const date = new Date(dateIso.replace(" ", "T"));
      const opts = {
        timeZone: "Europe/Paris",
        day: "numeric",
        month: "numeric",
        hour: "2-digit",
        hour12: false,
      };
      const parts = new Intl.DateTimeFormat("fr-FR", opts).formatToParts(date);
      const day = parts.find((p) => p.type === "day")?.value || "";
      const month = parts.find((p) => p.type === "month")?.value || "";
      const hour = parts.find((p) => p.type === "hour")?.value || "00";
      return `${day}/${month} ${hour}h`;
    } catch {
      return "N/A";
    }
  }

  const DIRS = [
    { deg: 0, label: "N" },
    { deg: 22.5, label: "NNE" },
    { deg: 45, label: "NE" },
    { deg: 67.5, label: "ENE" },
    { deg: 90, label: "E" },
    { deg: 112.5, label: "ESE" },
    { deg: 135, label: "SE" },
    { deg: 157.5, label: "SSE" },
    { deg: 180, label: "S" },
    { deg: 202.5, label: "SSO" },
    { deg: 225, label: "SO" },
    { deg: 247.5, label: "OSO" },
    { deg: 270, label: "O" },
    { deg: 292.5, label: "ONO" },
    { deg: 315, label: "NO" },
    { deg: 337.5, label: "NNO" },
  ];
  function degToCompass(deg) {
    if (typeof deg !== "number" || isNaN(deg)) return "N/A";
    const idx = Math.floor((deg % 360) / 22.5 + 0.5) % 16;
    return DIRS[idx].label + " " + Math.round(deg) + "°";
  }

  function fmt(val, unit) {
    if (
      val === null ||
      val === undefined ||
      (typeof val === "number" && !isFinite(val))
    )
      return "N/A";
    if (unit === "wmo") return `WMO ${val}`;
    if (unit === "deg") return degToCompass(val);
    if (unit)
      return `${
        typeof val === "number" ? Number(val).toFixed(1) : val
      } ${unit}`;
    return `${typeof val === "number" ? Number(val).toFixed(1) : val}`;
  }

  function takeHourColumns(times) {
    if (!Array.isArray(times) || times.length === 0)
      return { idx: [], labels: [] };
    const n = times.length;
    const left = times.slice(0, Math.min(5, n));
    const right = times.slice(Math.max(0, n - 5));
    const idx = [
      ...left.map((_, i) => i),
      ...(n > 10 ? [null] : []),
      ...right.map((_, i) => n - 5 + i),
    ];
    const labels = [
      ...left.map(toLocalParis),
      ...(n > 10 ? ["..."] : []),
      ...right.map(toLocalParis),
    ];
    // corriger indices si n<10
    const fixedIdx = idx.map((i) =>
      i === null ? null : i < 0 ? 0 : i >= n ? n - 1 : i
    );
    return { idx: fixedIdx, labels };
  }

  function mapFromCoreHour(hour) {
    // Adapter aux clés réelles de forecastCore.js
    return {
      temperature: hour?.temperature,
      temperature_apparente: hour?.apparentTemperature,
      humidite: hour?.humidity,
      precipitation_mm: hour?.precipitation?.mm,
      precipitation_ic: hour?.precipitation?.CI,
      precipitation_prop: Array.isArray(hour?.precipitation?.mouillant)
        ? hour.precipitation.mouillant.length
        : null,
      precipitation_proba: hour?.precipitation?.PoP,
      precipitation_iqr: hour?.precipitation?.IQR,
      wind_force: hour?.wind?.speed,
      wind_direction: hour?.wind?.direction,
      wind_gust: hour?.wind?.gust,
      code_wmo: hour?.wmo,
      UV: hour?.uvIndex,
      quality_air: hour?.aqi,
    };
  }

  function buildHourlyTables(result) {
    const container = document.getElementById("hourly-tables");
    if (!container) return;
    container.innerHTML = "";

    const hours = result.hourlyData || result.hourly || [];
    const times = hours.map((h) => h.time);
    const { idx, labels } = takeHourColumns(times);

    const rowsOrder = [
      "temperature",
      "temperature_apparente",
      "humidite",
      "precipitation_mm",
      "precipitation_prop",
      "precipitation_proba",
      "precipitation_ic",
      "precipitation_iqr",
      "wind_force",
      "wind_gust",
      "wind_direction",
      "code_wmo",
      "UV",
      "quality_air",
    ];
    const units = {
      temperature: "°C",
      temperature_apparente: "°C",
      humidite: "%",
      precipitation_mm: "mm",
      precipitation_prop: "",
      precipitation_proba: "%",
      precipitation_ic: "",
      precipitation_iqr: "mm",
      wind_force: "m/s",
      wind_gust: "m/s",
      wind_direction: "deg",
      code_wmo: "wmo",
      UV: "",
      quality_air: "",
    };

    const table = document.createElement("table");
    table.className = "mono compact";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    trh.appendChild(document.createElement("th"));
    labels.forEach((l) => {
      const th = document.createElement("th");
      th.textContent = l;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rowsOrder.forEach((key) => {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = key.replace("_", " ");
      tr.appendChild(th);
      idx.forEach((i) => {
        const td = document.createElement("td");
        if (i === null) {
          td.textContent = "...";
          td.className = "ellipsis";
        } else {
          const hour = hours[i];
          const mapped = mapFromCoreHour(hour);
          const unit = units[key];
          const rawVal = mapped[key];
          td.textContent = fmt(rawVal, unit);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function buildDailyTable(result) {
    const container = document.getElementById("daily-table");
    if (!container) return;
    container.innerHTML = "";
    const days = result.dailyData || result.days || [];
    const take7 = days.slice(0, 7);

    const wmoKeys = ["00-06", "06-12", "12-18", "18-00"];

    const table = document.createElement("table");
    table.className = "mono compact";
    const thead = document.createElement("thead");
    const trh = document.createElement("tr");
    const headers = [
      "",
      "00-06",
      "06-12",
      "12-18",
      "18-00",
      "temp min",
      "temp max",
      "UV max",
      "mm totaux",
    ];
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      trh.appendChild(th);
    });
    thead.appendChild(trh);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    take7.forEach((d, idx) => {
      const tr = document.createElement("tr");
      const date = d.date ? new Date(d.date) : null;
      const label = date
        ? new Intl.DateTimeFormat("fr-FR", {
            weekday: "long",
            day: "2-digit",
          }).format(date)
        : `J${idx + 1}`;
      const initial = label
        ? label[0].toUpperCase() +
          ". " +
          (d.date ? String(new Date(d.date).getDate()).padStart(2, "0") : "--")
        : `J${idx + 1}`;
      const th = document.createElement("th");
      th.textContent = initial;
      tr.appendChild(th);

      const byTranche = d?.wmo?.byTranche || d?.wmo || {};
      wmoKeys.forEach((k) => {
        const td = document.createElement("td");
        // tenter variantes
        const variants = [
          k,
          k
            .replace("00-06", "night")
            .replace("06-12", "morning")
            .replace("12-18", "afternoon")
            .replace("18-00", "evening"),
        ];
        const code = variants
          .map((v) => byTranche[v])
          .find((v) => v !== undefined && v !== null);
        td.textContent = fmt(code, "wmo");
        tr.appendChild(td);
      });

      const tmin = d?.temperature?.min ?? d?.temps?.min ?? d?.tempMin;
      const tmax = d?.temperature?.max ?? d?.temps?.max ?? d?.tempMax;
      const uvmax = d?.uv?.max ?? d?.uvMax;
      const mmtot = d?.precipitation?.total_mm ?? d?.precipitationTotal;
      ["°C", "°C", "", "mm"].forEach((unit, i) => {
        const td = document.createElement("td");
        const val = [tmin, tmax, uvmax, mmtot][i];
        td.textContent = fmt(val, unit);
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  async function fetchResults(lat, lon) {
    const url = `/api/test-param/results_all?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function init(config) {
    const container = document.getElementById("results-all-container");
    if (!container) return;
    container.innerHTML =
      '<div class="loading-spinner"><div class="spinner"></div><p>Loading...</p></div>';
    try {
      const { lat, lon } = config.coords;
      const result = await fetchResults(lat, lon);
      container.innerHTML = "";
      buildHourlyTables(result);
      buildDailyTable(result);
    } catch (e) {
      container.innerHTML = `<div class="error-message">${
        e.message || "Erreur"
      }</div>`;
    }
  }

  window.TestAlgoModules = window.TestAlgoModules || {};
  window.TestAlgoModules[TAB_ID] = { init };
})();

