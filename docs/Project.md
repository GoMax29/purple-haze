# Projet React Surf-N-Weather

## Vue d'ensemble

Application React/Next.js dédiée aux conditions de surf et météo en Bretagne, combinant données météorologiques, de houle et de qualité de l'air.

---

## Structure du Projet

```
/React Surf-N-Weather
├── src/
│   ├── app/           # Next.js 13+ App Router
│   ├── components/    # Composants React réutilisables
│   └── styles/        # Styles et thèmes
├── pages/
│   ├── api/           # API Routes Next.js
│   │   ├── fetchMeteoData.js  # Module principal météo ✅
│   │   ├── forecast/  # API prévisions
│   │   └── surf/      # API données surf
│   └── index.tsx      # Page d'accueil
├── docs/              # Documentation technique
│   ├── Documentation.md # Doc APIs et modules ✅
│   └── Project.md     # Ce fichier
└── config/           # Configuration projet
```

---

## Milestones

### ✅ Milestone 1 : Infrastructure API (TERMINÉ)

- [x] Module `fetchMeteoData.js` avec cache mémoire
- [x] Intégration 3 APIs Open-Meteo en parallèle
- [x] Documentation complète des endpoints
- [x] Système de cache TTL 15 minutes
- [x] Gestion d'erreurs robuste
- [x] Support Next.js API routes

### ✅ Milestone 2 : Traitement Paramètres Météo (TERMINÉ)

- [x] Pondération Gaussienne des modèles météo (σ=1.5, centre=médiane)
- [x] Modules de traitement par paramètre (`traitement/temperature.js`, `temperature_apparente.js`)
- [x] Configuration externe via fichiers JSON (`config/temperature.json`, etc.)
- [x] Interface de test modulaire `/test-param` (remplace `/test-meteo`)
- [x] Support multi-modèles avec échéances spécifiques
- [x] Format de sortie normalisé `[{datetime, value}, ...]`

### 🔄 Milestone 3 : Composants UI (EN COURS)

- [x] Interface test modulaire `/test-param` avec onglets
- [ ] Composant WeatherCard
- [ ] Composant SurfConditions
- [ ] Graphiques Chart.js pour prévisions
- [ ] Interface sélection ville
- [ ] Dashboard responsive

### 📋 Milestone 4 : Algorithmes Avancés (PLANIFIÉ)

- [ ] Algorithmes de scoring surf
- [ ] Extension traitement : force vent, probabilité pluie
- [ ] Agrégation intelligente des prévisions
- [ ] Calculs d'indices composites

### 📋 Milestone 4 : Optimisation (PLANIFIÉ)

- [ ] PWA et cache service worker
- [ ] Lazy loading composants
- [ ] Optimisation images
- [ ] Performance monitoring

---

## Tâches Actuelles

### 🔄 EN COURS

- **Interface de test modulaire `/test-param`** : ✅ **TERMINÉ**
- **Refactor front statique `/public/test-algo` en modules** : ✅ **TERMINÉ**
  - Orchestrateur `public/test-algo/app.js` minimal
  - 1 fichier JS par onglet dans `public/test-algo/js/`
  - Utilitaires partagés `public/test-algo/js/common.js`
  - Règle: tout nouvel onglet doit suivre cette structure (HTML + JS séparés)
  - Remplace l'ancienne interface `/test-meteo`
  - Architecture modulaire avec onglets réutilisables
  - Utilise directement les fonctions de traitement métier
  - Onglets : Température, Température Apparente (+ futurs paramètres)
  - Configuration Plomeur (47.8333°, -4.3167°)
  - 2025-08-12: Correction bug onglet précipitations lorsque la ville par défaut ne possède pas 10 heures mouillantes (index hors limites dans `renderEnvelopeMethod`). La méthode gère désormais dynamiquement `min(wetHours.length, 10)`.

### 📋 TODO

- [ ] Tests unitaires pour fetchMeteoData.js
- [ ] Interface utilisateur pour tester l'API
- [ ] Logs de performance et monitoring
- [ ] Extension support nouvelles villes

### ✅ DONE (ajouts récents)

- [x] Intégration `daily=sunrise,sunset` dans l'API principale Open-Meteo
- [x] Propagation sunrise/sunset dans `dailyData` puis `dailyCardData`
- [x] Utilitaires `dayNight` (classification jour/nuit/transition) et règle spéciale `18-00`
- [x] Rendu icônes PNG finales day/night dans `DailyCard` via `public/icons/final_wmo/{day|night}/{code}.png`

### ✅ DONE

- [x] **2025-01-27** : Création module fetchMeteoData.js
- [x] **2025-01-27** : Documentation APIs Open-Meteo
- [x] **2025-01-27** : Système de cache avec TTL
- [x] **2025-01-27** : Support 10 villes bretonnes
- [x] **2025-01-30** : Interface de test modulaire `/test-param` (remplace `/test-meteo`)
- [x] **2025-01-30** : Architecture onglets réutilisables pour paramètres météo
- [x] **2025-01-30** : Intégration directe fonctions traitement métier
- [x] **2025-01-30** : Onglets Température et Température Apparente fonctionnels

- [x] **2025-08-13** : Banc de test icônes WMO et traitement images

  - Génération d'icônes à fond transparent (158x141) dans `docs/icones WMO/wmo icon transparent background/`
  - Amélioration anti-aliasing + fuzz 10% sur originaux vers `docs/icones WMO/improve/`
  - Page `docs/test-wmo-background.html` (slider 10–200px, color picker, boutons gradient/random) pour valider transparence et taille optimale

- [x] **2025-09-04** : Prototype Terre/Mer autonome `land_or_sea.html`
  - Leaflet + tuiles OSM « standard »
  - Recherche Nominatim (liste résultats cliquables)
  - Overpass coastline: détection terre/mer, spot valide (≤500 m)
  - 3 algorithmes d’orientation (segment, fenêtre PCA, moyenne pondérée)
  - Tracés: tangente verte ~1 km, houle perpendiculaire bleue ~1 km

---

## APIs Intégrées

### 📊 Open-Meteo Forecast API

- **Endpoint** : `https://api.open-meteo.com/v1/forecast`
- **Données** : Météo multi-modèles (11 modèles européens)
- **Période** : 0h à 168h (7 jours)
- **Paramètres** : Température, vent, précipitations, humidité

### 🌤️ Open-Meteo Air Quality API

- **Endpoint** : `https://air-quality-api.open-meteo.com/v1/air-quality`
- **Données** : UV et qualité de l'air
- **Paramètres** : european_aqi, uv_index, uv_index_clear_sky

### 🌊 Open-Meteo Marine API

- **Endpoint** : `https://marine-api.open-meteo.com/v1/marine`
- **Données** : Houle, température surface, courants
- **Modèles** : meteofrance_wave, ecmwf_wam025, gwam, ewam, meteofrance_currents

---

## Villes Supportées

| Ville       | Latitude | Longitude | Zone            |
| ----------- | -------- | --------- | --------------- |
| Brest       | 48.3903  | -4.4863   | Finistère Nord  |
| Quimper     | 47.9963  | -4.0985   | Finistère Sud   |
| Lorient     | 47.7482  | -3.3616   | Morbihan        |
| Vannes      | 47.6587  | -2.7603   | Morbihan        |
| Rennes      | 48.1173  | -1.6778   | Ille-et-Vilaine |
| Saint-Malo  | 48.6497  | -2.0251   | Ille-et-Vilaine |
| Ploumanac'h | 48.8313  | -3.4623   | Côtes-d'Armor   |
| Crozon      | 48.2474  | -4.4896   | Finistère       |
| Douarnenez  | 48.0926  | -4.3286   | Finistère       |
| Concarneau  | 47.8736  | -3.9179   | Finistère       |

---

## Architecture Technique

### 🚀 Stack Technologique

- **Frontend** : React 18, Next.js 13+
- **Styling** : TailwindCSS, Shadcn UI
- **API** : Next.js API Routes
- **Cache** : Mémoire native (Map)
- **Types** : TypeScript (à implémenter)

### 📦 Modules Principaux

#### fetchMeteoData.js

```javascript
export async function fetchMeteoData(ville)
export function clearCache()
export function getCacheStats()
export function getSupportedCities()
```

**Fonctionnalités** :

- Cache mémoire avec TTL 15 minutes
- Requêtes parallèles optimisées
- Gestion d'erreurs robuste
- Structure unifiée de retour
- Support API Routes Next.js

---

## Standards de Développement

### 🎯 Bonnes Pratiques

- **Composants fonctionnels** avec hooks React
- **Fonctions nommées** explicites (`handleClick`, `toggleModal`)
- **Single responsibility** par composant
- **TailwindCSS** pour le styling
- **Pas de console.log** en production

### 📁 Organisation Code

- `/src/app` : App Router Next.js 13+
- `/components/ui` : Composants génériques
- `/components/feature` : Composants métier
- `/pages/api` : API Routes
- `/docs` : Documentation technique

### 🧪 Tests et Qualité

- Tests unitaires avec Jest/React Testing Library
- ESLint + Prettier pour la cohérence code
- Documentation inline JSDoc
- Gestion d'erreurs exhaustive

---

## Performance et Optimisation

### ⚡ Cache Strategy

- **TTL** : 15 minutes pour données météo
- **Storage** : Mémoire (production : Redis recommandé)
- **Invalidation** : Automatique par expiration
- **Hit Rate** : Surveillé via getCacheStats()

### 🔄 API Calls

- **Parallélisation** : 3 APIs simultanées
- **Timeout** : À implémenter (recommandé : 10s)
- **Retry** : À implémenter (recommandé : 3 tentatives)
- **Rate Limiting** : Géré par cache + TTL

### 📊 Monitoring

- Logs de performance (temps de réponse)
- Statistiques de cache (hit/miss ratio)
- Erreurs API trackées
- Métriques usage par ville

---

## Roadmap et Prochaines Étapes

### 🎯 Priorité Haute

1. **Tests unitaires** pour fetchMeteoData.js
2. **Interface de test** pour validation API
3. **Monitoring** et logging amélioré
4. **TypeScript** migration

### 🎯 Priorité Moyenne

1. **Composants UI** de base
2. **Algorithmes de scoring** surf
3. **PWA** configuration
4. **Optimisation** performance

### 🎯 Priorité Basse

1. **Nouvelles villes** support
2. **APIs additionnelles** (marées, satellites)
3. **Machine Learning** prédictions
4. **Mobile app** React Native

---

## Notes Techniques

### 🔧 Configuration Recommandée

```bash
# Installation dépendances
npm install

# Développement
npm run dev

# Build production
npm run build

# Tests
npm run test
```

### 🌐 Endpoint de Test

```bash
# Test API locale
curl "http://localhost:3000/api/fetchMeteoData?ville=brest"

# Stats cache
curl "http://localhost:3000/api/fetchMeteoData/stats"
```

### 📝 Variables d'Environnement

```env
# À implémenter si nécessaire
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
CACHE_TTL_MINUTES=15
LOG_LEVEL=info
```

---

## Historique des Versions

### v0.1.0 - 2025-01-27

- ✅ Module fetchMeteoData.js opérationnel
- ✅ Documentation APIs complète
- ✅ Cache mémoire avec TTL
- ✅ Support 10 villes bretonnes
- ✅ API Routes Next.js intégrées

### v0.2.0 - 2025-01-30

- ✅ **Milestone 2 - Interface Test Modulaire :**
  - Interface `/test-param` remplace `/test-meteo` obsolète
  - Architecture modulaire avec onglets par paramètre météo
  - Intégration fonctions de traitement métier existantes
  - Onglet Température avec graphique Chart.js et tableau J+1 à J+7
  - Onglet Température Apparente avec design thématique
  - Composant Tab.tsx réutilisable pour futurs paramètres

---

_Dernière mise à jour : 30 janvier 2025_
_Prochaine révision : Après implémentation nouveaux paramètres météo_
