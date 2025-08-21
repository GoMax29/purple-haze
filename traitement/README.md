# Modules de Traitement Météorologique

Ce répertoire contient les modules de traitement des paramètres météo du Milestone 2.

## Architecture

Chaque module suit le pattern :

1. **Import des dépendances** : `fetchMeteoData`, algorithme, `fs/path`
2. **Fonction principale** : `traiter[Parametre](lat, lon)`
3. **Fonction statistiques** : `get[Parametre]Stats(lat, lon)`
4. **Export par défaut** : fonction principale

## Modules Disponibles

### 🌡️ temperature.js

- **Algorithme** : `gaussian_weighted` (σ=1.5, centre=médiane)
- **API** : `temperature_2m`
- **Configuration** : `config/temperature.json`

### 🌡️ temperature_apparente.js

- **Algorithme** : `gaussian_weighted` (σ=1.5, centre=médiane)
- **API** : `apparent_temperature`
- **Configuration** : `config/temperature_apparente.json`

### 💧 humidite.js

- **Algorithme** : `adaptiveGaussianWeighted` (sigmaMultiplier=2.0)
- **API** : `relative_humidity_2m`
- **Configuration** : `config/humidite.json`
- **Particularité** : Sigma auto-calculé selon la dispersion des données

### 🌤️ wmo.js ⭐ NOUVEAU

- **Algorithme** : `wmoSeverityGroups` (groupes de sévérité avec seuil dynamique)
- **API** : `weather_code`
- **Configuration** : `config/wmo.json`
- **Particularité** : Traitement hiérarchique par niveau de sévérité (0-8) avec alertes automatiques

## Format de Sortie

Tous les modules retournent le format standardisé :

```javascript
[
  { datetime: "2025-01-30T00:00", value: 22.3 },
  { datetime: "2025-01-30T01:00", value: 22.1 },
  // ... plus de données horaires
];
```

## Utilisation

```javascript
import { traiterHumidite } from "./humidite.js";

const data = await traiterHumidite(47.8322, -4.2967);
console.log(`${data.length} points de données d'humidité traités`);
```

## Tests

Chaque module peut être testé via l'interface `/test-param` avec son onglet dédié.
