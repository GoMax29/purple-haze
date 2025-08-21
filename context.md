🌊 Contexte initial
Je dispose actuellement :

D’une ancienne app météo :

Fichier unique index.html : HTML/CSS/JS d’environ 9000 lignes (illisible et ingérable).

Requêtes aux API météo intégrées en dur.

Modèles météo, échéances, pondérations et algorithmes (comme la proba de pluie) hardcodés.

Aucun système de config externe → non évolutif.

D’un dashboard de configuration :

App HTML/CSS/JS tout-en-un.

Sert à paramétrer les modèles/variables/algo de pluie mais ne génère pas encore de fichier .json de config.

⚙️ Objectif du nouveau projet
Créer une web-app modulaire en Next.js/React qui :

Permet de basculer entre une interface météo classique (maintenant, journée, semaine) et une interface surf Bretagne (spots, carte, conditions).

Permet de découpler totalement l’UI des traitements métiers.

Rend chaque couche (API, algo, UI) remplaçable et configurable.

Prépare une migration fluide de l’ancienne app vers la nouvelle (même UX côté utilisateur).

✅ Stack conservée
Frontend : React, Next.js, TailwindCSS, Recharts, Zustand pour le store.

Backend : API routes de Next.js (pas de dossier backend/ séparé pour l’instant).

Typage léger : TypeScript (optionnel pour les nouveaux fichiers).
Fichiers config : JSON.

Visualisation météo/surf : composants dynamiques, graphiques, sliders, algos personnalisés.

🧠 Stratégie de migration
Migration partielle de l’existant :

Extraire les graphismes de l’ancienne app météo et les intégrer dans des composants React.

Identifier et externaliser tous les paramètres hardcodés (modèles, échéances, algo pluie) dans un fichier JSON config/model-config.json.

Reconstruction du core :

Un module central lit les réponses API et les paramètres depuis le fichier JSON.

Il applique les algorithmes métier pour produire des données utilisables côté UI.

Le front récupère les résultats, sans connaître les détails internes.

Génération du fichier de configuration .json :

✅ Recommandation  (commencer par définir le format cible propre) → meilleure cohérence, moins de dettes techniques.

D’abord construire les besoins de la nouvelle app (structure JSON cible), puis modifier le dashboard pour qu’il génère ce format exact.


