# 🧩 Composants Legacy UI

Cette bibliothèque contient tous les composants UI extraits de l'ancienne application météo HTML/CSS/JS, transformés en composants React fonctionnels avec TailwindCSS.

## 📋 Composants disponibles

### Composants principaux

- **`Header`** - Titre de l'app + bouton Actualiser avec état de chargement
- **`CitiesButtons`** - Sélecteur de villes prédéfinies (Bretagne) avec version mobile
- **`WeatherSummary`** - Conteneur principal qui combine toutes les sections météo
- **`NowSection`** - Conditions météo actuelles avec détails complets
- **`HourlySection`** - Timeline horaire avec widget activité et précipitations
- **`WeeklySection`** - Liste des 7 prochains jours avec statistiques

### Sous-composants

- **`HourlyCard`** - Carte individuelle pour affichage horaire
- **`DailyCard`** - Carte individuelle pour affichage journalier
- **`ActivityWidget`** - Sélecteur de durée d'activité (2h/3h/4h/6h)
- **`PrecipitationBar`** - Graphique interactif des précipitations

## 🎨 Design System

- **Palette** : Dégradés violet/bleu, fond transparent avec `backdrop-blur`
- **Responsive** : Mobile-first avec breakpoints TailwindCSS
- **Interactions** : Hover, focus, transitions fluides
- **Accessibilité** : Attributs ARIA, navigation clavier

## 🚀 Utilisation

```tsx
import {
  Header,
  CitiesButtons,
  WeatherSummary,
  type WeatherDetails,
  type HourlyData,
  type DailyData,
} from "@/components/legacy-ui";

// Exemple d'utilisation complète
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header onRefresh={() => {}} />
      <CitiesButtons onCitySelect={(city) => {}} />
      <WeatherSummary
        locationName="Brest"
        currentTemperature={15}
        // ... autres props
      />
    </div>
  );
}
```

## 🧪 Test

Pour tester tous les composants avec des données statiques :

```
http://localhost:3000/test-ui
```

## ✅ État du Milestone 1

- [x] **Extraction UI complète** - Tous les éléments de l'ancienne app transformés
- [x] **Composants fonctionnels** - Props statiques, responsive, accessible
- [x] **Architecture propre** - Types TypeScript, exports centralisés
- [x] **Tests validés** - Page de démonstration fonctionnelle

## 🔄 Prochaines étapes

- **Milestone 2** : Définition du format JSON config cible
- **Milestone 3** : Module central de traitement météo
- **Milestone 4** : Connexion dynamique des données
