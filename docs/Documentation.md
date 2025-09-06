# Documentation API - React Surf-N-Weather

## 🎯 Milestone 2: Système de Traitement des Paramètres Météo

### Vue d'ensemble

Le Milestone 2 introduit un système modulaire de traitement des paramètres météo avec pondération gaussienne. Chaque paramètre météo dispose de son propre module de traitement et fichier de configuration.

### Architecture

```
traitement/
├── temperature.js              # Module température
├── temperature_apparente.js    # Module température apparente
├── humidite.js                 # Module humidité relative
├── wind.js                     # Module vent (force, rafales, direction) ✅ NOUVEAU
└── [futurs paramètres...]

config/
├── temperature.json            # Configuration température
├── temperature_apparente.json  # Configuration température apparente
├── humidite.json               # Configuration humidité relative
├── wind.json                   # Configuration vent ✅ NOUVEAU
├── README.md                   # Documentation des configurations
└── [futurs paramètres...]
```

### Architecture front Test-Algo (modulaire) – Nouveau

```
public/test-algo/
├── app.js                 # Orchestrateur léger (onglets, thèmes, chargement HTML + modules)
├── style.css
├── modules/               # Fragments HTML chargés dynamiquement (1 par onglet)
│   ├── temp.html
│   ├── apparent.html
│   ├── humidite.html
│   ├── wmo.html
│   └── methodo.html
└── js/                    # Logique JS par onglet
    ├── common.js          # Utilitaires partagés (formatHour, spinner, WMO icon/desc, etc.)
    ├── temp.js            # Initialisation + rendu de l’onglet Température
    ├── apparent.js        # Initialisation + rendu Température apparente
    ├── humidite.js        # Initialisation + rendu Humidité
    ├── wmo.js             # Matrice WMO 168h + tableau agrégé 168h
    └── methodo.js         # Section méthodologie/UI statique
```

Règle d’implémentation: chaque nouvel onglet de la page `test-algo` DOIT avoir son fichier HTML dans `public/test-algo/modules/<onglet>.html` et son fichier JS dédié dans `public/test-algo/js/<onglet>.js` qui expose `init(config)` via `window.TestAlgoRegisterModule("<onglet>", { init })`. L’orchestrateur `app.js` se charge uniquement de:

- gérer la navigation d’onglets et le thème
- charger le fragment HTML
- charger dynamiquement le module JS correspondant et appeler `init(CONFIG)`

### Fonctionnalités

- ✅ Traitement autonome par paramètre météo
- ✅ Configuration externe via fichiers JSON
- ✅ Algorithmes de pondération gaussienne multiples :
  - Gaussienne classique (σ=1.5, centre=médiane)
  - **Gaussienne adaptative** (σ auto-calculé avec multiplicateur)
- ✅ Support multi-modèles avec échéances spécifiques
- ✅ Format de sortie normalisé `[{datetime, value}, ...]`
- ✅ Vent: sortie objet horaire `{ datetime, speed, gust, gust_max, direction }`
- ✅ Page de test interactive `/test-meteo` (obsolète)
- ✅ API de test `/api/test-meteo`
- ✅ **Nouvelle interface de test modulaire `/test-param`** (remplace `/test-meteo`)

### Utilisation

```javascript
import { traiterTemperature } from "../traitement/temperature.js";
import { traiterHumidite } from "../traitement/humidite.js";

// Traiter la température pour des coordonnées
const tempData = await traiterTemperature(48.3903, -4.4863);
// Retourne: [{datetime: "2025-01-30T00:00", value: 22.3}, ...]

// Traiter l'humidité relative avec algorithme adaptatif
const humiditeData = await traiterHumidite(48.3903, -4.4863);
// Retourne: [{datetime: "2025-01-30T00:00", value: 78.5}, ...]
```

### Interface de Test Modulaire (`/test-param`)

#### Vue d'ensemble

Nouvelle interface de test météo modulaire et réutilisable remplaçant complètement l'ancien `/test-meteo` obsolète. Cette interface utilise directement les fonctions de traitement métier et leurs configurations JSON associées.

#### Architecture Modulaire

```
src/app/test-param/
├── page.tsx                    # Layout principal avec navigation onglets
├── Tab.tsx                     # Composant onglet réutilisable
└── tabs/
    ├── test_temperature.tsx           # Onglet température
    ├── test_apparent_temperature.tsx  # Onglet température apparente
    ├── test_wind_force.tsx           # Onglet force du vent (futur)
    └── test_rain_probability.tsx     # Onglet probabilité pluie (futur)
```

#### Fonctionnalités par Onglet

Chaque onglet météo implémente :

1. **Titre et description** du paramètre analysé
2. **Tableau de prévisions** (J+1 à J+7) :
   - Données toutes les 6h (2h, 8h, 14h, 20h)
   - Modèles utilisés avec leurs poids
   - Valeurs finales pondérées (en gras)
3. **Graphique Chart.js** :
   - Évolution des valeurs sur 7 jours
   - Type ligne pour données continues
4. **Encart "Exemple de calcul"** (h+24) :
   - Valeurs brutes de chaque modèle
   - Médiane calculée
   - Poids gaussiens appliqués
   - Résultat final pondéré

#### Cas d'usage

- **Ville fixe** : Plomeur, Bretagne (47.8322°N, -4.2967°W)
- **Interface responsive** avec TailwindCSS
- **Chargement conditionnel** selon l'onglet actif
- **Design thématique** : couleur dominante par paramètre météo

#### Avantages

- ✅ **Modularité** : logique métier séparée de l'affichage
- ✅ **Lisibilité** : un onglet = un paramètre météo
- ✅ **Réutilisabilité** : logique de traitement commune
- ✅ **Performance** : chargement conditionnel par onglet
- ✅ **Maintenabilité** : utilise les fonctions de `traitement/` existantes

#### Structure

```
src/app/test-param/
├── page.tsx                          # Layout principal avec onglets
├── Tab.tsx                          # Composant onglet réutilisable
└── tabs/
    ├── test_temperature.tsx         # Onglet température
    ├── test_apparent_temperature.tsx # Onglet température apparente
    ├── test_humidite.tsx            # Onglet humidité relative
    └── [futurs paramètres...]       # wind_force, rain_force, rain_probability, etc.
```

#### Fonctionnalités par onglet

Chaque onglet implémente :

- **Import des fonctions métier** : Utilise directement `traiterTemperature()`, `traiterTemperatureApparente()`, etc.
- **Affichage de configuration** : Lecture et affichage du fichier JSON de configuration
- **Tableau de données** : J+1 à J+7 aux heures 2h, 8h, 14h, 20h avec valeurs pondérées en gras
- **Graphique Chart.js** : Évolution des valeurs finales sur 7 jours (placeholder)
- **Exemple de calcul** : Détail du calcul gaussien pour h+24
- **Statistiques** : Min/max/moyenne des données traitées

#### Ville de test

Interface configurée pour **Plomeur** (47.8333°, -4.3167°), Finistère, Bretagne.

#### Avantages

- **Modularité** : Logique métier séparée de l'affichage
- **Réutilisabilité** : Fonctions de traitement partagées
- **Lisibilité** : Un onglet = un paramètre météo
- **Performance** : Chargement conditionnel selon l'onglet actif
- **Évolutivité** : Ajout facile de nouveaux paramètres

#### Utilisation

```typescript
// Navigation vers l'interface
/test-param

// Onglets disponibles :
- Température : test_temperature.tsx
- Température Apparente : test_apparent_temperature.tsx
- Humidité : test_humidite.tsx
- Code WMO : test_wmo.tsx (NOUVEAU)
- Vent : test_wind.tsx (à venir)
```

### Module WMO - Algorithme par Groupes de Sévérité ⭐ NOUVEAU

#### Vue d'ensemble

Le module WMO (`traitement/wmo.js`) implémente un algorithme avancé de traitement des codes météo WMO par groupes de sévérité hiérarchiques avec seuil dynamique.

#### Caractéristiques

- **Configuration** : `config/wmo.json` (13 modèles météo)
- **Algorithme** : `wmoSeverityGroups` avec 9 groupes de sévérité (0-8)
- **Seuil dynamique** : `80 / nb_groupes_présents` % pour sélection automatique
- **Alertes automatiques** : Risques orage/grêle/verglas/brouillard (échelle 0-5)
- **Interface** : Matrice visuelle avec icônes animées + section méthodologie

#### Groupes de Sévérité

```javascript
0: [0] - Ciel clair
1: [1,2,3] - Peu nuageux, couvert
2: [45,48] - Brouillard
3: [51-55,61-65] - Bruine + Pluie
4: [56-57,66-67] - Pluie/bruine verglaçante
5: [80,81,82] - Averses de pluie
6: [71-77,85,86] - Neige
7: [95] - Orage
8: [96,99] - Orage avec grêle
```

#### Fonctionnement

1. **Regroupement** : Codes WMO classés par groupes de sévérité
2. **Seuil adaptatif** : Plus il y a de diversité météo, plus les seuils baissent
3. **Sélection hiérarchique** : Parcours décroissant de sévérité jusqu'au seuil
4. **Médiane haute** : Si nombre pair de codes, prend la valeur supérieure
5. **Calcul risques** : Proportion des modèles alertants × 5

#### Interface WmoTestMatrix.tsx

- **Matrice 24h** : Codes WMO par modèle et heure avec icônes animées
- **Alertes visuelles** : Risques météo agrégés sur 7 jours
- **Méthodologie** : 6 exemples concrets d'application de l'algorithme
- **Tooltips** : Description WMO au survol des icônes
- **Icônes animées** : 26 icônes SVG dans `/public/icons/wmo/` (copiées depuis `/docs/animated/`)

---

## Précipitations — Agrégation mm et PoP simplifiée

---

## Vent — Force, Rafales, Direction ✅ NOUVEAU

- Config: `config/wind.json`
- Algorithmes:
  - Force (speed) et rafales (gust): gaussienne classique (`shared/gaussian_weighted.js`)
  - Direction: moyenne vectorielle pondérée gaussienne (`shared/wind_direction.algorithms.js`)
- Sortie par heure: `{ datetime, speed, gust, gust_max, direction }`

Paramètres clé (config):

- `algorithm_params.sigma_speed`: σ pour la force du vent
- `algorithm_params.sigma_gust`: σ pour les rafales
- `algorithm_params.sigma_direction_deg`: σ angulaire (en degrés) pour la direction

Modèles et échéances:

- MF AROME (0h-62h), MF AROME HD (0h-62h), ARPEGE (48h-116h), HARMONIE (0h-48h), UKMO 2KM (0h-62h), ICON EU (0h-128h), ICON Global (0h-96h), UKMO Global (96h-167h), GFS GraphCast (96h-167h), ECMWF IFS (0h-168h)

Méthode directionnelle:

1. Conversion degrés → vecteurs unitaires (cos, sin)
2. Centre initial par moyenne vectorielle simple
3. Poids gaussiens selon l'écart angulaire minimal à ce centre
4. Somme pondérée des vecteurs puis atan2(sumY, sumX)

- Config: `config/precipitation.json`
- Algorithmes:
  - Agrégation mm: gaussienne pondérée avec log optionnel (`shared/precipitation_mm.algorithms.js`)
  - Probabilité PoP: formule simplifiée (`shared/precipitation_%.algorithms.js`)
- Sortie par heure: `{ datetime, mm_agg, mouillant: [{model,mm}], CI, IQR, PoP }`

Paramètres clé (config):

- `aggregation_params.wet_threshold_mm` (0.1 par défaut)
- `aggregation_params.use_log_transform` (true/false)
- `aggregation_params.epsilon` (0.001)
- `aggregation_params.sigma_ratio` (0.2)
- `probability_params`: `a`, `b`, `c`, `neutral_mm`, `mm_max`, `epsilon`, `day_decay_per_day`

Méthode:

- Filtrer modèles mouillant (> seuil)
- Option log: `valT = log(mm+eps)`
- Médiane mT, `sigma = sigma_ratio * mT`
- Poids: `exp(-0.5 * ((valT - mT)/sigma)^2)`
- Moyenne pondérée, retransformer si log: `exp(meanT) - eps`
- CI: % valeurs dans ±20% de la médiane (brute)
- IQR: Q3 - Q1 des valeurs brutes
- PoP: `a*prop + b*D' + c*w_echeance` avec `D'` sur échelle log normalisée et `w_echeance` décroissant par jour

## Module fetchMeteoData.js

### Vue d'ensemble

Le module `fetchMeteoData.js` centralise l'accès aux données météorologiques depuis trois APIs Open-Meteo distinctes, avec un système de cache mémoire optimisé.

### Fonctionnalités principales

- ✅ Cache mémoire par ville (TTL 15 minutes)
- ✅ Requêtes parallèles pour optimiser les performances
- ✅ Structure unifiée de retour
- ✅ Gestion d'erreurs robuste
- ✅ Support Next.js API routes

---

## API 1 - Données Principales Météo

### Endpoint

```
https://api.open-meteo.com/v1/forecast
```

### Paramètres utilisés

```javascript
{
  latitude: 48.3903,
  longitude: -4.4863,
  hourly: [
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_2m",
    "apparent_temperature",
    "precipitation_probability",
    "precipitation",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m"
  ],
  daily: [
    "sunrise",
    "sunset"
  ],
  models: [
    "ecmwf_ifs025",
    "gfs_global",
    "gfs_graphcast025",
    "icon_global",
    "icon_eu",
    "knmi_harmonie_arome_europe",
    "meteofrance_arpege_europe",
    "meteofrance_arome_france",
    "meteofrance_arome_france_hd",
    "ukmo_global_deterministic_10km",
    "ukmo_uk_deterministic_2km"
  ],
  timezone: "Europe/Berlin"
}
```

### Structure de réponse

```javascript
{
  "latitude": 48.5,
  "longitude": -4.5,
  "generationtime_ms": 1.66523456573486,
  "utc_offset_seconds": 7200,
  "timezone": "Europe/Berlin",
  "timezone_abbreviation": "GMT+2",
  "elevation": 55,
  "hourly_units": {
    "time": "iso8601",
    "temperature_2m_ecmwf_ifs025": "°C",
    "relative_humidity_2m_ecmwf_ifs025": "%",
    "precipitation_ecmwf_ifs025": "mm",
    "weather_code_ecmwf_ifs025": "wmo code",
    "wind_speed_10m_ecmwf_ifs025": "km/h",
    "wind_direction_10m_ecmwf_ifs025": "°",
    "wind_gusts_10m_ecmwf_ifs025": "km/h"
    // ... pour chaque modèle
  },
  "hourly": {
    "time": ["2025-07-30T00:00", "2025-07-30T01:00", ...],
    "temperature_2m_ecmwf_ifs025": [17.2, 17.1, 17.0, ...],
    "relative_humidity_2m_ecmwf_ifs025": [95, 95, 96, ...],
    // ... données pour chaque modèle et paramètre
  }
  "daily": {
    "time": ["2025-08-18", ...],
    "sunrise": ["2025-08-18T07:16", ...],
    "sunset":  ["2025-08-18T21:24", ...]
  }
}
```

### Données fournies

- **Période** : 0h à 168h (7 jours)
- **Fréquence** : Heure par heure
- **Modèles** : 11 modèles météorologiques européens
- **Paramètres** : Température, humidité, précipitations, vent, code météo

---

## API 2 - UV et Qualité de l'Air

### Endpoint

```
https://air-quality-api.open-meteo.com/v1/air-quality
```

### Paramètres utilisés

```javascript
{
  latitude: 48.3903,
  longitude: -4.4863,
  hourly: [
    "european_aqi",
    "uv_index",
    "uv_index_clear_sky"
  ],
  timezone: "Europe/Berlin"
}
```

### Structure de réponse

```javascript
{
  "latitude": 48.4,
  "longitude": -4.5,
  "generationtime_ms": 0.378012657165527,
  "utc_offset_seconds": 7200,
  "timezone": "Europe/Berlin",
  "timezone_abbreviation": "GMT+2",
  "elevation": 55,
  "hourly_units": {
    "time": "iso8601",
    "european_aqi": "EAQI",
    "uv_index": "",
    "uv_index_clear_sky": ""
  },
  "hourly": {
    "time": ["2025-07-31T00:00", "2025-07-31T01:00", ...],
    "european_aqi": [22, 20, 16, 12, ...],
    "uv_index": [0, 0, 0, 0, 0, 0, 0, 0, 0.1, 0.45, ...],
    "uv_index_clear_sky": [0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0.85, ...]
  }
}
```

### Données fournies

- **european_aqi** : Indice européen de qualité de l'air (1-500)
- **uv_index** : Indice UV réel
- **uv_index_clear_sky** : Indice UV par ciel clair (référence)

---

## API 3 - Données de Houle et Marine

### Endpoint

```
https://marine-api.open-meteo.com/v1/marine
```

### Paramètres utilisés

```javascript
{
  latitude: 47.8402,
  longitude: -4.36,
  hourly: [
    "sea_surface_temperature",
    "ocean_current_velocity",
    "wave_height",
    "wave_direction",
    "wave_period"
  ],
  models: [
    "meteofrance_wave",
    "ecmwf_wam025",
    "gwam",
    "ewam",
    "meteofrance_currents"
  ],
  timezone: "Europe/Berlin"
}
```

### Structure de réponse

```javascript
{
  "latitude": 47.875,
  "longitude": -4.3749847,
  "generationtime_ms": 0.281453132629395,
  "utc_offset_seconds": 7200,
  "timezone": "Europe/Berlin",
  "timezone_abbreviation": "GMT+2",
  "elevation": 0,
  "hourly_units": {
    "time": "iso8601",
    "sea_surface_temperature_meteofrance_currents": "°C",
    "ocean_current_velocity_meteofrance_currents": "km/h",
    "wave_height_meteofrance_wave": "m",
    "wave_direction_meteofrance_wave": "°",
    "wave_period_meteofrance_wave": "s"
    // ... pour chaque modèle
  },
  "hourly": {
    "time": ["2025-07-31T00:00", "2025-07-31T01:00", ...],
    "sea_surface_temperature_meteofrance_currents": [16, 15.9, 15.9, ...],
    "ocean_current_velocity_meteofrance_currents": [1.1, 0.5, 0, ...],
    "wave_height_meteofrance_wave": [0.8, 0.78, 0.76, ...],
    "wave_direction_meteofrance_wave": [290, 290, 289, ...],
    "wave_period_meteofrance_wave": [6.55, 6.7, 6.85, ...]
    // ... données pour chaque modèle
  }
}
```

### Particularités des modèles

| Modèle               | Température Surface | Courant Océan | Hauteur Vague | Direction Vague | Période Vague |
| -------------------- | ------------------- | ------------- | ------------- | --------------- | ------------- |
| meteofrance_currents | ✅                  | ✅            | ❌            | ❌              | ❌            |
| meteofrance_wave     | ❌                  | ❌            | ✅            | ✅              | ✅            |
| ecmwf_wam025         | ❌                  | ❌            | ✅            | ✅              | ✅            |
| gwam                 | ❌                  | ❌            | ✅            | ✅              | ❌            |
| ewam                 | ❌                  | ❌            | ✅            | ✅              | ✅            |

> ⚠️ **Note importante** : Seul le modèle `meteofrance_currents` fournit les données de température de surface et de vitesse des courants océaniques.

---

## Utilisation du Module fetchMeteoData

### Import et appel

```javascript
import { fetchMeteoData } from "../api/fetchMeteoData";

// Récupération des données pour Brest
const data = await fetchMeteoData("brest");
```

### Structure de réponse unifiée

```javascript
{
  "ville": "brest",
  "coordinates": { "lat": 48.3903, "lon": -4.4863 },
  "timestamp": "2025-01-27T14:30:00.000Z",
  "ttl_minutes": 15,
  "api1": {
    "source": "open-meteo.com/forecast",
    "description": "Données météo multi-modèles (0h-168h)",
    "models": ["ecmwf_ifs025", "gfs_global", ...],
    "data": { /* Structure API 1 */ }
  },
  "api2": {
    "source": "air-quality-api.open-meteo.com",
    "description": "UV et qualité de l'air (heure par heure)",
    "parameters": ["european_aqi", "uv_index", "uv_index_clear_sky"],
    "data": { /* Structure API 2 */ }
  },
  "api3": {
    "source": "marine-api.open-meteo.com",
    "description": "Données de houle et marine",
    "models": ["meteofrance_wave", "ecmwf_wam025", "gwam", "ewam", "meteofrance_currents"],
    "note": "meteofrance_currents fournit uniquement sea_surface_temperature et ocean_current_velocity",
    "data": { /* Structure API 3 */ }
  }
}
```

### Villes supportées

```javascript
[
  "brest",
  "quimper",
  "lorient",
  "vannes",
  "rennes",
  "saint-malo",
  "ploumanach",
  "crozon",
  "douarnenez",
  "concarneau",
];
```

### API Route Next.js

```
GET /api/fetchMeteoData?ville=brest
```

### Fonctions utilitaires

```javascript
import {
  clearCache,
  getCacheStats,
  getSupportedCities,
} from "../api/fetchMeteoData";

// Vider le cache
clearCache();

// Statistiques du cache
const stats = getCacheStats();
// {
//   total_entries: 3,
//   valid_entries: 2,
//   expired_entries: 1,
//   cities_cached: ['brest', 'quimper'],
//   ttl_minutes: 15
// }

// Liste des villes supportées
const cities = getSupportedCities();
```

---

## Performance et Cache

### Système de cache

- **TTL** : 15 minutes par défaut
- **Stockage** : Mémoire (Map JavaScript)
- **Clé** : Nom de ville normalisé (lowercase, trimmed)
- **Invalidation** : Automatique après expiration

### Optimisations

- **Requêtes parallèles** : Les 3 APIs sont appelées simultanément
- **Cache intelligent** : Vérification TTL avant chaque requête
- **Gestion d'erreurs** : Chaque API est appelée indépendamment

### Exemple de logs

```
Cache MISS pour brest - Récupération des données API...
Données récupérées et mises en cache pour brest

Cache HIT pour brest (15min TTL)
```

---

## Gestion d'erreurs

### Types d'erreurs

1. **Paramètre manquant** : `Paramètre ville requis (string)`
2. **Ville non supportée** : `Ville 'xyz' non supportée. Villes disponibles: ...`
3. **Erreur HTTP** : `API Météo Principale: HTTP 500 - Internal Server Error`
4. **Structure invalide** : `API UV/Qualité Air: Structure de données invalide`

### Codes de statut HTTP (API Route)

- **200** : Succès
- **400** : Paramètre ville manquant
- **405** : Méthode non autorisée (seul GET accepté)
- **500** : Erreur serveur (API externe ou traitement)

---

## Algorithmes et Logique Métier

### Core orchestrateur météo — buildForecastFromHourly

Entrée: séries horaires multi-modèles (API 1) et extras (API 2 UV/AQI)

Sortie:

```javascript
{
  hourlyData: [
    {
      time: "2025-07-30T00:00",
      temperature: 17.1,                  // médiane multi-modèles de temperature_2m_*
      apparentTemperature: 16.5,          // médiane multi-modèles de apparent_temperature_*
      humidity: 92,                       // médiane multi-modèles de relative_humidity_2m_*
      uvIndex: 0.3,                       // direct API 2 si fourni
      aqi: 22,                            // direct API 2 si fourni (european_aqi)
      precipitation: {
        mm: 0.4,                          // aggregatePrecipMm
        CI: 72,                           // Consensus Index
        IQR: 0.2,                         // Interquartile Range
        PoP: 38                           // computePoP
      },
      wind: {
        speed: 18,                        // médiane multi-modèles wind_speed_10m_*
        direction: 245,                   // moyenne vectorielle sur wind_direction_10m_*
        gust: 34                          // médiane multi-modèles wind_gusts_10m_*
      },
      wmo: 3                               // wmoAlgorithms.bary
    }
  ],
  dailyData: [
    {
      date: "2025-07-30",
      temperature: { min: 12.5, max: 20.1 },
      uv: { max: 6.2 },
      precipitation: { total_mm: 3.8 },
      wmo: {
        byTranche: {
          "00-06": 1,
          "06-12": 2,
          "12-18": 61,
          "18-00": 2
        }
      }
    }
  ]
}
```

Implémentation: `src/core/forecastCore.js`

### WMO — Algorithme barycentrique (bary)

- Source config: `config/wmo.json`
- Implémentation: `shared/wmo_algorithms.js` (clé `bary` → `barycenterThreeGroups`)
- Agrégation quotidienne par tranches: application du même barycentre aux codes WMO de toutes les heures de la tranche et de tous les modèles actifs.

### Précipitations — Agrégation mm et PoP

- Source config: `config/precipitation.json`
- mm, CI, IQR: `shared/precipitation_mm.algorithms.js` → `aggregatePrecipMm`
- PoP: `shared/precipitation_%.algorithms.js` → `computePoP`

### Algorithme de Cache avec TTL

```javascript
function isCacheValid(cacheEntry) {
  return cacheEntry && Date.now() - cacheEntry.timestamp < TTL_MS;
}
```

### Stratégie de Récupération Parallèle

```javascript
const [api1Data, api2Data, api3Data] = await Promise.all([
  fetchWithErrorHandling(api1Url, "API Météo Principale"),
  fetchWithErrorHandling(api2Url, "API UV/Qualité Air"),
  fetchWithErrorHandling(api3Url, "API Houle/Marine"),
]);
```

Cette approche garantit :

- **Performance maximale** : Pas d'attente séquentielle
- **Résilience** : Si une API échoue, les autres continuent
- **Cohérence temporelle** : Toutes les données correspondent au même instant

---

## UI – DailyCard et Toggle simple/détail

- `DailyCard.tsx` refactor: layout 3 zones, badges de risques, échelle UV corrigée et responsive.
- Masques d’opacité sur tranches 00–06, 06–12, 18–00 et sur la pastille UV.
- Nouveau composant `ToggleSimpleDetail.tsx` (☝/🖐) ajouté à droite du titre « Prévisions 7 jours » dans `WeeklySection.tsx`. Il pilote `detailMode` (simple = masques opaques ~90%, détail = 10%).

---

## Day/Night – Classification et Icônes finales

### Algorithme

- Entrées: `daily.sunrise[]`, `daily.sunset[]` (Open-Meteo Forecast API)
- Pour une heure donnée `H`:
  - Si `H < sunrise` → night
  - Si `sunrise <= H < sunset` → day
  - Si `H >= sunset` → night
  - Transition: si `HH(H) == HH(sunrise)` ou `HH(H) == HH(sunset)` → `transition`

### Tranches horaires (DailyCard)

- `00–06` → night
- `06–12` → day (transition si sunrise ∈ [06,12[)
- `12–18` → day (transition si sunset ∈ [12,18[)
- `18–00` → règle spéciale majority:
  - si `sunset_hour < 21h00` → night
  - si `sunset_hour >= 21h00` → day

### Chemins d'icônes

- Dossier: `public/icons/final_wmo/transparent/`
- Variantes: `day/`, `night/`
- Fichiers: `{code}.png` (ex: `public/icons/final_wmo/transparent/day/61.png`)
- Génération chemin: `/icons/final_wmo/transparent/{day|night}/{code}.png`
- Note: Icônes avec fond transparent (traitement ImageMagick : fuzz 12%, gaussian blur 0x1, enhance, alpha)

### Fichiers concernés

- `pages/api/fetchMeteoData.js` → ajoute `daily=sunrise,sunset`
- `src/core/forecastCore.js` → propage `sunrise/sunset` vers `dailyData` puis `dailyCardData`
- `src/utils/dayNight.ts` → `getDayNightStateAt`, `computeSlotVariant`, `getVariantForEveningSlot`
- `src/utils/wmoFinalIcons.ts` → `getWmoFinalIconPath(code, variant)`
- `src/components/legacy-ui/DailyCard.tsx` → affiche les PNG day/night par tranche

---

## Prototype Terre/Mer — Leaflet + OSM (land_or_sea.html)

### Vue d'ensemble

Page autonome (HTML/CSS/JS vanilla) pour:

- Recherche de ville (Nominatim) et recentrage carte Leaflet
- Détection « Sur terre » vs « Dans l’eau » (coastline OSM via Overpass)
- Validation spot surf: Dans l’eau et ≤ 500 m d’une côte
- Orientation locale de la côte (3 algorithmes)
- Tracés: tangente verte (~1 km), houle bleue perpendiculaire (~1 km)
- UX: épingles cliquables pour suppression, bouton « Tout effacer »

### Nominatim — Geocoding

- Endpoint: `https://nominatim.openstreetmap.org/search`
- Méthode: GET
- Paramètres utilisés:
  - `format=jsonv2`
  - `q` (chaîne de recherche)
  - `limit=8`
  - `addressdetails=1`
  - `accept-language=fr`
  - `email=prototype.local@example.com` (contact recommandé)

Exemple requête:

```http
GET https://nominatim.openstreetmap.org/search?format=jsonv2&q=Brest%2C%20France&limit=5&addressdetails=1&accept-language=fr
```

Exemple réponse (extrait):

```json
[
  {
    "place_id": "123",
    "lat": "48.3904",
    "lon": "-4.4861",
    "display_name": "Brest, Finistère, Bretagne, France",
    "type": "city"
  }
]
```

### Overpass — Coastline OSM

- Endpoints (fallback):
  - `https://overpass.kumi.systems/api/interpreter`
  - `https://overpass-api.de/api/interpreter`
- Requête Overpass utilisée (rayon variable 5–50 km):

```overpass
[out:json][timeout:25];
way["natural"="coastline"](around:10000,48.3904,-4.4861);
out geom;
```

Retour (extrait):

```json
{
  "elements": [
    {
      "type": "way",
      "id": 12345,
      "tags": { "natural": "coastline" },
      "geometry": [
        { "lat": 48.39, "lon": -4.49 },
        { "lat": 48.4, "lon": -4.48 }
      ]
    }
  ]
}
```

Note: Convention OSM `natural=coastline` — la mer est à gauche du sens du way.

### Détection Terre/Mer et distance à la côte

1. Récupérer les ways `natural=coastline` autour du point.
2. Linéariser en segments adjacents `(a,b)` (géométrie des ways).
3. Projeter le point sur chaque segment en Web Mercator (mètres):
   - Calculer le paramètre t de projection borné à [0,1]
   - Obtenir la distance mètres du point à la projection.
4. Choisir le segment minimisant cette distance (côte la plus proche).
5. Déterminer le côté via produit vectoriel 2D (signé) en métrique:
   - `crossZ = (AB.x * (P - Proj).y) - (AB.y * (P - Proj).x)`
   - `crossZ > 0` ⇒ point à gauche du segment ⇒ côté mer (selon convention OSM).
6. Classification:
   - `Dans l’eau` si `crossZ > 0`, sinon `Sur terre`.
   - `Spot valide` si `Dans l’eau` ET `distance ≤ 500 m`.

### Orientation locale de la côte — 3 algorithmes

Sortie: azimut en degrés (0° = Nord, 90° = Est).

1. Segment local (rapide)

   - Orientation = cap de `a → b` du segment le plus proche.
   - Avantage: simple; Inconvénient: sensible au zigzag local.

2. Fenêtre glissante (lissé PCA)

   - Prendre ±k nœuds autour de l’indice du segment (par défaut k=5).
   - Convertir en mètres (Web Mercator), centrer, calculer la matrice de covariance.
   - Le vecteur propre principal donne la direction dominante.
   - Convertir en azimut par `atan2(vx, vy)` (x=Est, y=Nord).

3. Moyenne pondérée des segments proches
   - Considérer tous les segments dans un rayon R (2 km).
   - Pour chaque segment, vecteur unitaire `u = (vx,vy)/||v||`.
   - Poids `w = 1 / max(1, distance_segment(point))`.
   - Orientation = `atan2(Σ w·ux, Σ w·uy)`.

### Tracés

- Tangente verte: ~1 km (±500 m) le long de l’orientation locale.
- Houle bleue: perpendiculaire côté mer (~1 km) depuis le point projeté sur la côte.

### Limites et remarques

- Dépend des données OSM (rare orientation incorrecte de certains ways).
- Overpass et Nominatim ont des limites de taux; prévoir fallback/caches côté client.
- Projection Web Mercator ≈ métrique locale correcte (erreur faible aux latitudes tempérées).

_Dernière mise à jour : 04 septembre 2025_
