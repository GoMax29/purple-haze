# 🧩 Migration vers la nouvelle web-app modulaire météo/surf

---

## 🎯 Objectif global

Recréer une web-app météo/surf modulaire, maintenable, en Next.js/React, en séparant les couches UI / données / algorithmes, avec un système de configuration externe.

---

## 🔵 Milestone 1 : Extraction de l'UI (ancienne app) ✅ 100% TERMINÉ

**But** : Extraire tous les composants graphiques visibles (bandeau horaire, courbes, sliders, météo jour/semaine, etc.) depuis l'ancienne app HTML/CSS/JS.

- [x] Ajouter le fichier `index.html` dans `/first-app/`✅
- [x] Demander à l'IA un résumé de la structure HTML/JS de l'ancienne app (DOM + JS)✅
      ├── Analysis-index-html.md ← Résumé structure, éléments UI, paramètres visibles
- [x] Identifier les éléments UI à extraire (météo actuelle, bandeau horaire, probas, températures, icônes, sliders, etc.)✅
- [x] Transformer chaque UI en composants React fonctionnels Tailwind (sans logique métier)✅
- [x] Grouper dans `/components/legacy-ui/`✅
      ├── Header.tsx ← Inputs lat/lon + bouton Actualiser ✅
      ├── CitiesButtons.tsx ← Sélecteur de villes Bretagne ✅
      ├── WeatherSummary.tsx ← Panneau principal (conteneur violet) ✅
      ├── NowSection.tsx ← Conditions actuelles (grille 3x2) ✅
      ├── DayHeader.tsx ← Contrôles 3h/1h + bouton infos ✅
      ├── HourlyCard.tsx ← Cartes individuelles horaires ✅
      ├── HourlyScroll.tsx ← Timeline horaire scrollable ✅
      ├── WeatherActivityWidget.tsx ← Timeline 24h + durée + recommandation ✅
      ├── DailyCard.tsx ← Cartes individuelles journalières ✅
      ├── WeeklySection.tsx ← Liste 7 jours ✅
      ├── DayLegend.tsx ← Légende toggleable éléments météo ✅
      ├── WeatherLegend.tsx ← Tooltip émojis pluie & conseils ✅
      ├── PrecipitationBar.tsx ← Barre précipitations interactive ✅
      ├── types.ts ← Types TypeScript partagés ✅
      └── index.ts ← Exports centralisés ✅
- [x] Page de test créée : `/test-ui` avec props statiques✅
- [x] **CORRECTION** : Migration structure vers App Router Next.js 13+✅
      ├── Configuration `tsconfig.json` avec alias `@/*`
      ├── Migration `/pages` → `/src/app`
      ├── Resolution erreur "Module not found: @/components/legacy-ui"
      └── Structure conforme aux rules Cursor

**🎉 RÉSULTAT EXCEPTIONNEL :** 14 composants créés (au lieu des 11 prévus) !

### 📊 **Détails des composants créés** :

**Composants principaux (11)** : Header, CitiesButtons, WeatherSummary, NowSection, DayHeader, HourlyCard, HourlyScroll, WeatherActivityWidget, DailyCard, WeeklySection, types.ts

**Composants bonus (3)** : DayLegend, WeatherLegend, PrecipitationBar

### 🎨 **Fidélité visuelle** :

- Dégradés exacts : `#667eea → #764ba2` (fond), `#1a1f3a → #2d1b69 → #3b0764` (panneau)
- Typographie Segoe UI identique à l'original
- Couleurs UV/AQI authentiques avec cercles colorés
- Timeline 24h avec segments météo et sélecteur glissant 🎯
- Animations complètes : hover, scale, translateY, box-shadow
- Responsive design complet

### 📋 **Architecture technique** :

- 100% props-driven - Aucune donnée hardcodée
- TypeScript interfaces complètes pour tous les composants
- Données de test réalistes dans `test-ui`
- Interactivité complète (sélection ville, heure, jour, durée)

✅ Critère de succès : Tous les composants de l'ancienne UI sont utilisables en React avec des props statiques.

**🚀 Accès :** `http://localhost:3000/test-ui`

---

🟠 Milestone 2 — Traitement météo paramètre par paramètre (logique métier complète et testable) 🚧 EN COURS

🎯 Objectif général :
Créer, pour chaque paramètre météo horaire, un module de traitement autonome capable de :

Lire les données issues des API (via fetchMeteoData(lat, lon))

Charger sa configuration dédiée (config/<param>.json)

Appliquer un algorithme défini (algos/\*.js ou algo local)

Retourner un tableau normalisé prêt pour affichage dans l'UI

---

📱 **Interface Test Moderne** — Page vitrine en JavaScript pur ✅ IMPLÉMENTÉE + 🔗 INTÉGRÉE NEXT.JS

🎯 **Objectif :** Remplacer l'ancienne page `/test-param` React par une interface moderne en HTML/CSS/JavaScript pur, servant de vitrine pédagogique pour les algorithmes météo.

### 🚀 **IMPLÉMENTATION RÉALISÉE** :

#### 📁 **Architecture JavaScript Vanilla intégrée à Next.js** :

```
/src/app/test-algo/
└── page.tsx                # ✅ Wrapper React pour intégration Next.js

/public/test-algo/          # ✅ Fichiers statiques vanilla JS
├── style.css               # ✅ Design moderne + thèmes par onglet
├── app.js                  # ✅ Router dynamique + chargement modules
└── modules/                # ✅ Contenu HTML fragmenté par paramètre
    ├── temp.html           # ✅ Module température (graphique + tableau)
    ├── apparent.html       # ✅ Module température apparente
    ├── humidite.html       # ✅ Module humidité (avec jauge de confort)
    ├── wmo.html           # ✅ Module WMO (matrice + méthodologie)
    └── methodo.html       # ✅ Documentation complète des algorithmes
```

#### 🎨 **Design System Moderne** :

- ✅ **Thèmes par onglet** : Orange (temp), Amber (apparent), Bleu (humidité), Violet (WMO), Cyan (méthodo)
- ✅ **Navigation sticky** avec indicateur animé et transitions fluides
- ✅ **Cartes ombrées** avec `border-radius: 16px` et `box-shadow` moderne
- ✅ **Typographie Inter** avec fallback `sans-serif`
- ✅ **Responsive design** desktop-first avec breakpoints mobiles
- ✅ **Système d'alertes** colorées (danger/warning/info)
- ✅ **Animations CSS** : fade-in, hover, pulse, bounce

#### 📊 **Modules Spécialisés** :

- ✅ **Température** : Graphique Chart.js + tableau horizontal + exemple calcul gaussien
- ✅ **Apparent** : Comparaison T° réelle vs ressentie + différentiel visuel
- ✅ **Humidité** : Jauge de confort (0-100%) + sigma adaptatif + zones de confort
- ✅ **WMO** : Matrice 13 modèles × 24h + exemples méthodologie + hiérarchie sévérité
- 🆕 **Précipitations** : Config `config/precipitation.json`, algos `shared/precipitation_mm.algorithms.js` + `shared/precipitation_%.algorithms.js`, traitement `traitement/precipitations.js` (branche API à faire)
- ✅ **Méthodologie** : Documentation complète des 3 algorithmes + modèles intégrés

#### 🔧 **Intégration API Backend** :

- ✅ **Endpoints configurés** : `/api/test-param/temperature`, `/api/test-param/apparent-temperature`, `/api/test-param/humidite`, `/api/test-param/wmo`
- ✅ **Convention fetch** : `fetchAndRender<X>()` + `render<X>()` par module
- ✅ **Coordonnées Plomeur** : 47.8322°N, -4.2967°W (configurables)
- ✅ **Gestion erreurs** : Spinners, messages d'erreur, timeouts
- ✅ **Chart.js v4** intégré via CDN pour graphiques interactifs

#### 📋 **Fonctionnalités Avancées** :

- ✅ **Cache modules** : Chargement HTML une seule fois, réutilisation
- ✅ **Thèmes dynamiques** : Variables CSS `--accent` changées par JavaScript
- ✅ **Accessibilité** : `aria-selected`, `role="tablist"`, navigation clavier
- ✅ **Performance** : Chargement asynchrone, animations 60fps, optimisation mobile

🚀 **Accès :** `http://localhost:3000/test-algo` ✅ **INTÉGRÉ NEXT.JS**

### 🔄 **Stratégie pour nouveaux paramètres (Milestone 2 suite)** :

Pour chaque nouveau module de traitement créé (`traitement/<param>.js`), un onglet correspondant sera automatiquement ajouté :

1. **Backend** : Créer `/api/test-param/<param>` qui utilise `traitement/<param>.js`
2. **Frontend** : Ajouter `modules/<param>.html` avec visualisations spécifiques
3. **Configuration** : Mettre à jour `app.js` avec le nouvel endpoint et thème
4. **Design** : Choisir palette couleur + icône représentative du paramètre
5. **Intégration** : Bouton d'onglet dans `index.html` + fonction `init<Param>Module()`

#### 📝 **Template pour nouveau paramètre** :

```javascript
// Dans app.js
async function init<Param>Module() {
    try {
        await fetchAndRender<Param>();
    } catch (error) {
        console.error('Erreur module <param>:', error);
        showModuleError('<param>', error.message);
    }
}

async function fetchAndRender<Param>() {
    const url = `/api/test-param/<param>?lat=${CONFIG.coords.lat}&lon=${CONFIG.coords.lon}`;
    const response = await fetch(url);
    const result = await response.json();
    render<Param>Data(result.data);
}
```

Cette architecture permet une **extensibilité parfaite** : chaque nouveau paramètre météo implémenté en backend génère automatiquement sa visualisation frontend correspondante.

## 🔒 **Consignes de modification - Page /test-algo**

### ⚠️ **RÈGLES CRITIQUES DE DÉVELOPPEMENT**

La page `/test-algo` utilise une **architecture hybride** qui sépare entièrement les couches métier et framework :

#### 🚫 **NE JAMAIS MODIFIER** : `/src/app/test-algo/page.tsx`

- Ce fichier React agit **uniquement comme passerelle Next.js**
- Il encapsule les fichiers vanilla JS sans logique métier
- Permet l'accès sécurisé aux API `/api/*` sans CORS
- **Modification autorisée SEULEMENT** en cas de changement architectural fondamental

#### ✅ **TOUJOURS MODIFIER** : Fichiers vanilla JS dans `/public/test-algo/`

```
/public/test-algo/
├── app.js              ← 🎯 Logique principale, navigation, API calls
├── style.css           ← 🎨 Styles, thèmes, animations
├── modules/            ← 📱 Logique spécifique par onglet
│   ├── temp.html       ← 🌡️ Module température
│   ├── wmo.html        ← ⛅ Module codes WMO
│   └── ...
```

#### 🎯 **Objectifs de cette séparation** :

1. **Liberté totale** : Design moderne sans contraintes React
2. **Extensibilité** : Ajout d'onglets sans refactoring
3. **Performance** : JavaScript natif optimisé
4. **Maintenance** : Séparation claire des responsabilités

#### 📋 **Workflow de développement** :

- **Nouveaux onglets** → Modifier `app.js` + créer `modules/<param>.html`
- **Changements visuels** → Modifier `style.css`
- **Nouvelles fonctionnalités** → Modifier `app.js` ou modules spécifiques
- **Debug/optimisation** → Console dans `app.js`, jamais dans page.tsx

### 🛡️ **Protection du wrapper React** :

Le fichier `/src/app/test-algo/page.tsx` contient un avertissement en en-tête :

```typescript
// 🚫 Ne pas modifier ce fichier sauf cas très spécifique
// Ce wrapper React sert uniquement à encapsuler la page HTML/JS de test
// Toute modification fonctionnelle ou visuelle doit se faire dans /public/test-algo/
```

---

### 🎉 PARAMÈTRES IMPLÉMENTÉS ✅

#### 🌡️ Module Température (`temperature.js`)

- **Configuration**: `config/temperature.json`
- **API Parameter**: `temperature_2m`
- **Algorithme**: Gaussienne classique (σ=1.5, centre=médiane)
- **Unité**: °C
- **Interface test**: `/test-param` → Onglet "Température"

#### 🌡️ Module Température Apparente (`temperature_apparente.js`)

- **Configuration**: `config/temperature_apparente.json`
- **API Parameter**: `apparent_temperature`
- **Algorithme**: Gaussienne classique (σ=1.5, centre=médiane)
- **Unité**: °C
- **Interface test**: `/test-param` → Onglet "Température Apparente"

#### 💧 Module Humidité Relative (`humidite.js`)

- **Configuration**: `config/humidite.json`
- **API Parameter**: `relative_humidity_2m`
- **Algorithme**: **Gaussienne adaptative** (sigmaMultiplier=2.0)
- **Unité**: %
- **Interface test**: `/test-param` → Onglet "Humidité"
- **Modèles configurés**: 9 modèles (MF AROME, ICON EU, KNMI, UKMO, ECMWF, GFS)
- **Particularité**: Sigma auto-calculé selon la dispersion des données

#### 🌤️ Module Code WMO (`wmo.js`)

- **Configuration**: `config/wmo.json`
- **API Parameter**: `weather_code`
- **Algorithme**: **Groupes de sévérité avec seuil dynamique**
- **Unité**: code
- **Interface test**: `/test-param` → Onglet "Code WMO"
- **Modèles configurés**: 11 modèles (tous modèles disponibles)
- **Particularité**: Algorithme hiérarchique avec 9 groupes de sévérité (0-8)
- **Alertes**: Calcul automatique des risques orage/grêle/verglas/brouillard (0-5)

**Paramètres créés (5/11 prévus):**

- [x] Température (`temperature`) ✅
- [x] Température apparente (`temperature_apparente`) ✅
- [x] Humidité relative (`humidite`) ✅ **[Gaussienne adaptative]**
- [x] Code WMO (`wmo`) ✅ **[NOUVEAU - Groupes de sévérité]**
- [x] Précipitations mm + PoP simplifiée (branche API à réaliser)
- [x] Vent (force, direction, rafales) ✅ Implémenté: `config/wind.json`, `shared/wind_direction.algorithms.js`, `traitement/wind.js`
- [ ] UV
- [ ] Qualité de l'air
- [ ] Houle (hauteur, période)

📦 Paramètres concernés (horaire uniquement)

API 1 : température, T° apparente, humidité, code WMO, précip mm, précip proba, vent (force, direction, rafales)
API 2 : UV, Qualité de l’air
API 3 : Houle (hauteur, période)

🧩 Structure attendue par paramètre
Pour chaque paramètre météo horaire (ex. température) :

1. /config/temperature.json
   Contient :

la liste des modèles à utiliser

les échéances utiles

les pondération des modèles

le nom de l’algo à appliquer

les paramètres de l’algo (exemple sigma, coeeficient et.)

exemple ! (ne pas copier/coller betement cet exemple ! prendre en compte les screenshot/fichier json passée pour vrai donnée)
{
"parametre": "temperature",
"algo": "gaussian",
"unite": "°C",
"output": "hourly_array",
"params": {
"sigma": 1.5, //appliquer un écart-type de 1.5 ici.
"center": "median" // (centrer les valeur sur la médiane)
},
"models": {
"arome": {
"echeances": [0, MAX], // Max signifie toute la plage horaire disponble (tant que valeur != null)
"poids": 0.4
},
"arpege": {
"echeances": [6, 96],
"poids": 0.35
},
"gfs": {
"echeances": [3, 168],
"poids": 0.25
}
}
}

2.  /traitement/temperature.js
    Module principal du paramètre. Fonction :

async function traiterTemperature(lat, lon): Promise<Array<{ datetime, value }>>
Il fait :

appel à fetchMeteoData(lat, lon)

lecture du fichier config/temperature.json

extraction des données utiles depuis la réponse API

application de l’algo (import depuis /algos/)

retour d’un tableau de valeurs horodatées

🛠️ Fourniture des configs initiales
Tu fourniras à l’IA :

soit une capture d’écran du dashboard actuel

soit un fichier texte/JSON
contenant les instructions de base pour chaque paramètre (modèles, algo, échéances...)

💡 L’IA devra générer à partir de cela :

le fichier config/\*.json

un traitement de base dans traitement/\*.js

un appel à un algo existant ou maison si besoin

🔄 Itération (paramètre par paramètre)
Pour chaque nouveau paramètre météo :

Générer config/<param>.json (à partir de ta capture ou description)

Générer traitement/<param>.js

Générer ou réutiliser l’algo (/algos/\*.js)

Vérifier que l'output respecte le format :

[
{ datetime: "2025-07-30T00:00", value: 22.3 },
{ datetime: "2025-07-30T01:00", value: 22.1 },
...
]
💡 Ces traitements peuvent être testés indépendamment,via une page de test React qui implémente au fur et à mesure les parametres une fois crée et prend en input des parametre gps (ou ville préselctionnée.

### 🚀 **IMPLÉMENTATION RÉALISÉE** :

#### 📁 **Structure créée** :

```
traitement/
├── temperature.js              # ✅ Module température
└── temperature_apparente.js    # ✅ Module température apparente

config/
├── temperature.json            # ✅ Configuration température
├── temperature_apparente.json  # ✅ Configuration température apparente
└── README.md                   # ✅ Documentation configurations
```

#### 🧮 **Algorithme Gaussien** :

- ✅ Utilisation de `shared/gaussian_weighted.js` existant
- ✅ Pondération gaussienne centrée sur médiane
- ✅ Paramètre σ = 1.5 (configurable)
- ✅ Gestion fallback vers moyenne simple

#### 📊 **Configuration Modèles** :

- ✅ 10 modèles météo configurés selon screenshot fourni
- ✅ Échéances spécifiques par modèle (0h-167h)
- ✅ Poids unitaires (1.0) pour tous les modèles
- ✅ Système enable/disable par modèle

#### 🧪 **Page de Test Interactive** :

- ✅ Interface `/test-meteo` créée
- ✅ Support spots prédéfinis Bretagne + coordonnées personnalisées
- ✅ Affichage statistiques et temps de traitement
- ✅ API `/api/test-meteo` pour traitement back-end
- ✅ Extensible pour futurs paramètres

#### 📋 **Format de Sortie Standardisé** :

```javascript
[
  { datetime: "2025-01-30T00:00", value: 22.3 },
  { datetime: "2025-01-30T01:00", value: 22.1 },
  // ... jusqu'à 168 heures
];
```

#### 📚 **Documentation** :

- ✅ `config/README.md` : Guide des configurations
- ✅ `docs/Documentation.md` : Système de traitement complet
- ✅ Instructions d'ajout de nouveaux paramètres

✅ Critère de succès :
Chaque paramètre météo horaire peut être traité de façon autonome

Le traitement repose uniquement sur :

fetchMeteoData(lat, lon)

config/\*.json

algos/\*.js (si besoin)

La sortie est cohérente, normalisée et injectée facilement dans l’UI

## Aucun duplicata de logique dans un coreProcessor intermédiaire


Milestone 3 — Core orchestrateur météo
Créer src/core/forecastCore.js exportant une fonction buildForecastFromHourly(hourly, dailyExtras) qui retourne :

A) Données horaires : pour chaque heure → température, température apparente, humidité, UV (direct API), qualité de l’air (direct API), précipitations mm, indice de confiance précipitations, probabilité, IQR, vent (force, direction, rafales), code WMO.

B) Données journalières : pour chaque jour → températures min/max, UV max, précipitations totales, codes WMO agrégés par tranche horaire (00-06, 06-12, 12-18, 18-00) calculés via barycenterThreeGroups de shared/wmo.algorithms.js.
Le code doit utiliser des sous-fonctions internes spécialisées (pattern private helper functions) pour regrouper, agréger et formater, afin d’être facilement extensible (ex. ajout ultérieur de houle, température de l’eau, période de houle pour module "surf").
Exemple d’appel :

import { buildForecastFromHourly } from './core/forecastCore.js';
const { hourlyData, dailyData } = buildForecastFromHourly(hourly, dailyExtras);
console.log(dailyData[0].wmo.byTranche['06-12']); // code WMO tranche matin

Statut: DONE
Notes:

- Implémenté `src/core/forecastCore.js` avec agrégations horaires (température, humidité, vent, précipitations mm/CI/IQR/PoP, UV, AQI) et WMO par heure.
- Ajout des agrégations journalières (min/max T, UV max, total précip) et WMO par tranches (00-06, 06-12, 12-18, 18-00) via barycentre.
- Documentation mise à jour dans `docs/Documentation.md` + index `docs/index.json`.

🟣 Milestone 4 — Liaison dynamique des composants UI React (partie “horaire”)
🎯 Objectif :
Connecter les composants météo du front à la sortie du mainCoreProcessor, avec les vrais traitements dynamiques, et vérifier que tout fonctionne sur 168h.

✅ Étapes :
Injecter les données dans les composants React (Zustand, props, etc.)

Remplacer les données hardcodées ou mockées

S'assurer du bon fonctionnement :

des bandeau jours
du bandeau horaire
des slot horaire
de la cohérence parametre "instant" et "preceding hour"
de l'affichage par tranche horaire des code wmo
de la bascule mode simple/mode détaillé
de la bascule emoji WMO / emoji de recommandation



des tooltips, transitions, etc.

✅ Critère de succès :
L’UI fonctionne dynamiquement, à partir des vrais traitements météo. Le comportement est cohérent sur toutes les heures et tous les paramètres.

🟤 Milestone 5 — Dashboard de configuration → génération des config/\*.json
🎯 Objectif :
Reprendre et moderniser le dashboard legacy pour en faire un générateur d’options de configuration (config/<param>.json).

✅ Étapes :
Identifier les correspondances entre chaque champ UI du dashboard et les options des fichiers config/\*.json

Reprendre le code UI du dashboard dans /pages/dashboard (ou séparé)

Ajouter une fonction d’export JSON propre et conforme

Ajouter une fonction de rechargement JSON pour édition/modification

✅ Critère de succès :
Le dashboard permet de générer automatiquement les fichiers de config utilisés par le système de traitement, sans retouches manuelles.

⚪ Milestone 6 — Traitement de la partie quotidienne
🎯 Objectif :
Gérer les données du bloc "Quotidien" (résumé des 7 jours) avec deux options possibles.

✅ Étapes :
Option A : Utiliser la réponse API quotidienne spécifique

Option B : Extrapoler à partir des données horaires (via un module traitement/quotidien.js)

Ajouter un paramètre dans config/quotidien.json pour choisir la source

json
Copier
Modifier
{
"source": "extrapolation",
"extrapolation": {
"temperature_max": "max_6h_18h",
"wmo": "mode",
"precip": "somme_journalière"
}
}
✅ Critère de succès :
Le bloc quotidien affiche des données cohérentes, issues soit de l’API directe, soit d’un traitement dérivé des données horaires.

📘 Fichiers à maintenir à jour en parallèle
/docs/Documentation.md
Pour documenter :

les formats de réponse

les paramètres possibles

les algorithmes supportés

les structures de sortie

/config/README.md
Pour expliquer comment sont structurés les fichiers \*.json (paramètre, algo, pondérations, etc.)
