# Algorithmes WMO - Module Partagé

## 📁 Architecture décentralisée

Le module `shared/wmo_algorithms.js` centralise tous les algorithmes de traitement des codes météo WMO pour permettre une sélection dynamique selon la configuration.

## 🧮 Algorithmes disponibles

### 1. **Mode** (`"mode"`)

```javascript
// Sélectionne le code WMO le plus fréquent
// En cas d'ex-aequo, prend le plus sévère (valeur numérique max)
"algorithm": "mode"
```

**Exemple :**

- Codes : [61, 61, 63, 95]
- Mode : 61 (2 occurrences)
- Résultat : `{ wmo: 61, debug: { selectionType: 'dominant' } }`

**Ex-aequo :**

- Codes : [61, 63, 95, 95]
- Modes : 61, 95 (2 occurrences chacun)
- Résultat : `{ wmo: 95, debug: { selectionType: 'severity_tiebreak' } }`

### 2. **Groupes de sévérité** (`"severityGroups"` ou `"wmoSeverityGroups"`)

```javascript
// Algorithme sophistiqué avec seuil dynamique et médiane
// Identique à l'ancien comportement par défaut
"algorithm": "severityGroups"
```

**Logique :**

1. Classe les codes par groupes de sévérité (0-8)
2. Calcul seuil dynamique : `80% / nombre_groupes_actifs`
3. Sélectionne le groupe le plus sévère dépassant le seuil
4. Si aucun groupe ne dépasse : groupe avec le plus d'occurrences
5. Retourne la médiane du groupe sélectionné

### 3. **Sévérité maximale** (`"maxSeverity"`)

```javascript
// Sélectionne simplement le code le plus sévère présent
"algorithm": "maxSeverity"
```

**Exemple :**

- Codes : [0, 1, 61, 95]
- Résultat : `{ wmo: 95, debug: { selectionType: 'max_severity' } }`

## ⚙️ Configuration

### Modifier l'algorithme

```json
// config/wmo.json
{
  "algorithm": "mode",  // ← Changer ici
  "algorithm_params": {
    "dynamicThresholdBase": 80,
    "severityGroups": { ... }
  }
}
```

### Algorithmes de test rapide

Pour débugger les différences d'agrégation :

```json
// Test algorithme simple
{ "algorithm": "mode" }

// Test sévérité maximale
{ "algorithm": "maxSeverity" }

// Retour à l'algorithme sophistiqué
{ "algorithm": "severityGroups" }
```

## 🐛 Debug et logs

### Console logs automatiques

```javascript
[WMO Processing] Using algorithm: mode
[WMO Mode] Processing 8 codes: [0,1,61,61,63,95,95,95]
[WMO Mode] Selected code 95 (3/8 = 37.5%) - dominant
[WMO] H+24 (2025-01-31T12:00:00Z): 8 models → code 95 (mode)
```

### Gestion d'erreurs robuste

1. **Algorithme principal** : Celui configuré dans `wmo.json`
2. **Fallback 1** : Algorithme `mode` si erreur
3. **Fallback 2** : Code le plus fréquent simple si `mode` échoue

### Debug dans la matrice UI

La ligne de debug affiche maintenant :

- **Seuil** : Calculé par l'algorithme (ou "N/A")
- **Groupe** : Nom du groupe sélectionné (ou "N/A")
- **Code** : Code WMO final
- **Type** : `dominant`, `fallback`, `severity_tiebreak`, etc.

## 🔄 Migration depuis l'ancien système

### Avant

```javascript
// Dans traitement/wmo.js
function wmoSeverityGroupsAlgorithm(wmoCodes, config) {
  // Logique directement intégrée
}
```

### Après

```javascript
// Import dynamique
import { wmoAlgorithms } from "../shared/wmo_algorithms.js";

// Sélection selon config
const algorithm = wmoAlgorithms[config.algorithm];
const result = algorithm(wmoCodes, config);
```

## 🧪 Tests et validation

### Tester un nouvel algorithme

1. Configurer `"algorithm": "mode"` dans `wmo.json`
2. Ouvrir la page `/test-algo` onglet WMO
3. Vérifier les logs console pour voir les différences
4. Comparer avec `"algorithm": "severityGroups"`

### Validation des résultats

- La ligne de debug montre le type de sélection pour chaque échéance
- Les logs console détaillent le processus de décision
- La matrice 168h permet de comparer visuellement les différences

---

## 📊 Résultat standardisé

Tous les algorithmes retournent le même format :

```javascript
{
  wmo: 95,                    // Code WMO sélectionné
  risque: {                   // Scores de risque (0-5)
    orage: 2,
    grele: 1,
    verglas: 0,
    brouillard: 0
  },
  debug: {                    // Informations de debug
    algorithm: 'mode',
    totalModels: 8,
    selectionType: 'dominant',
    threshold: 'N/A',         // ou pourcentage pour severityGroups
    selectedGroup: 'N/A'      // ou nom groupe pour severityGroups
  }
}
```

Cette architecture permet d'ajouter facilement de nouveaux algorithmes et de comparer leurs comportements en temps réel !
