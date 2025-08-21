/**
 * Configuration des spots de surf et lieux météo
 *
 * Ce fichier contient la définition de tous les spots prédéfinis
 * avec leurs coordonnées GPS, noms et types.
 *
 * Types de spots :
 * - ville : Ville côtière
 * - surf_spot : Spot de surf spécifique
 * - offshore : Point au large pour données marines
 * - lighthouse : Phare ou point de repère côtier
 */

export const PREDEFINED_SPOTS = {
  // === VILLES CÔTIÈRES BRETONNES ===
  brest: {
    lat: 48.3903,
    lon: -4.4863,
    name: "Brest",
    type: "ville",
    region: "Finistère Nord",
    description: "Port militaire et commercial, rade de Brest",
  },
  quimper: {
    lat: 47.9963,
    lon: -4.0985,
    name: "Quimper",
    type: "ville",
    region: "Finistère Sud",
    description: "Préfecture du Finistère",
  },
  lorient: {
    lat: 47.7482,
    lon: -3.3616,
    name: "Lorient",
    type: "ville",
    region: "Morbihan",
    description: "Port de pêche et base navale",
  },
  vannes: {
    lat: 47.6587,
    lon: -2.7603,
    name: "Vannes",
    type: "ville",
    region: "Morbihan",
    description: "Golfe du Morbihan",
  },
  rennes: {
    lat: 48.1173,
    lon: -1.6778,
    name: "Rennes",
    type: "ville",
    region: "Ille-et-Vilaine",
    description: "Capital régionale (inland)",
  },
  "saint-malo": {
    lat: 48.6497,
    lon: -2.0251,
    name: "Saint-Malo",
    type: "ville",
    region: "Ille-et-Vilaine",
    description: "Cité corsaire, remparts",
  },
  ploumanach: {
    lat: 48.8313,
    lon: -3.4623,
    name: "Ploumanac'h",
    type: "ville",
    region: "Côtes-d'Armor",
    description: "Côte de Granit Rose",
  },
  crozon: {
    lat: 48.2474,
    lon: -4.4896,
    name: "Crozon",
    type: "ville",
    region: "Finistère",
    description: "Presqu'île de Crozon",
  },
  douarnenez: {
    lat: 48.0926,
    lon: -4.3286,
    name: "Douarnenez",
    type: "ville",
    region: "Finistère",
    description: "Port de pêche traditionnelle",
  },
  concarneau: {
    lat: 47.8736,
    lon: -3.9179,
    name: "Concarneau",
    type: "ville",
    region: "Finistère",
    description: "Ville close, port de pêche",
  },

  // === SPOTS DE SURF BRETAGNE ===
  "la-torche": {
    lat: 47.8359,
    lon: -4.3722,
    name: "La Torche",
    type: "surf_spot",
    region: "Finistère Sud",
    description: "Spot de surf populaire, beach break",
    conditions: "Houle W/SW, vent NE/E",
  },
  "cap-frehel": {
    lat: 48.6833,
    lon: -2.3167,
    name: "Cap Fréhel",
    type: "surf_spot",
    region: "Côtes-d'Armor",
    description: "Falaises dramatiques, reef break",
    conditions: "Houle N/NW, vent S/SW",
  },
  "pointe-du-raz": {
    lat: 48.0333,
    lon: -4.7333,
    name: "Pointe du Raz",
    type: "surf_spot",
    region: "Finistère",
    description: "Pointe la plus occidentale, conditions extrêmes",
    conditions: "Grosse houle W/NW",
  },
  guidel: {
    lat: 47.7833,
    lon: -3.5,
    name: "Guidel",
    type: "surf_spot",
    region: "Morbihan",
    description: "Beach break familial",
    conditions: "Houle SW/W, marée montante",
  },
  "plouhinec-audierne": {
    lat: 48.0167,
    lon: -4.5333,
    name: "Plouhinec / Audierne",
    type: "surf_spot",
    region: "Finistère",
    description: "Beach break avec plusieurs peaks",
    conditions: "Houle W/SW",
  },

  // === SPOTS ATLANTIQUE (RÉFÉRENCES) ===
  "hossegor-offshore": {
    lat: 43.65,
    lon: -1.45,
    name: "Hossegor Large",
    type: "offshore",
    region: "Landes",
    description: "Point de référence au large d'Hossegor",
    conditions: "Formation houle Atlantique",
  },
  "la-nord": {
    lat: 46.25,
    lon: -1.5,
    name: "La Rochelle Nord",
    type: "offshore",
    region: "Charente-Maritime",
    description: "Zone au large de La Rochelle",
    conditions: "Houle W/NW, données offshore",
  },

  // === PHARES ET POINTS DE REPÈRE ===
  "ar-men": {
    lat: 48.0331,
    lon: -4.9833,
    name: "Phare d'Ar-Men",
    type: "lighthouse",
    region: "Finistère",
    description: "Phare isolé en mer d'Iroise",
    conditions: "Conditions océaniques extrêmes",
  },
  "ile-de-sein": {
    lat: 48.0394,
    lon: -4.8453,
    name: "Île de Sein",
    type: "offshore",
    region: "Finistère",
    description: "Île basse, données offshore",
    conditions: "Exposition totale houle W",
  },
  "belle-ile": {
    lat: 47.3333,
    lon: -3.1667,
    name: "Belle-Île-en-Mer",
    type: "offshore",
    region: "Morbihan",
    description: "Grande île du Morbihan",
    conditions: "Exposition S/SW",
  },
};

/**
 * Utilitaires pour la configuration des spots
 */

// Groupement par région
export const SPOTS_BY_REGION = {
  "Finistère Nord": ["brest", "ploumanach", "crozon"],
  "Finistère Sud": [
    "quimper",
    "douarnenez",
    "concarneau",
    "la-torche",
    "plouhinec-audierne",
  ],
  Finistère: ["pointe-du-raz", "ar-men", "ile-de-sein"],
  "Côtes-d'Armor": ["ploumanach", "cap-frehel"],
  "Ille-et-Vilaine": ["rennes", "saint-malo"],
  Morbihan: ["lorient", "vannes", "guidel", "belle-ile"],
  Landes: ["hossegor-offshore"],
  "Charente-Maritime": ["la-nord"],
};

// Groupement par type
export const SPOTS_BY_TYPE = {
  ville: [
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
  ],
  surf_spot: [
    "la-torche",
    "cap-frehel",
    "pointe-du-raz",
    "guidel",
    "plouhinec-audierne",
  ],
  offshore: ["hossegor-offshore", "la-nord", "ile-de-sein", "belle-ile"],
  lighthouse: ["ar-men"],
};

// Spots recommandés pour différents usages
export const RECOMMENDED_SPOTS = {
  surf_beginner: ["guidel", "la-torche", "plouhinec-audierne"],
  surf_expert: ["pointe-du-raz", "cap-frehel", "ar-men"],
  marine_data: ["hossegor-offshore", "ile-de-sein", "belle-ile", "la-nord"],
  weather_reference: ["brest", "lorient", "saint-malo"],
};

export default PREDEFINED_SPOTS;
