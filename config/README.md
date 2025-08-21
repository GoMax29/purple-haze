# 📋 Configuration des Paramètres Météo

Ce dossier contient les fichiers de configuration JSON pour chaque paramètre météo traité par le système.

## 🏗️ Structure des Fichiers de Configuration

Chaque paramètre météo dispose de son propre fichier de configuration suivant le format `{parametre}.json`.

### 📝 Format Standard

```json
{
  "parameter": "nom_du_parametre",
  "api_parameter": "nom_dans_api_openmeteo",
  "api_source": "api1|api2|api3",
  "algorithm": "nom_algorithme",
  "unit": "unité_mesure",
  "output_format": "hourly_array",
  "algorithm_params": {
    "sigma": 1.5,
    "center": "median"
  },
  "models": {
    "model_key": {
      "name": "Nom affiché",
      "forecast_hours": [heure_min, heure_max],
      "weight": 1.0,
      "enabled": true
    }
  },
  "description": "Description du paramètre",
  "last_updated": "2025-01-30T12:00:00Z"
}
```

## 🔧 Champs de Configuration

### Informations Générales

- **parameter**: Nom interne du paramètre
- **api_parameter**: Nom du paramètre dans l'API Open-Meteo
- **api_source**: Source des données (api1=météo, api2=UV/qualité air, api3=marine)
- **unit**: Unité de mesure pour l'affichage
- **output_format**: Format de sortie (toujours "hourly_array" pour l'instant)
- **description**: Description lisible du paramètre
- **last_updated**: Date de dernière modification

### Configuration Algorithmique

- **algorithm**: Nom de l'algorithme à appliquer ("gaussian", "weighted_average", etc.)
- **algorithm_params**: Paramètres spécifiques à l'algorithme
  - **sigma**: Écart-type pour l'algorithme gaussien
  - **center**: Centre de pondération ("median", "mean")

### Configuration des Modèles

Chaque modèle météo est configuré avec :

- **name**: Nom affiché dans l'interface
- **forecast_hours**: Plage d'échéances `[heure_min, heure_max]` en heures depuis maintenant
- **weight**: Poids du modèle (1.0 = poids standard)
- **enabled**: Activation/désactivation du modèle

## 🌐 Modèles Météo Disponibles

### Modèles Haute Résolution (0-56h)

- `meteofrance_arome_france`: MF AROME FRANCE
- `meteofrance_arome_france_hd`: MF AROME FRANCE HD

### Modèles Régionaux (0-122h)

- `knmi_harmonie_arome_europe`: VNMI HARMONIE AROME EU
- `ukmo_uk_deterministic_2km`: UKMO DETERM 2KM
- `icon_eu`: ICON-EU

### Modèles Moyennes Échéances (48-168h)

- `meteofrance_arpege_europe`: MF ARPEGE EU
- `ukmo_global_deterministic_10km`: UKMO GLOBAL DETERM 10KM

### Modèles Globaux (60-168h)

- `gfs_global`: GFS GLOBAL 0.1°/0.25°
- `gfs_graphcast025`: GFS GRAPHCAST
- `ecmwf_ifs025`: ECMWF IFS 0.25°

## 🧮 Algorithmes Disponibles

### Algorithme Gaussien (`gaussian`)

Applique une pondération gaussienne centrée sur la médiane des valeurs.

**Paramètres:**

- `sigma`: Écart-type de la gaussienne (défaut: 1.5)
- `center`: Centre de pondération ("median" recommandé)

**Usage:** Optimal pour lisser les valeurs en privilégiant celles proches de la tendance centrale.

### Algorithme Moyenne Pondérée (`weighted_average`)

Calcule une moyenne pondérée selon les poids des modèles.

**Usage:** Utile quand certains modèles sont plus fiables que d'autres.

## 📊 Échéances des Modèles

| Modèle          | Échéances | Résolution | Zone      |
| --------------- | --------- | ---------- | --------- |
| AROME FRANCE    | 0-56h     | 1.3km      | France    |
| AROME FRANCE HD | 0-56h     | 0.5km      | France    |
| HARMONIE EU     | 0-48h     | 2.5km      | Europe    |
| UKMO 2KM        | 0-48h     | 2km        | UK/Europe |
| ARPEGE EU       | 48-104h   | 7.5km      | Europe    |
| ICON-EU         | 0-122h    | 6.5km      | Europe    |
| UKMO 10KM       | 48-158h   | 10km       | Global    |
| GFS GLOBAL      | 96-167h   | 25km       | Global    |
| GFS GRAPHCAST   | 96-167h   | 25km       | Global    |
| ECMWF IFS       | 60-167h   | 25km       | Global    |

## 🔄 Gestion des Échéances

Le système applique automatiquement les contraintes d'échéances :

1. **Filtrage temporel**: Seules les données dans la plage `forecast_hours` sont utilisées
2. **Transition progressive**: Les modèles se relaient selon leurs domaines de validité
3. **Fallback**: Si aucun modèle n'est disponible, utilisation de la moyenne simple

## ✅ Validation des Configurations

Lors du chargement, le système vérifie :

- ✅ Format JSON valide
- ✅ Présence des champs obligatoires
- ✅ Cohérence des échéances
- ✅ Disponibilité des modèles dans l'API
- ✅ Paramètres d'algorithme valides

## 🚀 Ajout d'un Nouveau Paramètre

1. Créer le fichier `config/{parametre}.json`
2. Remplir selon le format standard
3. Créer le module `traitement/{parametre}.js`
4. Ajouter les tests dans la page `/test-meteo`
5. Mettre à jour cette documentation

## 📝 Exemple Complet

Voir `temperature.json` et `temperature_apparente.json` pour des exemples de configuration complète.
