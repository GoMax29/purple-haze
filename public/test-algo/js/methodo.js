// Module Méthodologie
(function () {
  "use strict";

  function init() {
    console.log("Module méthodologie initialisé");
    updateModelCounters();
  }

  function updateModelCounters() {
    const modelCounts = {
      temperature: 10,
      apparent: 10,
      humidite: 9,
      wmo: 13,
    };
    const footerStats = document.querySelector(".footer-stats");
    if (footerStats) {
      footerStats.innerHTML = `
        <div class="stat-item">
          <span class="stat-dot stat-success"></span>
          <span>Fonctions de traitement modularisées</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot stat-info"></span>
          <span>APIs multi-modèles (9-13 modèles selon paramètre)</span>
        </div>
      `;
    }
    const modelInfo = {
      temp: { count: 10, desc: "modèles haute résolution" },
      apparent: { count: 10, desc: "modèles haute résolution" },
      humidite: { count: 9, desc: "modèles spécialisés humidité" },
      wmo: { count: 13, desc: "modèles conditions météo" },
      methodo: { count: "9-13", desc: "modèles selon paramètre" },
    };
    const currentTab = window.TestAlgoApp?.getCurrentTab?.() || "methodo";
    const currentInfo = modelInfo[currentTab] || modelInfo.methodo;
    document.querySelectorAll(".model-count").forEach((el) => {
      el.textContent = `${currentInfo.count} ${currentInfo.desc}`;
    });
  }

  window.TestAlgoRegisterModule("methodo", { init });
})();
