# HourlySlotsSection - Refactorisation complète

## Vue d'ensemble

Refactorisation de la section horaire "Aujourd'hui" pour qu'elle soit directement branchée sur les données de `forecastCore.js` et intégrée avec la sélection des DailyCards.

## Nouveau Composant : HourlySlotsSection

### Emplacement

- `src/components/legacy-ui/HourlySlotsSection.tsx`

### Caractéristiques principales

#### 1. Intégration avec DailyCards

- ✅ Réagit à la sélection de jour dans WeeklySection
- ✅ Titre dynamique :
  - "Aujourd'hui" pour J0
  - "Mercredi 19 Août" pour les autres jours
- ✅ Données mises à jour automatiquement

#### 2. Règles d'affichage des slots

**Périodes affichées :**

- **Aujourd'hui (J0)** : Démarre à l'heure courante, 24h suivantes
- **Autres jours (J1-J6)** : 24h complètes (00h → 23h)
- **Positionnement initial** : 08h pour les autres jours (scroll automatique)

**Contenu de chaque slot :**

- **Heure** : Format "HHh" ou "maint." pour l'heure actuelle
- **Icône météo** : WMO depuis `forecastCore.js` avec variantes jour/nuit
- **Température** : En °C, arrondie
- **Précipitations** : Logique "preceding hour" d'OpenMeteo

#### 3. Logique jour/nuit

**Variantes d'icônes :**

- **Jour** : Entre sunrise et sunset (exclusifs)
- **Nuit** : Avant sunrise ou après sunset (inclusifs)
- **Transition** : Exactement à HH = sunrise ou HH = sunset

**Sources de données :**

- Sunrise/Sunset : Modèle ECMWF depuis `dailyData`
- Calcul : `getDayNightStateAt()` dans `dayNight.ts`
- Icônes : `getWmoFinalIconPath()` dans `wmoFinalIcons.ts`

#### 4. Interface utilisateur

**Layout :**

- ✅ 5 slots visibles simultanément (largeur 85px)
- ✅ Scroll horizontal avec indicateur
- ✅ Coins arrondis (border-radius: 16px)
- ✅ Suppression des boutons "3h"/"1h" et widget activité

**Styles adaptatifs :**

- **Fond clair** : Jour (rgba(255, 255, 255, 0.12))
- **Fond sombre** : Nuit (rgba(0, 0, 0, 0.3))
- **Fond transition** : Gradient jour→nuit
- **Heure actuelle** : Bordure dorée + "maint."

## Intégration technique

### Flux de données

```typescript
test-ui/page.tsx
  ↓ currentLocation: {lat, lon}
WeatherSummary
  ↓ selectedDayIndex, dailyData, currentLocation
HourlySlotsSection
  ↓ fetchFullForecastData(lat, lon)
forecastCore.js → hourlyData[168h]
```

### Props du composant

```typescript
interface HourlySectionProps {
  selectedDayIndex: number; // Index du jour sélectionné (0-6)
  dailyData: DailyWeatherData[]; // Pour sunrise/sunset
  currentLocation: { lat: number; lon: number } | null;
}
```

### Structure des données horaires

```typescript
interface HourlySlot {
  time: string; // ISO string
  hour: string; // "14h" ou "maint."
  temperature: number; // °C arrondi
  precipitation: number; // mm (heure suivante)
  wmo: number; // Code WMO
  variant: "day" | "night" | "transition";
}
```

## Algorithmes clés

### 1. Génération des slots horaires

**Aujourd'hui :**

```javascript
const startIndex = Math.min(currentHour, hourlyData.length - 24);
// Démarre à l'heure courante, 24h suivantes
```

**Autres jours :**

```javascript
const dayStartIndex = dayIndex * 24;
// 24h complètes pour le jour sélectionné
```

### 2. Calcul des précipitations (preceding hour)

```javascript
const nextHourIndex = hourIndex + 1;
const precipitation =
  nextHourIndex < allHourlyData.length
    ? allHourlyData[nextHourIndex]?.precipitation?.mm || 0
    : 0;
```

### 3. Détermination jour/nuit

```javascript
const variant = getDayNightStateAt(date, sunrise, sunset);
// Utilise les données ECMWF sunrise/sunset
```

## Suppressions

**Composants supprimés :**

- ✅ Boutons "3h" et "1h"
- ✅ Section "Durée de mon activité" + slider
- ✅ Timeline de recommandation
- ✅ Placeholder cartes horaires codées en dur

**Conservé :**

- ✅ Bouton "infos" (légende)

## Performance

**Optimisations :**

- Chargement conditionnel (`currentLocation && dailyData`)
- Fallback emoji si icônes WMO indisponibles
- Scroll smooth vers 08h pour nouveaux jours
- Réutilisation des données API entre composants

## Tests requis

### Fonctionnels

- [ ] Sélection jour → mise à jour slots horaires
- [ ] Titre dynamique selon jour sélectionné
- [ ] Heure "maint." pour l'heure actuelle (J0 uniquement)
- [ ] Scroll automatique à 08h (J1-J6)

### Données

- [ ] Précipitations = valeur heure suivante
- [ ] Icônes WMO jour/nuit selon sunrise/sunset
- [ ] Température arrondie correctement
- [ ] 24h de données pour chaque jour

### Interface

- [ ] 5 slots visibles simultanément
- [ ] Scroll horizontal fluide
- [ ] Fallback emoji si image indisponible
- [ ] Styles adaptatifs jour/nuit/transition

## Migration

**Fichiers modifiés :**

- `src/components/legacy-ui/WeatherSummary.tsx` - Remplacement section hourly
- `src/app/test-ui/page.tsx` - Ajout prop `currentLocation`
- `src/components/legacy-ui/index.ts` - Export nouveau composant

**Fichiers créés :**

- `src/components/legacy-ui/HourlySlotsSection.tsx` - Composant principal

**Compatibilité :**

- ✅ Conserve l'API existante de WeatherSummary
- ✅ Rétrocompatible avec les DailyCards
- ✅ Pas d'impact sur NowSection ou WeeklySection

## Prochaines étapes

1. **Tests utilisateur** sur différentes localisations
2. **Validation précipitations** avec données réelles
3. **Optimisation performance** si nécessaire
4. **Accessibility** (aria-labels, navigation clavier)





