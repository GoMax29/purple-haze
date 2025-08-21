# Spécification d’Implémentation – Refonte de la page « Test Météo » en **HTML / CSS moderne / JavaScript pur**

## 1. Objectif

Créer une page vitrine responsive (desktop-first) présentant et testant différents algorithmes météo (Température, Température apparente, Humidité, Codes WMO, Méthodologie…) sans dépendance à un framework front-end. Le rendu doit être moderne, clair, coloré et servir d’outil d’explication pédagogique.

## 2. Architecture de fichiers à livrer

```
/public
  └─ icons/wmo/*.svg           # icônes animées WMO
/src/test-algo/

  ├─ index.html                # page principale + barre d’onglets
  ├─ style.css                 # styles globaux + thèmes onglets
  ├─ app.js                    # router d’onglets + loader dynamique
  ├─ algos.js                  # implémentations JS des algorithmes (voir §4)
  ├─ modules/                  # contenu HTML fragmenté chargé à la volée
  │   ├─ temp.html
  │   ├─ apparent_temp.html
  │   ├─ humidite.html
  │   ├─ wmo.html
  │   └─ methodo.html
  └─ assets/ ...               # polices (Inter, Roboto…), illustrations, etc.
```

Chaque fichier `*.html` de `modules/` contient uniquement le **markup** spécifique de l’onglet (cartes, tableaux, graphiques). Le script `app.js` charge ces fragments via `fetch` et les injecte dans `<div id="content">` en gérant :

- l’état `active` de la barre d’onglets (couleurs / underline animée);
- une animation légère `fade-in` lors du changement de vue;
- la (re-)initialisation éventuelle des graphiques (Chart.js) ou widgets.

## 3. Design & UX (guidelines)

1. Fond général dégradé gris très clair → blanc (`#f8fafc` → `#ffffff`).
2. **Palette par onglet** (exemple) :
   • Température : orange léger `#ffedd5` ; accent `#f97316`.
   • Apparent : amber / orange.
   • Humidité : bleu `#dbeafe` ; accent `#3b82f6`.
   • WMO : violet `#ede9fe` ; accent `#8b5cf6`.
3. Composants :
   • Cartes/panneaux avec `border-radius: 16px`, `box-shadow: 0 4px 20px rgba(0,0,0,.06)`.
   • Tableaux horizontaux : th collants, survol avec `background:rgba(0,0,0,.04)`.
   • Badges (pills) de valeurs ou codes couleur-codés.
4. Typographie : charger `Inter` (fallback `sans-serif`).
5. Transitions : `transition: all .25s ease` sur cartes & boutons.
6. Système d’alertes météo :
   • wrapper `<aside class="alert alert--danger|warning|info">…`.
   • Couleurs : rouge / orange / bleu ; icône ⚠️ animée.

## 4. Chargement des données (aucune logique métier côté client)

Le client n’effectue **aucun recalcul** : toutes les valeurs agrégées proviennent des endpoints backend listés au §5.
Pour chaque onglet, on suit la convention suivante :

1. `fetchAndRender<X>()` (ex. `fetchAndRenderTemperature`)
   • Construit l’URL avec `lat` & `lon` (Plomeur : 47.8322 / -4.2967).
   • `await fetch(url)` → `json`.
   • Appelle `render<X>(json.data, json.debug)`.

2. `render<X>()`
   • Met à jour les **cartes** (valeur agrégée, unités, badges).
   • Construit/rafraîchit le **graphique Chart.js** si pertinent.
   • Remplit le **tableau** des données intermédiaires (valeurs modèles, poids, seuil dynamique…).
   • Affiche les encarts pédagogiques (méthodo, alertes, etc.).

Helpers génériques :

```js
function formatHour(dateStr) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours()}h`;
}
function injectSpinner(target) {
  /* ... */
}
function clearContainer(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
```

Aucun calcul statistique ni algorithmique côté client. Les champs `debug` retournés par l’API (ex. `median`, `weights`, `risque`, `dynamicThreshold`, etc.) sont directement affichés.

(models, sigma = 1.5) {
// models: Array<{name, value, enabled:boolean}>
const values = models.filter((m) => m.enabled).map((m) => m.value);
const median = getMedian(values);
const weights = values.map((v) =>
Math.exp(-Math.pow(v - median, 2) / (2 _ sigma \*\* 2))
);
const sumW = weights.reduce((a, b) => a + b, 0);
const result = values.reduce((acc, v, i) => acc + v _ weights[i], 0) / sumW;
return { median, weights, result };
}

````

_Evenement IEL_: dans le projet actuel, `σ = 1.5` et les poids exemples `[0.325, 0.35, 0.325]` correspondent à cette formule.



### 4.3. Humidité (gaussienne **adaptative**)

```js
function adaptiveGaussianHumidity(models, multiplier = 2.0) {
  const values = models.filter((m) => m.enabled).map((m) => m.value);
  const std = getStdDev(values);
  const sigma = std * multiplier; // σ évolue avec la dispersion
  return gaussianTemperature(models, sigma); // réutilise la logique ci-dessus
}
````

Exemple actuel : `sigma ≈ 3.2` → dérivé d’un `std ≈ 1.6` avec `multiplier = 2`.

### 4.4. Agrégation des codes météo WMO (algorithme de groupes de sévérité)

1. **Mapping** `code → severité` selon le tableau suivant (extrait de `src/utils/wmoIconMapping.js`) :
   - 0 – ciel clair → 0 ; 1-3 → 1 ; 45-48 → 2 ; 51-55, 61-65 → 3 ; 56-57, 66-67 → 4 ; 80-82 → 5 ; 71-77, 85-86 → 6 ; 95 → 7 ; 96-99 → 8.
2. Pour un pas de temps donné on reçoit `rawCodes` (13 modèles actifs).
3. Étapes :
   a. **Regroupement** : compter les codes par `severityGroup`.
   b. `nbGroups = nombre de groupes distincts`.
   c. `threshold = 80 / nbGroups` (en %).
   d. **Tri décroissant** des groupes par sévérité puis par occurrence.
   e. Parcourir la liste :
   • Si `(occurrence / totalModels) * 100 ≥ threshold` **→ groupe retenu**;
   • Sinon, continuer ; si aucun groupe ne satisfait, retenir le **groupe max sévérité**.
   f. Le **code WMO final** = médiane des codes du groupe retenu.
4. **Indices de risque** : incréments
   - Orage : présence de codes 95, 96, 99 → +1 par occurrence (max 5).
   - Grêle : codes 96, 99.
   - Verglas : groupe 4.
   - Brouillard : groupe 2.
5. Retour : `{value, risque:{orage,grele,verglas,brouillard}, debug:{groupCounts, selectedGroup, dynamicThreshold, totalModels, sortedGroups}}`.

### 4.5. Helpers

```js
function getMedian(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 !== 0 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function getStdDev(arr) {
  const mean = arr.reduce((a, b) => a + b) / arr.length;
  return Math.sqrt(
    arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length
  );
}
```

## 5. Flux de données & intégration JS

1. **API existantes** (backend) :
   | Endpoint | Description |
   |----------------------------------------|-------------------------------------------|
   | `/api/test-param/temperature` | Agrégation température (gaussien) |
   | `/api/test-param/apparent-temperature` | Température ressentie |
   | `/api/test-param/humidite` | Humidité relative (gaussien adaptatif) |
   | `/api/test-param/wmo` | Codes météo agrégés + debug |
   <br>Paramètres : `lat`, `lon` (float).
2. **Loader** (dans chaque module) :
   ```js
   const url = `/api/test-param/temperature?lat=${LAT}&lon=${LON}`;
   fetch(url)
     .then((r) => r.json())
     .then(renderTemperature);
   ```
3. **Rendu** : utiliser Chart.js (via CDN) pour graphiques ; générer tableaux DOM via JS (pas de React).

## 6. Étapes de développement recommandées (roadmap IA)

1. **Bootstrap projet** : créer structure ci-dessus, copier polices & icônes.
2. **index.html** :
   - barra d’onglets `<nav>` sticky en haut ;
   - `<div id="content">` placeholder ;
   - theme CSS root vars — exemple `--accent: #f97316` changés dynamiquement.
3. **app.js** :
   - écouter clic onglet → `loadModule('temp')` ;
   - `fetch('/modules/temp.html').then(text => content.innerHTML=text);` ;
   - injecter `<script>` spécifiques si besoin (`Chart.register…`).
4. Implémenter `algos.js` (voir §4) + exporter fonctions.
5. **temp.html** (et autres) :
   - markup paneau-carte + `<canvas>` graphique + `<table>` lignes vides remplis via JS ;
   - script inline ou externe qui appelle API, calcule/affiche.
6. **Styles** :
   - utilitaire `.card`, `.badge`, `.table-h` ;
   - classes par onglet `.theme-temp`, `.theme-wmo` appliquées à `<body>`.
7. **Alertes** : composant `<aside class="alert alert--danger">` fade-in.
8. **Méthodologie** : encarts `<section class="methodo">` cartes-pas-à-pas avec numéro, icône, texte.
9. **Responsive** : media queries max-width 1024 px (stack cartes) ; nav switch horizontal → dropdown sur mobile.
10. **Accessibilité** : `aria-selected` sur onglets, `role="tablist"`.

## 7. Spécification détaillée – Onglet WMO

### Objectif

Visualiser sur 7 jours (0-168 h) les codes WMO de **13 modèles** météo, heure par heure, triés par sévérité.

### Structure du tableau

• **Colonnes :** une par heure (`H+0 … H+168`). En-tête : date locale + heure (`dd/mm HHh`).
• **Lignes :** une par _groupe météo_ (sévérité décroissante) :

1. Orage avec grêle `[96, 99]`
2. Orage `[95]`
3. Neige `[71-77, 85, 86]`
4. Averses de pluie `[80-82]`
5. Pluie verglaçante `[56-57, 66-67]`
6. Pluie/Bruine `[51-55, 61-65]`
7. Brouillard `[45, 48]`
8. Couvert `[1-3]`
9. Ciel clair `[0]`

### Contenu de chaque cellule

```html
<div class="cell">
  <span class="model" style="color:#3498DB">AROME</span>
  <img src="/icons/wmo/rainy-5.svg" alt="63" />
  <span class="code">63</span>
</div>
```

• Plusieurs modèles → empiler les blocs verticalement ou en flex-wrap.
• _Tooltip_ au survol : nom long du modèle, description complète du code.

### Ligne finale : résultat agrégé

Dernière ligne du tableau : code WMO agrégé pour chaque heure (icône + code). Tooltip → détail du groupe retenu + seuil dynamique.

### Couleurs de fond par groupe

| Groupe            | Couleur   |
| ----------------- | --------- |
| Ciel clair        | `#FFF176` |
| Couvert           | `#B0BEC5` |
| Brouillard        | `#CFD8DC` |
| Pluie/Bruine      | `#64B5F6` |
| Pluie verglaçante | `#4FC3F7` |
| Averses           | `#2196F3` |
| Neige             | `#E1F5FE` |
| Orage             | `#9575CD` |
| Orage + grêle     | `#7E57C2` |

### Palette des modèles (couleur du texte/badge)

```json
{
  "meteofrance_arome_france": "#3498DB",
  "meteofrance_arome_france_hd": "#A3C6FF",
  "meteofrance_arpege_europe": "#BBDEFB",
  "icon_eu": "#FFFF6B",
  "icon_global": "#F39C12",
  "ukmo_global_deterministic_10km": "#58D68D",
  "ukmo_uk_deterministic_2km": "#A3E4D7",
  "gfs_graphcast025": "#FF7E79",
  "gfs_global": "#FFB3AB",
  "ecmwf_ifs025": "#b17652",
  "knmi_harmonie_arome_europe": "#CE93D8D"
}
```

### Flux JS (exemple)

```js
async function fetchAndRenderWmo(lat, lon) {
  injectSpinner(content);
  const res = await fetch(`/api/test-param/wmo?lat=${lat}&lon=${lon}`);
  const { data } = await res.json(); // data.length = 168
  renderWmoTable(data);
  renderRiskStats(data);
}
```

## 8. Références & assets

- **Chart.js v4** via CDN → `<script src="https://cdn.jsdelivr.net/npm/chart.js">`.
- Icônes animées : `/public/icons/wmo/*.svg` (déjà présentes).
- Police Inter : `<link rel="preconnect" href="https://fonts.gstatic.com">` etc.

---

Ce document contient toutes les **règles métier** (algorithmes) et la **marche détaillée** destinées à une IA ou un développeur pour implémenter la refonte complète en JavaScript Vanilla.
