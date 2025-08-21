# 🔄 Migration vers API basée sur les Coordonnées GPS

## Changements Effectués

### ✅ Module fetchMeteoData.js

**AVANT (logique ville)** :

```javascript
fetchMeteoData(ville); // Ex: fetchMeteoData('brest')
```

**APRÈS (logique coordonnées)** :

```javascript
fetchMeteoData(latitude, longitude, options); // Ex: fetchMeteoData(48.3903, -4.4863)
```

### 🆕 Nouvelles Fonctions

#### Fonction principale

```javascript
export async function fetchMeteoData(latitude, longitude, options = {})
```

- **latitude** : Coordonnée GPS latitude (-90 à +90)
- **longitude** : Coordonnée GPS longitude (-180 à +180)
- **options.name** : Nom du spot pour les logs (optionnel)

#### Fonctions utilitaires

```javascript
export function getPredefinedSpots()          // Liste tous les spots prédéfinis
export function getSpotCoordinates(spotId)    // Récupère coords d'un spot prédéfini
export async function fetchMeteoDataBySpot(spotId) // Helper pour spots prédéfinis
export function getCacheStats()               // Stats cache (coordonnées au lieu de villes)
export function clearCache()                  // Vide le cache
```

### 🔧 Changements API Routes

**AVANT** :

```bash
GET /api/fetchMeteoData?ville=brest
```

**APRÈS** :

```bash
# Par coordonnées directes
GET /api/fetchMeteoData?lat=48.3903&lon=-4.4863
GET /api/fetchMeteoData?latitude=48.3903&longitude=-4.4863

# Par spot prédéfini (backward compatibility)
GET /api/fetchMeteoData?spot=brest
```

### 📊 Structure de Réponse Modifiée

**AVANT** :

```javascript
{
  ville: "brest",
  coordinates: { lat: 48.3903, lon: -4.4863 },
  // ...
}
```

**APRÈS** :

```javascript
{
  coordinates: { lat: 48.3903, lon: -4.4863 },
  spot_name: "Brest" | "48.3903,4.4863", // nom fourni ou coordonnées
  // ...
}
```

### 🗄️ Cache Optimisé

- **Clé de cache** : `"48.3903,-4.4863"` (coordonnées arrondies à 4 décimales)
- **Avantage** : Évite les doublons pour des coordonnées très proches
- **Performance** : Cache intelligent par position GPS

---

## Nouveaux Spots Supportés

### 🏙️ Villes (inchangé)

`brest`, `quimper`, `lorient`, `vannes`, `rennes`, `saint-malo`, `ploumanach`, `crozon`, `douarnenez`, `concarneau`

### 🏄‍♂️ Spots de Surf (nouveau)

- `la-torche` - Beach break populaire
- `cap-frehel` - Reef break, falaises
- `pointe-du-raz` - Conditions extrêmes
- `hossegor-offshore` - Point au large Landes

---

## Exemples d'Usage

### 💻 JavaScript Direct

```javascript
import {
  fetchMeteoData,
  fetchMeteoDataBySpot,
} from "./pages/api/fetchMeteoData";

// Méthode 1: Coordonnées directes
const data1 = await fetchMeteoData(48.3903, -4.4863, { name: "Brest" });

// Méthode 2: Spot prédéfini
const data2 = await fetchMeteoDataBySpot("la-torche");

// Méthode 3: Spot custom au large
const data3 = await fetchMeteoData(47.5, -5.0, { name: "Offshore Spot" });
```

### 🌐 API Routes

```bash
# Brest par coordonnées
curl "http://localhost:3000/api/fetchMeteoData?lat=48.3903&lon=-4.4863"

# La Torche par spot prédéfini
curl "http://localhost:3000/api/fetchMeteoData?spot=la-torche"

# Spot custom offshore
curl "http://localhost:3000/api/fetchMeteoData?lat=47.5&lon=-5"
```

### 📊 Gestion du Cache

```javascript
import { getCacheStats, clearCache } from "./pages/api/fetchMeteoData";

// Statistiques
const stats = getCacheStats();
console.log(stats.coordinates_cached); // ["48.3903,-4.4863", "47.8359,-4.3722"]

// Nettoyage
clearCache();
```

---

## Validation des Coordonnées

### ✅ Validations Automatiques

- **Type** : Coordonnées doivent être des `number`
- **Latitude** : -90 ≤ lat ≤ +90
- **Longitude** : -180 ≤ lon ≤ +180
- **Précision** : Arrondi automatique à 4 décimales pour le cache

### ❌ Gestion d'Erreurs

```javascript
// Exemples d'erreurs
fetchMeteoData("abc", "def"); // "Les coordonnées doivent être des nombres"
fetchMeteoData(95, 0); // "La latitude doit être comprise entre -90 et 90"
fetchMeteoDataBySpot("inexistant"); // "Spot 'inexistant' non trouvé"
```

---

## Configuration Spots (config/spots.js)

### 📁 Structure Organisée

```javascript
export const PREDEFINED_SPOTS = {
  brest: {
    lat: 48.3903,
    lon: -4.4863,
    name: "Brest",
    type: "ville",
    region: "Finistère Nord",
    description: "Port militaire et commercial",
  },
  "la-torche": {
    lat: 47.8359,
    lon: -4.3722,
    name: "La Torche",
    type: "surf_spot",
    region: "Finistère Sud",
    description: "Beach break populaire",
    conditions: "Houle W/SW, vent NE/E",
  },
};
```

### 🏷️ Types de Spots

- **ville** : Villes côtières
- **surf_spot** : Spots de surf spécifiques
- **offshore** : Points au large
- **lighthouse** : Phares et repères côtiers

---

## Tests et Validation

### 🧪 Script de Test Mis à Jour

```bash
# Test spot prédéfini
node test-fetchMeteoData.js brest

# Test nouveau spot de surf
node test-fetchMeteoData.js la-torche

# Aide
node test-fetchMeteoData.js --help
```

### ✅ Tests Automatiques

1. **Fonctionnalités de base** : Import spots, coordonnées, cache
2. **Récupération données** : API calls, cache HIT/MISS
3. **Gestion erreurs** : Coordonnées invalides, spots inexistants
4. **Cache management** : Clear, stats, TTL

---

## Migration et Rétrocompatibilité

### 🔄 Backward Compatibility

- **API Route** : `?spot=brest` fonctionne toujours
- **Fonction helper** : `fetchMeteoDataBySpot()` pour anciens codes

### 📋 TODO Migration

- [ ] Migrer les appels existants vers coordonnées
- [ ] Mettre à jour la documentation utilisateur
- [ ] Tests avec spots offshore réels
- [ ] Import config/spots.js (ES modules)

---

## Avantages de la Migration

### 🎯 Flexibilité

- **Spots custom** : N'importe quelle coordonnée GPS
- **Offshore** : Points au large pour données marines
- **Précision** : Coordonnées exactes vs approximations villes

### ⚡ Performance

- **Cache optimal** : Évite doublons coordonnées proches
- **Validation robuste** : Erreurs claires et rapides
- **Structure uniforme** : Même format pour tous les types de spots

### 🌊 Cas d'Usage Surf

- **Spots isolés** : Pointes rocheuses, récifs
- **Bouées météo** : Données offshore précises
- **Itinéraires** : Spots le long d'un trajet côtier
- **Prévisions marine** : Zones de navigation

---

_Migration effectuée le 27 janvier 2025_  
_Version : 0.2.0 - Coordonnées GPS_
