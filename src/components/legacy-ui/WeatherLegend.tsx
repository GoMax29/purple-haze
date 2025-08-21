"use client";

import React from "react";

interface WeatherLegendItem {
  emoji: string;
  title: string;
  description: string;
  advice: string;
}

interface WeatherLegendProps {
  isVisible?: boolean;
  onClose?: () => void;
  weatherItems?: WeatherLegendItem[];
}

const WeatherLegend: React.FC<WeatherLegendProps> = ({
  isVisible = false,
  onClose,
  weatherItems = [],
}) => {
  // Données de légende par défaut basées sur l'original
  const defaultWeatherItems: WeatherLegendItem[] = [
    {
      emoji: "🌞",
      title: "Pas une goutte (0% ou pluie < 0.1 mm)",
      description: "Tenue libre, pas de protection pluie",
      advice: "🍃 Sortie idéale, balade, vélo, pique-nique ok",
    },
    {
      emoji: "🌤️",
      title: "Risque faible (1-20% ou 0.1-0.5 mm)",
      description: "Quelques gouttes possibles, généralement négligeables",
      advice: "👕 Tenue normale, peut-être une veste légère à portée",
    },
    {
      emoji: "⛅",
      title: "Possible (21-50% ou 0.5-2 mm)",
      description: "Petite averse possible, pas systématique",
      advice: "🧥 Veste imperméable dans le sac recommandée",
    },
    {
      emoji: "🌦️",
      title: "Probable (51-70% ou 2-5 mm)",
      description: "Averses attendues, intermittentes",
      advice: "☂️ Parapluie/imperméable obligatoire, éviter le vélo",
    },
    {
      emoji: "🌧️",
      title: "Pluie certaine (71-100% ou 5-15 mm)",
      description: "Pluie continue, modérée à forte",
      advice: "🏠 Rester à l'intérieur, reporter sorties non-essentielles",
    },
    {
      emoji: "⛈️",
      title: "Orage (>15 mm + grêle/vent)",
      description: "Conditions dangereuses, pluie violente",
      advice: "🚨 Éviter absolument toute sortie, risques d'inondation",
    },
    {
      emoji: "🌬️",
      title: "Vent fort (>25 km/h)",
      description: "Rafales pouvant perturber la marche",
      advice: "💨 Attention aux objets volants, prévoir vêtements ajustés",
    },
    {
      emoji: "🌡️",
      title: "Température extrême",
      description: "Très chaud (>30°) ou très froid (<5°)",
      advice: "🔥❄️ Adapter tenue et hydratation, limiter effort physique",
    },
  ];

  const items = weatherItems.length > 0 ? weatherItems : defaultWeatherItems;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="weather-legend-tooltip"
      style={{
        position: "absolute",
        top: "100%",
        left: "0",
        right: "0",
        background: "rgba(0, 0, 0, 0.95)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        borderRadius: "12px",
        padding: "16px",
        zIndex: 1000,
        backdropFilter: "blur(20px)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        marginTop: "8px",
        maxHeight: "400px",
        overflowY: "auto",
      }}
    >
      {/* En-tête avec bouton fermer */}
      <div className="legend-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "12px",
          }}
        >
          <h4
            style={{
              margin: "0",
              color: "white",
              fontSize: "1em",
              textAlign: "center",
              flex: 1,
            }}
          >
            🌞💦🌂☂☔⚡ Légende météo pluie & recommandations d'activité
          </h4>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: "white",
                fontSize: "1.2em",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "50%",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
              }}
            >
              ✕
            </button>
          )}
        </div>
        <div
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            paddingBottom: "8px",
          }}
        />
      </div>

      {/* Contenu des légendes */}
      <div
        className="legend-content"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className="legend-item"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
            }}
          >
            {/* Emoji */}
            <span
              className="legend-emoji"
              style={{
                fontSize: "1.5em",
                minWidth: "30px",
                textAlign: "center",
              }}
            >
              {item.emoji}
            </span>

            {/* Texte */}
            <div
              className="legend-text"
              style={{
                flex: 1,
              }}
            >
              <strong
                style={{
                  color: "white",
                  fontSize: "0.9em",
                  display: "block",
                  marginBottom: "4px",
                }}
              >
                {item.title}
              </strong>
              <p
                style={{
                  margin: "2px 0",
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: "0.8em",
                  lineHeight: "1.3",
                }}
              >
                {item.description}
              </p>
              <div
                className="advice"
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontStyle: "italic",
                  background: "rgba(255, 255, 255, 0.05)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  marginTop: "4px",
                  fontSize: "0.8em",
                }}
              >
                {item.advice}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer avec conseils généraux */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          background: "rgba(255, 255, 255, 0.05)",
          borderRadius: "8px",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            color: "rgba(255, 255, 255, 0.8)",
            fontSize: "0.75em",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          💡 <strong>Astuce :</strong> Les seuils sont configurables dans le
          dashboard. Adaptez selon vos activités préférées !
        </div>
      </div>
    </div>
  );
};

export default WeatherLegend;
