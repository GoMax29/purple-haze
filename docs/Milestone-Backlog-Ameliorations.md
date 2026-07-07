# Milestone — Backlog d'améliorations (Purple Haze)

> **But du fichier** : capturer toutes les idées issues de l'audit (archi, algos, data science, UX, modèles IA) pour les trier et les traiter régulièrement.
> **Ce n'est PAS un plan figé** : chaque item a un champ `Décision` à remplir au fil de l'eau.
>
> **Légende statut** : `💡 À DÉCIDER` · `✅ RETENU` · `🔧 EN COURS` · `✔️ FAIT` · `❌ REJETÉ` · `🟡 RETENU AVEC MODIF`
> **Impact** : 🔴 fort / 🟠 moyen / 🟢 faible — **Effort** : S / M / L

_Dernière mise à jour : 2026-06-28 — créé depuis l'audit initial._

---

## 0. Vue synthétique (Top 10 priorités proposées)

| # | Idée | Impact | Effort | Statut | Décision |
|---|------|--------|--------|--------|----------|
| 1 | UV réel (now) + extrapolation J6–J7 (clear-sky × nébulosité) | 🔴 | M | 💡 | |
| 2 | Refonte PoP pluie (seuil, dénominateur, retrait terme échéance) | 🔴 | M | 💡 | |
| 3 | Refonte `smart_bary` WMO (sortir clair/nuageux du groupe pluie) | 🔴 | M | 💡 | |
| 4 | Préserver le signal convectif (médiane + P80 mm) | 🔴 | M | 💡 | |
| 5 | Score pluie A–E (couleur + type) | 🔴 | M | 💡 | |
| 6 | Boucle de vérification offline (Brier/MAE/CSI) | 🔴 | L | 💡 | |
| 7 | Pondération par skill (rendre `weight` réellement actif) | 🟠 | L | 💡 | |
| 8 | Injecter `meteoData` dans les modules + remplacer `find` par `Map` | 🟠 | M | 💡 | |
| 9 | Toggle 3 segments labellisés (Liste·Jour·Heure) + alléger vue horaire | 🟠 | S | 💡 | |
| 10 | Aligner doc & code (config morte, types frontière, Tailwind, logs) | 🟠 | M | 💡 | |

---

## 1. Architecture & dette technique

- [ ] **A1 — Config morte `forecast_strategy.json`** 🔴 S
  - Décrite dans README/ARCHITECTURE mais lue nulle part dans le code. Soit l'implémenter (bascule par horizon), soit la supprimer pour éviter de raisonner sur une mécanique fantôme.
  - Décision :

- [ ] **A2 — Pondérations modèles inertes** 🔴 M
  - Le champ `weight` (=1.0) est collecté puis jeté (`gaussian_weighted(values)` n'en tient pas compte). Rendre la pondération réelle OU retirer le champ pour ne pas mentir.
  - Décision :

- [ ] **A3 — Pas de bascule par horizon** 🟠 M
  - Tous les modèles in-window sont mélangés uniformément (AROME HD = ICON global à H+30). Introduire une stratégie par échéance.
  - Décision :

- [ ] **A4 — Perf O(n²)** 🟠 S
  - `findValueByDatetime` = recherche linéaire par heure × variable. Indexer par `Map<datetime, value>`.
  - Décision :

- [ ] **A5 — Fan-out de fetch** 🟠 M
  - Chaque module re-`fetchMeteoData`. Injecter `meteoData` (inversion de dépendance), 1 seul fetch.
  - Décision :

- [ ] **A6 — Cache mémoire non durable** 🟠 M
  - `Map` module-level perdue au cold start / multi-instance serverless. Prévoir Redis/KV ou cache HTTP.
  - Décision :

- [ ] **A7 — Couplage UI ↔ data + règles maison** 🟠 L
  - Inline styles partout (règle Tailwind violée), `console.log` en prod, `hourlyData: any[]` (frontière non typée), dossier `legacy-ui/` = UI active (naming trompeur).
  - Décision :

- [ ] **A8 — Données factices affichées comme réelles** 🔴 S
  - `uvIndex={5}`, `aqi={42}` codés en dur dans la vue « Now » (`page.tsx`). À brancher sur le réel.
  - Décision :

- [ ] **A9 — Liste de modèles dupliquée** 🟢 S
  - Modèles listés en dur dans l'URL `fetchMeteoData` ET dans les JSON → risque de désync. Source unique.
  - Décision :

---

## 2. Algorithmes météo

### 2.A Pluie (problème central)
- [ ] **P1 — Seuil mouillant** 🔴 S — `wet_threshold_mm` 0.0 → 0.1–0.2 mm (élimine la « bruine partout »).
- [ ] **P2 — Dénominateur PoP** 🔴 S — utiliser les modèles *actifs à l'heure H*, pas le total `enabled` (sinon PoP sous-estimée en longue échéance).
- [ ] **P3 — Retirer le terme `c·wEcheance`** 🔴 S — mélanger une confiance d'échéance dans une probabilité est une faute conceptuelle ; gérer l'incertitude à part (via `CI`).
- [ ] **P4 — Réconcilier les 2 probabilités** 🟠 M — `precipitation_probability` (API best_match) vs PoP maison : choisir/combiner, ne pas afficher deux vérités.
- [ ] **P5 — Préserver le convectif** 🔴 M — la moyenne gaussienne log-médiane écrase l'averse isolée. Exposer **médiane + P80**, basculer « averse localisée » si `max > 3×médiane`.
- [ ] **P6 — Séparer 3 dimensions** 🔴 M — proba / intensité (mm) / type (bruine·pluie·averse·orage), jamais fusionnées dans un seul chiffre.

### 2.B WMO
- [ ] **W1 — Groupe RAIN hétérogène** 🔴 M — `smart_bary` met clair (0-3) et pluie (61-82) dans une même liste ordonnée → le barycentre d'index mélange « clair » et « pluie » (sans sens physique). Barycentre uniquement intra-famille homogène.
- [ ] **W2 — Cohérence risques** 🟢 S — vérifier que le mapping risques (riskDetection.ts vs time_slots vs wmo_algorithms) est unique et cohérent (averse vs convective, etc.).

### 2.C Température / vent / UV
- [ ] **T1 — σ fixe température** 🟠 M — σ=1 absolu écrase l'incertitude quand les modèles divergent. Envisager σ adaptatif (MAD) — fonctions déjà présentes mais inutilisées (`adaptiveGaussianWeighted`, `robustGaussianWeighted`, `winsorizedMean`, `mean_trimmed`).
- [ ] **V1 — Rafales lissées** 🟠 M — gaussienne médiane lisse les extrêmes ; pour surf/sécurité, exposer un haut percentile (P80/P90) ou `gust_max` clairement.
- [ ] **T2 — Indépendance des modèles** 🟠 L — AROME/AROME HD/ARPEGE = même famille MF → sur-représentation/sur-confiance. Pondérer par famille.

---

## 3. UV (J0–J5 → J6–J7)
- [ ] **U1 — Cause** : UV vient de l'API air-quality (~5 j) → `uv.max = null` à J6–J7 (badge N/A).
- [ ] **U2 — Solution n°1** 🔴 M : UV clair-ciel analytique `UV_clear(lat, jour)` × atténuation nuageuse dérivée du WMO/nébulosité (clair ×1.0, couvert ×0.4, pluie ×0.25).
- [ ] **U3 — Fallback** 🟠 S : exploiter `uv_index_clear_sky` (déjà demandé à l'API) puis atténuer.
- [ ] **U4 — Honnêteté** 🟢 S : marquer visuellement « estimation » pour J6–J7 (pas de faux sentiment de précision).
- Décision :

---

## 4. Score pluie UX
- [ ] **S1 — Système A–E** 🔴 M : lettre + couleur + pictogramme de type, combinant gravité × probabilité (bornes ci-dessous), garantit que l'orage remonte toujours en tête.
  - A vert (sec fiable) · B jaune (bruine) · C orange (pluie probable) · D rouge (pluie forte/averses) · E violet (orage/grêle).
  - Éviter la fausse précision (pas de « 67,3 % »).
  - Décision :

---

## 5. Navigation / UX
- [ ] **N1 — Toggle « • ⨀ ••• » ambigu** 🟠 S — illisible + binaire alors que la maquette montre 3 vues. Remplacer par segmented control labellisé `Liste · Jour · Heure`.
- [ ] **N2 — Double système d'expansion** 🟠 S — le « + » de `HourlySlotsSection` est un 2ᵉ toggle non relié au premier. Unifier.
- [ ] **N3 — Surcharge vue horaire** 🟠 M — 11 infos × 24 colonnes. Réduire à 3 infos par défaut (temp, pluie, vent), reste au tap.
- [ ] **N4 — Vue ¼ journée** 🟠 — pertinente mais dépend de W1 (WMO par tranche fiable). À corriger avant d'enrichir.
- Décision :

---

## 6. Data science & validation des modèles
- [ ] **D1 — Scoring de fiabilité par modèle** 🔴 L — pondérer par MAE glissante sur le spot (résout A2/A3).
- [ ] **D2 — Exploiter le désaccord inter-modèles** 🟠 M — `CI`/`IQR` calculés mais non affichés ; c'est l'info d'incertitude la plus précieuse.
- [ ] **D3 — Benchmark automatique** 🔴 L — sans vérification, impossible de savoir si `smart_bary` bat une médiane simple.
- Décision :

---

## 7. Dataset & évaluation offline
- [ ] **E1 — Logger prévision ↔ observation** 🔴 L — stocker prévisions agrégées + sorties brutes par modèle (timestamp émission + horizon).
- [ ] **E2 — Vérité terrain** 🟠 M — ERA5/archive Open-Meteo ou METAR proches.
- [ ] **E3 — Métriques** 🔴 M — MAE/RMSE (temp/vent), hit rate/FAR/CSI/ETS (pluie binaire), **Brier + diagramme de fiabilité** (PoP), matrice de confusion (WMO).
- [ ] **E4 — Pipeline nocturne** 🟠 L — cron qui calcule sur fenêtre glissante 30 j et **réinjecte les poids** dans les JSON (config data-driven vivante).
- Décision :

---

## 8. Modèles IA & tendance 7–14 j (voir aussi discussion dédiée)
- [ ] **M1 — ECMWF AIFS 0.25° Single** 💡 — dispo Open-Meteo `/v1/ecmwf` (`ecmwf_aifs025_single`), 15 j, 0.25°, 6-horaire. Candidat n°1 tendance 7–14 j (déterministe, robuste).
- [ ] **M2 — NCEP AIGFS 0.25°** 💡 — dispo Open-Meteo `/v1/gfs` (`gfs_aigfs025`?), 16 j, 0.25°, 6-horaire. 2ᵉ avis IA déterministe pour consensus tendance.
- [ ] **M3 — NCEP HGEFS 0.25° Ensemble Mean** 💡 — dispo Open-Meteo `/v1/gfs`, 10 j, moyenne d'ensemble = signal lissé idéal pour « tendance » (pas pour détail horaire).
- [ ] **M4 — GenCast** 💡 — probabiliste SOTA mais pas exposé clé-en-main sur Open-Meteo (auto-héberger = lourd, TPU). À garder en veille / via ensemble AIFS/AIGEFS comme substitut.
- [ ] **M5 — Affichage tendance 7–14 j** 🟠 M — bandeau « tendance » distinct des daily cards précises : flèche tendance temp + pictos grossiers + indice de confiance (spread d'ensemble), pas de détail horaire.
- Décision :

---

## 9. Régionalisation mondiale (modèles selon le lieu)

**Contexte** : l'app est mondiale mais les configs (`forecast_hours`) sont optimisées Europe. `fetchMeteoData` demande **une URL unique avec 11 modèles en dur** pour toutes les villes ; les modèles régionaux renvoient `null` hors domaine et sont ignorés. Pas de gap temporel, mais **diversité/résolution faible hors Europe**.

- [ ] **R0 — Bug de fond identifié** 🔴 — hors Europe, **température 0–48 h = ECMWF seul** (AROME/ICON‑EU absents, UKMO10 démarre à 48 h, GFS à 120 h). WMO court terme = 2 globaux. La **précipitation** est déjà OK (contient `icon_seamless` + `ukmo_seamless` 0–167).
- [ ] **R1 — Quick‑win seamless** 🔴 S — passer température + WMO sur modèles seamless/globaux dès 0 h (`icon_seamless`, `gfs_seamless`, ajouter `ecmwf_ifs025` déjà là) pour supprimer le « modèle unique » hors EU. À faire **avant** le moteur complet.
- [ ] **R2 — Stratégie n°1 : seamless + best_match** ✅ recommandé S — Open‑Meteo route régional→global en interne. Remplacer modèles régionaux par `*_seamless` (`meteofrance_seamless`, `icon_seamless`, `gfs_seamless`, `gem_seamless`, `jma_seamless`, `ukmo_seamless`) + globaux (`ecmwf_ifs025`, `bom_access_global`, `cma_grapes_global`). **Aucun mapping géo à coder.**
- [ ] **R3 — Stratégie n°2 : routage bbox** 🟠 M — utiliser `model_domains.json` (déjà commencé, ~20 bbox à compléter) + `isInBbox(lat,lon)` pour construire dynamiquement la liste de modèles par point. Pas de polygone nécessaire (rectangle qui déborde → null filtré). Donne le contrôle court/moyen/long explicite.
- [ ] **R4 — Point‑in‑polygon** ❌ rejeté — overkill, gain marginal vs bbox.
- [ ] **R5 — Modèles régionaux à ajouter** 🟠 M — N. Amérique : **HRRR 3 km**, **GEM HRDPS 2,5 km**, GEM regional, NBM (NY). Japon : **JMA MSM 5 km**, JMA GSM (Tokyo). Chine : **CMA GRAPES** (Pékin). Australie : **BOM ACCESS‑G** (Sydney). Corée : KMA. Buenos Aires / Pretoria / Delhi / Bangkok : pas de maille fine dispo → diversité globale seulement.
- [ ] **R6 — Réduire le coût API** 🟠 — le routage diminue `variables × modèles × jours` par appel (moins de null gaspillés) → meilleur quota + latence + payload.
- [ ] **R7 — `forecast_strategy.json` ressuscité région-aware** 🟠 L — fusionner la cible « tiers court/moyen/long » (A1/A3 du backlog) avec le routage régional : par tier, liste de modèles résolue selon la bbox du lieu.
- **Timing décidé** : quick‑win R1/R2 possible maintenant ; moteur complet R3+R5+R7 = milestone **après** correctifs UV/PoP/WMO (impact tous utilisateurs).
- **R8 — Stratégie agrégation/fallback détaillée** 🔴 → voir `docs/Strategie-Agregation-Fallback-Mondiale.md` (2026-06-28). Conclusions : `seamless` inclut auto les LAM fins partout → agréger un socle seamless mondial ; `best_match` n'est PAS le fallback (= PoP + nowcast cohérent + secours) ; basculer la *méthode + confiance* selon le nb de membres effectifs/heure, pas vers best_match ; plan migration 5 phases + décisions D‑1…D‑6.
- Décision :

### Échéances actuelles & pertinence (audit 2026-06-28)
| Ville | Court 0–48h | Moyen 48–120h | Long 120h+ | Verdict |
|---|---|---|---|---|
| Paris | 🟢 AROME HD/FR, KNMI, ICON‑EU | 🔵 ARPEGE, ICON‑EU | ⚪ ECMWF/GFS/UKMO10 | ✅ réf. |
| Moscou | 🔵 ICON‑EU, ARPEGE, ECMWF | 🔵 +globaux | ⚪ globaux | ✅ bon |
| New York | ⚪ ECMWF seul (temp) | ⚪ +UKMO10 | ⚪ +GFS | ⚠️ ajouter HRRR/GEM HRDPS |
| Tokyo | ⚪ ECMWF seul | ⚪ globaux | ⚪ globaux | ⚠️ ajouter JMA MSM |
| Pékin | ⚪ ECMWF seul | ⚪ globaux | ⚪ globaux | ⚠️ ajouter CMA GRAPES |
| Sydney | ⚪ ECMWF seul | ⚪ globaux | ⚪ globaux | ⚠️ ajouter BOM ACCESS‑G |
| Delhi / Bangkok / Buenos Aires / Pretoria | ⚪ ECMWF seul | ⚪ globaux | ⚪ globaux | 🔶 pas de maille fine dispo → globaux = plafond |

---

## Notes de tri (à remplir au fil des sessions)
- …
