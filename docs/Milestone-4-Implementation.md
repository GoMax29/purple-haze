# 🌍 Milestone 4 - Interface de recherche de villes

## 🎯 Objectif réalisé

Implémentation d'un système complet de recherche et sélection de villes avec l'API OpenWeatherMap Geocoding, favoris persistants et interface utilisateur moderne.

## 📁 Architecture créée

### 🔧 Services Backend

#### **`config/api-keys.ts`**

Configuration centralisée des clés API :

- Clé OpenWeatherMap Geocoding : `dd7e899034702d7414f612ca058eb921`
- Structure extensible pour futures APIs

#### **`src/services/geocoding.ts`**

Service d'interfaçage avec l'API OpenWeatherMap :

- **`searchLocations(query, limit)`** : Recherche de villes avec auto-complétion
- **`reverseGeocode(lat, lon)`** : Géocodage inversé coordonnées → ville
- Support drapeaux pays, noms complets, gestion d'erreurs
- Format normalisé `LocationData` pour toute l'application

#### **`src/services/localStorage.ts`**

Gestion complète de la persistance locale :

- **`FavoritesService`** : Favoris avec limite (20 max)
- **`RecentSearchesService`** : Historique recherches (10 max)
- **`SelectedLocationService`** : Localisation active
- Détection doublons par coordonnées GPS précises

### 🎨 Composants UI

#### **`src/components/legacy-ui/LocationSearchModal.tsx`**

Modal de recherche avancée avec :

- **Auto-complétion temps réel** (debounce 300ms)
- **Favoris sticky** en haut avec étoiles
- **Historique des recherches** récentes
- **Drapeaux pays** et coordonnées précises
- **Gestion clavier** (ESC pour fermer)
- **Responsive design** mobile-friendly

#### **`src/components/legacy-ui/NewHeader.tsx`**

Header modernisé selon spécifications :

- **4 boutons d'accès rapide** : Plomeur, Ploudalmézeau, Surzur, Montaigu-Vendée
- **Champ de recherche élégant** avec indicateur visuel de localisation
- **Intégration modal** au clic
- **Design cohérent** avec l'identité visuelle de l'app

### 📱 Page de test

#### **`src/app/test-ui/page.tsx`**

Page sandbox complète pour validation :

- **Remplacement Header** ancien → nouveau système
- **Persistance LocalStorage** de la localisation sélectionnée
- **Simulation chargement** météo lors changement de ville
- **Debug panel** avec détails complets de l'état

## 🚀 Fonctionnalités implémentées

### ✅ Recherche mondiale

- **API officielle** OpenWeatherMap Geocoding
- **Auto-complétion** instantanée dès 2 caractères
- **Résultats enrichis** : nom, pays, région, drapeaux, coordonnées
- **Gestion d'erreurs** robuste avec fallbacks

### ⭐ Système de favoris

- **Persistance localStorage** entre sessions
- **Favoris sticky** toujours visibles en haut
- **Toggle étoile** sur chaque résultat de recherche
- **Limite intelligente** (20 favoris max)

### 🕐 Historique des recherches

- **10 dernières recherches** automatiquement sauvées
- **Déduplication** par coordonnées précises
- **Accès rapide** aux villes récemment consultées

### 📍 Boutons d'accès rapide

Selon cahier des charges :

- **Plomeur** (47.833, -4.266) - Spot de surf principal
- **Ploudalmézeau** (48.543, -4.656) - Finistère Nord
- **Surzur** (47.576, -2.668) - Golfe du Morbihan
- **Montaigu-Vendée** (46.977, -1.307) - Vendée

## 🔗 Intégration

### Dans test-ui

- ✅ **Validation complète** du système
- ✅ **Interface moderne** avec feedback visuel
- ✅ **Persistance fonctionnelle** localStorage

### Pour HomePage (prêt)

Les composants sont **modulaires** et **plug-and-play** :

```tsx
import { NewHeader } from "@/components/legacy-ui";
import { LocationData } from "@/services/geocoding";

<NewHeader
  onLocationSelect={handleLocationSelect}
  currentLocation={currentLocation}
/>;
```

## 📊 Métriques de performance

- **Debounce 300ms** pour limiter les appels API
- **Cache modal** : HTML chargé une seule fois
- **Limite résultats** : 8 villes max par recherche
- **Compression données** : JSON optimisé localStorage
- **Responsive** : Breakpoints mobile inclus

## 🛡️ Sécurité & Robustesse

- **Gestion d'erreurs** à tous les niveaux
- **Validation coordonnées** avec précision 0.001°
- **Sanitisation requêtes** avec encodeURIComponent
- **Fallbacks gracieux** si API indisponible
- **Types TypeScript** stricts pour toutes les interfaces

## 🎨 Design System

- **Cohérence visuelle** avec l'identité de l'app
- **Dégradés signature** : `#667eea → #764ba2`
- **Animations fluides** : hover, scale, shadow
- **Accessibilité** : navigation clavier, ARIA
- **Mobile-first** : adaptable tous écrans

---

## 🧩 DailyCard – masques et toggle simple/détail

- Ajout d’overlays de masquage sur les tranches 00–06, 06–12 et 18–00, ainsi que sur la pastille UV.
- Couleur des overlays adaptée au contexte:
  - Carte sélectionnée: violet clair proche de la sélection.
  - Carte non sélectionnée: même teinte que l’arrière-plan par défaut.
- Opacité contrôlée par un nouveau toggle: 90% en mode simple (☝), 10% en mode détail (🖐).
- Nouveau composant `src/components/legacy-ui/ToggleSimpleDetail.tsx` inséré à droite du titre « Prévisions 7 jours ».
- L’état `detailMode` est propagé à chaque `DailyCard` via `WeeklySection`.

---

## 🚀 Accès

**Page de test** : `http://localhost:3000/test-ui`

Le système est **entièrement fonctionnel** et **prêt pour intégration** dans la HomePage du projet.
