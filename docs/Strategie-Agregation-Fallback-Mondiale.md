# Comment Purple Haze devrait choisir ses modèles météo selon l'endroit du monde

> **But du fichier** : expliquer la stratégie de sélection et d'agrégation des modèles Open-Meteo selon le lieu et l'échéance, et en déduire les conséquences sur l'architecture de l'application.
> **Statut** : document de décision (discussion). **Aucun code modifié.**
> _Créé : 2026-06-28. Réécrit : 2026-06-29._

---

## 1. Résumé exécutif

Purple Haze est une application météo qui mélange les prévisions de plusieurs modèles numériques pour produire une prévision unique, plus fiable qu'un seul modèle pris isolément. Aujourd'hui, cette mécanique fonctionne bien en Europe occidentale, où l'application dispose de nombreux modèles régionaux à haute résolution. Mais dès qu'un utilisateur cherche la météo de New York, Tokyo ou Buenos Aires, l'application ne dispose plus que d'un seul modèle exploitable pour les premières 48 heures. La prévision repose alors sur une source unique, sans filet de sécurité et sans possibilité de mesurer l'incertitude.

Ce rapport répond à trois questions :

1. **Comment obtenir le maximum de modèles pertinents pour n'importe quelle ville du monde**, afin de maintenir une agrégation statistique de qualité à court, moyen et long terme ?
2. **Que faire quand peu de modèles sont disponibles dans une région donnée** — faut-il basculer vers un système automatique comme Best Match ou Seamless, et lequel choisir ?
3. **Quelles sont les conséquences concrètes sur l'architecture de l'application** — le système de récupération des données, la gestion du cache, le coût des appels API ?

La réponse courte : en remplaçant la liste actuelle de modèles régionaux européens par un socle de **modèles dits "Seamless"** (un concept expliqué en détail dans ce document), l'application obtient automatiquement les modèles les plus fins disponibles pour chaque point du globe, sans écrire une seule ligne de code géographique. Le système appelé **Best Match** conserve un rôle précis mais limité. Et la vraie intelligence se situe dans le choix de la méthode statistique utilisée pour combiner les modèles, qui s'adapte au nombre de sources effectivement disponibles à chaque heure de prévision.

---

## 2. Quel problème cherche-t-on à résoudre ?

### 2.1 Le fonctionnement actuel, en bref

Pour comprendre le problème, il faut d'abord comprendre comment Purple Haze construit une prévision aujourd'hui.

Lorsqu'un utilisateur demande la météo d'une ville, l'application envoie une requête à l'API Open-Meteo en lui demandant simultanément les prévisions de **11 modèles météorologiques** — par exemple AROME France HD (un modèle très détaillé de Météo-France, avec une maille de 1,3 km), ICON-EU (le modèle européen du service météorologique allemand DWD, maille de 7 km), ou encore ECMWF IFS (le modèle global du Centre européen, maille de 25 km).

Pour chaque heure de prévision, l'application collecte les valeurs de tous ces modèles (température, vent, précipitation, etc.), puis les combine statistiquement — typiquement en calculant une moyenne pondérée, centrée sur la médiane et filtrée par une courbe gaussienne — pour produire une valeur unique, plus robuste qu'un modèle seul.

Ce mécanisme, que l'on appelle **agrégation multi-modèles**, est au cœur de la valeur ajoutée de Purple Haze.

### 2.2 Le problème : cette liste de modèles est pensée pour l'Europe

Les 11 modèles demandés sont codés en dur dans le fichier `src/lib/fetchMeteoData.js`. Ils ont été choisis pour la Bretagne et fonctionnent bien en France et en Europe occidentale. Mais plusieurs d'entre eux sont des **modèles régionaux** : ils ne couvrent qu'une zone géographique limitée.

Par exemple :
- **AROME France** et **AROME France HD** ne couvrent que la France métropolitaine (et un petit débordement sur les pays voisins).
- **ICON-EU** ne couvre que l'Europe, de l'Islande à la Turquie.
- **KNMI Harmonie** ne couvre que l'Europe du Nord-Ouest.
- **UKMO 2 km** ne couvre que les îles Britanniques.

Quand l'application demande la température à **New York** à ces modèles, tous les régionaux européens répondent `null` (aucune donnée). Seul **ECMWF IFS**, qui est un modèle global (il couvre la planète entière), renvoie une valeur. Résultat : pour les premières 48 heures de prévision, la température à New York repose sur **un seul modèle**. Il n'y a ni diversité, ni filet de sécurité, ni moyen de calculer une incertitude.

Le tableau ci-dessous résume la situation actuelle pour plusieurs villes :

| Ville | Court terme (0–48 h) | Moyen terme (48–120 h) | Long terme (120 h+) |
|---|---|---|---|
| Paris | 🟢 5 à 8 modèles (régionaux + globaux) | 🟢 4 à 6 modèles | 🟢 3 à 4 globaux |
| New York | 🔴 1 seul modèle (ECMWF) | 🟠 2 modèles (ECMWF + UKMO) | 🟠 3 globaux |
| Tokyo | 🔴 1 seul modèle | 🟠 2 à 3 globaux | 🟠 3 globaux |
| Buenos Aires | 🔴 1 seul modèle | 🟠 2 à 3 globaux | 🟠 3 globaux |

C'est un problème sérieux : l'application est présentée comme mondiale, mais en dehors de l'Europe, elle perd l'essentiel de sa valeur ajoutée.

### 2.3 Ce que l'on voudrait obtenir

L'objectif est de construire un système où :
- **partout dans le monde**, l'application dispose d'au moins 4 à 5 modèles indépendants pour produire son agrégation ;
- là où des modèles régionaux très détaillés existent (par exemple le HRRR américain à 3 km, ou le MSM japonais à 5 km), ils soient **automatiquement intégrés** sans code spécifique par région ;
- le système **adapte sa méthode statistique** au nombre de modèles disponibles à chaque heure de prévision : une agrégation robuste quand beaucoup de modèles contribuent, une approche plus prudente quand peu de modèles sont disponibles ;
- et un **système de secours** prenne le relais dans les rares cas où l'agrégation est impossible.

> **À retenir.** Le problème n'est pas que l'application manque de modèles en général — Open-Meteo en propose plus de 30. Le problème est que la liste actuelle est figée pour l'Europe, et que les modèles globaux (qui couvrent le monde entier) ne sont pas tous inclus.

---

## 3. Les différentes stratégies possibles

Avant de détailler la solution recommandée, passons en revue les quatre grandes approches envisageables. Chacune a été étudiée ; comprendre leurs forces et leurs limites aide à saisir pourquoi la stratégie finalement retenue est un hybride.

### Stratégie A — "Best Match" (la sélection automatique d'Open-Meteo)

Open-Meteo propose un mode appelé **Best Match**. Quand on l'utilise, on ne choisit pas soi-même les modèles : l'API sélectionne automatiquement, pour chaque point géographique et chaque heure de prévision, le modèle le plus fin et le plus récent disponible. Elle recolle ensuite toutes ces tranches en une seule série temporelle continue, prolongée par le modèle américain GFS jusqu'à 16 jours.

C'est un peu comme demander à un chef cuisinier de vous servir le meilleur plat du jour sans vous montrer le menu. Le résultat est généralement excellent, mais vous n'avez **qu'un seul plat** — vous ne pouvez pas comparer plusieurs avis pour juger de l'incertitude.

### Stratégie B — "Seamless" (l'empilement automatique par fournisseur)

Open-Meteo propose également un concept appelé **Seamless** (que l'on pourrait traduire par "sans couture" ou "continu"). Un modèle Seamless combine automatiquement les différentes résolutions d'un **même fournisseur** en une série continue.

Prenons un exemple concret. Le service météorologique américain (NOAA) produit deux modèles : le **HRRR** (très détaillé, maille de 3 km, mais seulement sur les États-Unis et pour les 48 premières heures) et le **GFS** (global, maille de 25 km, jusqu'à 16 jours). Si vous demandez `gfs_seamless` à Open-Meteo pour New York, l'API vous renvoie automatiquement le HRRR pour les premières heures (car il est plus fin), puis bascule silencieusement vers le GFS quand le HRRR n'a plus de données. Si vous demandez `gfs_seamless` pour Paris (hors du domaine HRRR), vous obtiendrez directement le GFS global — **jamais de trou, jamais de valeur nulle**.

### Stratégie C — Routage géographique par boîtes englobantes

Cette stratégie consiste à définir, pour chaque modèle, un rectangle géographique (appelé **boîte englobante**, ou "bounding box" en anglais) qui délimite sa zone de couverture. Quand l'utilisateur demande la météo d'une ville, l'application teste les coordonnées de la ville contre chaque rectangle pour déterminer quels modèles sont pertinents, puis ne demande que ceux-là à l'API.

C'est une approche plus manuelle mais plus fine : elle permet de contrôler exactement quels modèles sont utilisés à quel endroit. Son inconvénient est qu'elle nécessite de maintenir une base de données de rectangles géographiques (notre fichier `docs/model_domains.json`, actuellement incomplet) et d'écrire du code de routage.

### Stratégie D — Routage par polygones précis

Variante de la stratégie C, où l'on remplacerait les rectangles par des polygones qui suivent précisément les contours de chaque domaine de modèle. Cette approche a été **écartée** : le gain de précision est marginal (un rectangle qui déborde un peu renvoie simplement `null`, ce que l'on sait déjà filtrer) et la complexité de maintenance est élevée.

> **À retenir.** Quatre stratégies ont été envisagées. La stratégie D (polygones) a été écartée comme disproportionnée. Les trois autres (Best Match, Seamless, boîtes englobantes) ne sont pas mutuellement exclusives — la solution recommandée les combine intelligemment.

---

## 4. Explication détaillée de chaque stratégie

### 4.1 Best Match : forces et limites

**Comment ça fonctionne exactement.** Quand on passe `models=best_match` dans la requête Open-Meteo, l'API parcourt sa base de modèles interne, identifie le plus fin disponible pour le point demandé à chaque pas de temps, et produit **une unique série temporelle**. À Paris, les premières heures viendront probablement d'AROME HD (1,3 km), le moyen terme de l'IFS d'ECMWF, et le long terme du GFS. À Tokyo, les premières heures viendront du MSM japonais (5 km), puis du GFS.

**Les avantages sont réels :**
- Aucune configuration à maintenir côté client — c'est Open-Meteo qui fait le travail.
- La série est toujours cohérente physiquement : à chaque heure, toutes les variables (température, vent, humidité, code météo) proviennent du même modèle, donc elles sont mutuellement compatibles.
- C'est la meilleure source pour la **probabilité de précipitation** : aux États-Unis, elle provient du NBM (National Blend of Models, un produit statistique avancé de la NOAA) ; ailleurs, elle est dérivée du GFS par Open-Meteo.

**Mais les limites sont importantes pour notre cas d'usage :**
- On n'obtient **qu'une seule valeur par heure**. Impossible de calculer un écart entre modèles, un intervalle de confiance, ou une mesure d'incertitude.
- On ne sait pas quel modèle a été utilisé à chaque heure (c'est une boîte noire).
- On ne peut donc pas appliquer notre propre logique d'agrégation — la moyenne pondérée, la gaussienne, le filtre winsorisé (c'est-à-dire une moyenne qui ignore les valeurs extrêmes pour être plus robuste) — qui est au cœur de Purple Haze.

**En résumé : Best Match est excellent comme réponse rapide et cohérente, mais il ne permet pas de construire l'agrégation multi-modèles qui fait la valeur ajoutée de Purple Haze.**

### 4.2 Seamless : le mécanisme-clé

**Comment ça fonctionne.** Chaque modèle Seamless regroupe les différentes résolutions d'un même service météorologique national. L'API Open-Meteo empile les couches automatiquement, en donnant la priorité à la plus fine :

```
gfs_seamless (NOAA, USA) :
  → HRRR 3 km (si disponible dans la zone)     pour 0–48 h
  → GFS 0.25° global                            pour 48 h–16 jours

icon_seamless (DWD, Allemagne) :
  → ICON-D2 2 km (si zone Allemagne/environs)   pour 0–48 h
  → ICON-EU 7 km (si zone Europe)                pour 0–120 h
  → ICON Global 13 km                            pour 120 h+

meteofrance_seamless (Météo-France) :
  → AROME HD 1.3 km (si France)                  pour 0–48 h
  → ARPEGE Europe 10 km (si Europe)              pour 0–96 h
  → ARPEGE Monde 25 km                           pour 96 h+
```

La beauté du système est que **la même requête fonctionne partout dans le monde**. Si l'on demande `gfs_seamless` pour Buenos Aires, le HRRR n'existe pas dans cette zone, donc l'API renvoie directement le GFS global — aucune erreur, aucune valeur nulle. Et si l'on demande `gfs_seamless` pour New York, on obtient automatiquement le HRRR ultra-détaillé pour les premières heures, sans l'avoir explicitement demandé.

**L'avantage décisif pour Purple Haze** est qu'en demandant **5 modèles Seamless de fournisseurs différents**, on obtient **5 séries temporelles indépendantes** couvrant le monde entier. On peut alors les agréger avec nos propres méthodes statistiques, calculer un écart, mesurer l'incertitude, et appliquer des poids différents selon la résolution effective.

**Les limites à connaître :**
- Certains modèles Seamless ne sont pas totalement indépendants les uns des autres. Par exemple, les modèles Seamless du KNMI (Pays-Bas), du DMI (Danemark) et de MET Norway (Norvège) sont **mélangés en interne avec les données ECMWF**. Si l'on comptait ECMWF, KNMI, DMI et MET Norway comme quatre sources indépendantes, on surestimerait la diversité réelle de nos données. Il faudra en tenir compte dans la pondération.
- De la même façon, AROME, AROME HD et ARPEGE appartiennent tous à la même "famille" Météo-France : ils partagent des hypothèses physiques similaires. Les traiter comme trois voix indépendantes serait une erreur statistique.

### 4.3 Boîtes englobantes : un complément utile

L'idée des boîtes englobantes n'est pas exclue — elle intervient en complément, à un stade ultérieur. Elle permet d'**ajouter** des modèles régionaux spécifiques là où ils sont pertinents, et surtout d'**éviter de demander** des modèles inutiles là où ils ne servent à rien.

**Exemple concret.** Si l'utilisateur demande la météo de Buenos Aires, il n'est pas utile de demander `meteofrance_seamless` : hors de France et d'Europe, ce modèle retombera sur ARPEGE Monde (25 km), qui est redondant avec les autres globaux. On gaspille une unité de quota API pour un modèle qui n'apporte aucune diversité. Une boîte englobante permettrait de ne demander `meteofrance_seamless` que lorsque l'utilisateur se trouve en Europe.

Cependant, cette optimisation n'est pas urgente : elle est utile pour économiser le quota API, mais le système fonctionne correctement sans elle (les valeurs redondantes sont simplement ignorées par l'agrégation).

> **À retenir.** Seamless est le mécanisme principal : il fournit automatiquement les meilleurs modèles de chaque fournisseur pour chaque point du globe, et permet l'agrégation multi-modèles. Best Match reste utile pour des rôles spécifiques (probabilité de précipitation, secours). Les boîtes englobantes sont une optimisation future pour économiser le quota API.

---

## 5. Pourquoi la stratégie recommandée est la meilleure dans notre contexte

### 5.1 La solution en une phrase

**Construire un socle de modèles Seamless et globaux qui fonctionne partout dans le monde, et adapter la méthode d'agrégation au nombre de modèles effectivement disponibles à chaque heure de prévision.**

### 5.2 Le socle mondial : cinq centres météorologiques indépendants

La proposition concrète est de remplacer la liste actuelle de 11 modèles régionaux européens par un socle de **cinq modèles Seamless** issus de cinq centres météorologiques nationaux différents, plus un modèle global supplémentaire :

| Modèle Seamless | Centre météorologique | Pays d'origine | Modèle fin inclus automatiquement |
|---|---|---|---|
| `ecmwf_ifs025` | ECMWF | Union européenne | IFS 25 km (global) — pas de maille fine régionale |
| `gfs_seamless` | NOAA | États-Unis | HRRR 3 km (USA) puis GFS 25 km (monde) |
| `icon_seamless` | DWD | Allemagne | ICON-D2 2 km (Allemagne) → ICON-EU 7 km (Europe) → ICON 13 km (monde) |
| `gem_seamless` | Service météo canadien | Canada | GEM HRDPS 2,5 km (Canada) → GEM Régional → GEM Global |
| `ukmo_seamless` | Met Office | Royaume-Uni | UKV 2 km (îles Britanniques) → UKMO 10 km (monde) |

Ce socle garantit qu'à tout point du globe, on dispose d'**au moins cinq prévisions indépendantes**, depuis l'heure 0 jusqu'à au moins 7 jours. Là où des modèles régionaux fins existent (HRRR aux USA, ICON-D2 en Allemagne, UKV au Royaume-Uni...), ils sont automatiquement utilisés pour les premières heures — **sans qu'aucun code géographique ne soit nécessaire**.

### 5.3 Des centres régionaux en complément (optionnel, par boîtes englobantes)

Pour certaines régions du monde, on peut ajouter des modèles supplémentaires via un test de boîte englobante :

- `meteofrance_seamless` → ajouté lorsque le lieu est en Europe (apporte AROME 1,3 km en France)
- `jma_seamless` → ajouté lorsque le lieu est au Japon ou en Asie de l'Est (apporte JMA MSM 5 km)
- `kma_seamless` → ajouté lorsque le lieu est en Corée
- `cma_grapes_global` → ajouté pour la Chine (CMA GRAPES, 15 km)
- `bom_access_global` → ajouté pour l'Océanie (BOM ACCESS-G, 15 km)

Ces ajouts augmentent la diversité dans les régions concernées, mais ne sont pas indispensables : le socle de cinq centres suffit partout.

### 5.4 L'agrégation adaptative : la vraie intelligence du système

Le point le plus important de cette stratégie n'est pas *quels modèles* on utilise, mais *comment on les combine*, et comment cette combinaison s'adapte au contexte.

À chaque heure de prévision, le système devrait :

1. **Compter le nombre de modèles qui fournissent effectivement une valeur** (c'est-à-dire les modèles "non nuls"). Ce nombre varie selon l'heure de prévision : à court terme, davantage de modèles régionaux fins contribuent ; à long terme, seuls les modèles globaux restent.

2. **Choisir la méthode statistique en fonction de ce nombre** :

   - **Cinq modèles ou plus** : on dispose de suffisamment de sources pour appliquer une **moyenne winsorisée** (c'est-à-dire une moyenne calculée après avoir écarté les valeurs extrêmes les plus hautes et les plus basses, typiquement 10 à 20 % de chaque côté). Cette méthode est robuste : elle n'est perturbée ni par un modèle anormalement chaud ni par un modèle anormalement froid. L'intervalle de confiance affiché peut être étroit — on est raisonnablement sûr de la prévision.

   - **Trois ou quatre modèles** : on applique une **moyenne gaussienne centrée sur la médiane** (la méthode actuelle de Purple Haze), ou simplement la médiane. L'intervalle de confiance est un peu plus large — on est un peu moins sûr, et le lecteur de la prévision doit le savoir.

   - **Deux modèles** : on calcule simplement la moyenne des deux, et on affiche un **intervalle de confiance large** pour signaler que la prévision repose sur peu de sources.

   - **Un seul modèle** : on affiche la valeur telle quelle, accompagnée d'un indicateur visuel clair signalant que la prévision repose sur une source unique.

   - **Aucun modèle** (cas théoriquement impossible avec le socle global, mais prévu en cas de panne) : on bascule vers **Best Match** comme système de secours.

3. **Pondérer les modèles par résolution et par famille** : un modèle régional à 3 km de résolution mérite un poids plus important qu'un modèle global à 25 km, surtout à court terme où la finesse de la maille fait une différence significative. Et les modèles d'une même famille (par exemple KNMI/DMI/MET Norway, qui sont tous mélangés avec ECMWF) reçoivent un poids réduit pour éviter de surreprésenter un seul courant de pensée météorologique.

### 5.5 Le rôle précisé de Best Match dans cette architecture

Best Match ne disparaît pas. Il conserve trois rôles précis :

1. **Source de la probabilité de précipitation.** L'application utilise déjà Best Match pour obtenir la `precipitation_probability`, qui bénéficie aux États-Unis du National Blend of Models (un produit statistique avancé). C'est un usage pertinent qui doit être maintenu.

2. **Prévision "maintenant" (nowcast, 0–6 heures).** Pour la vue "conditions actuelles", la cohérence entre les variables (température, vent, humidité, icône météo) est plus importante que la robustesse statistique. Utiliser une seule source cohérente (Best Match) évite le risque d'afficher une combinaison physiquement absurde — par exemple une température de 30°C avec une icône de neige parce que les modèles auraient été moyennés de façon indépendante. Le créateur d'Open-Meteo a lui-même souligné ce risque.

3. **Système de secours.** Dans le cas (improbable mais possible) où l'appel multi-modèles échoue complètement, Best Match sert de solution de repli pour afficher malgré tout une prévision à l'utilisateur.

### 5.6 Pourquoi ce n'est pas un "fallback Best Match ou Seamless"

La question initiale envisageait une logique binaire : "agréger quand on a beaucoup de modèles, basculer vers Best Match quand on en a peu." La réalité est plus nuancée. Avec le socle mondial de cinq centres Seamless, **on ne se retrouve presque jamais sans modèles**. Même à Delhi ou Buenos Aires, où aucun modèle régional fin n'existe, on dispose de cinq prévisions globales indépendantes. C'est suffisant pour une agrégation robuste.

Le vrai ajustement ne se fait donc pas entre "agrégation" et "Best Match", mais **à l'intérieur** de l'agrégation : on change la méthode (winsorisée → médiane → valeur unique), on élargit l'intervalle de confiance, et on signale la qualité moindre. Ce mécanisme est beaucoup plus fluide qu'une bascule binaire.

> **À retenir.** La stratégie recommandée repose sur un socle de cinq modèles Seamless qui fonctionne partout dans le monde. L'intelligence réside dans l'agrégation adaptative, qui ajuste sa méthode au nombre de modèles disponibles à chaque heure. Best Match conserve trois rôles précis et limités : la probabilité de précipitation, le nowcast cohérent, et le secours d'urgence.

---

## 6. Exemples concrets sur plusieurs villes du monde

Pour illustrer concrètement comment cette stratégie se comporte, examinons dix villes couvrant des situations très différentes.

### 6.1 🟢 Paris (France) — Le cas idéal, riche en modèles régionaux

Paris est au cœur de l'Europe et bénéficie de la meilleure couverture possible.

**À court terme (0–48 h)**, le système dispose de modèles régionaux fins : AROME HD (1,3 km) via `meteofrance_seamless`, ICON-D2 (2 km) via `icon_seamless`, éventuellement Harmonie KNMI. Ces modèles captent les phénomènes locaux : brises de mer, orages de convection, brouillards de vallée. L'agrégation winsorisée avec cinq sources ou plus est optimale.

**À moyen terme (48–120 h)**, les modèles régionaux cèdent progressivement la place aux modèles de maille intermédiaire (ARPEGE 10 km, ICON-EU 7 km) et aux globaux. On reste avec 5 à 7 membres utiles.

**À long terme (120 h+)**, seuls les globaux contribuent (ECMWF, GFS, ICON Global, GEM, UKMO). C'est normal et suffisant pour une prévision à 5–7 jours.

**Verdict** : agrégation riche à tous les horizons. Aucun recours à Best Match nécessaire. Situation de référence.

### 6.2 🟢 New York (USA) — Le grand bénéficiaire du passage aux Seamless

**Situation actuelle** : les modèles régionaux européens renvoient tous `null`. La température repose sur ECMWF seul pendant 48 heures. C'est le problème numéro un qui motive cette refonte.

**Avec la stratégie Seamless** : `gfs_seamless` inclut automatiquement le **HRRR à 3 km** (un modèle américain extrêmement détaillé), et `gem_seamless` inclut le **GEM HRDPS à 2,5 km** (modèle canadien couvrant l'est de l'Amérique du Nord). Sans écrire une seule ligne de code géographique, New York passe de 1 modèle à **5–7 sources indépendantes** à court terme.

**Verdict** : la ville qui bénéficie le plus du changement de stratégie. Agrégation robuste à tous les horizons.

### 6.3 🟡 Tokyo (Japon) — Un centre national fin, complété par les globaux

`jma_seamless` inclut automatiquement le **JMA MSM à 5 km** (modèle régional japonais), qui couvre le Japon et ses alentours. À cela s'ajoutent les cinq modèles globaux du socle.

À court terme, on dispose du MSM (5 km) plus les globaux — c'est un peu moins riche qu'à Paris (où l'on a des modèles de 1 à 3 km), mais nettement mieux que la situation actuelle (1 seul modèle).

**Verdict** : hybride sain. Modèle fin local à court terme, globaux à moyen et long terme.

### 6.4 🔵 Moscou (Russie) — Au bord du domaine européen

Moscou se situe à la limite orientale des domaines ICON-EU et ARPEGE Europe. Ces modèles de maille intermédiaire (7–10 km) sont disponibles, mais on n'a pas de modèle vraiment fin (1–3 km).

**Verdict** : agrégation correcte avec 5–6 membres, dont des modèles de maille intermédiaire. Pas de modèle fin hyper-local, mais une couverture honnête.

### 6.5 ⚪ Pékin (Chine) et Sydney (Australie) — Un centre national, pas de maille fine

Pékin bénéficie du modèle **CMA GRAPES** (service météorologique chinois) et Sydney du modèle **BOM ACCESS-G** (Bureau of Meteorology australien). Ces modèles sont globaux (15 km de maille), mais ils sont produits par les services nationaux respectifs, qui disposent de plus d'observations locales dans leurs données d'initialisation. Leur ajout apporte donc une réelle diversité par rapport aux globaux européens et américains.

**Verdict** : agrégation de globaux enrichie par un centre national. Court terme grossier (pas de modèle fin local sur Open-Meteo pour ces régions), mais acceptable.

### 6.6 ⚪ Delhi, Bangkok, Buenos Aires, Pretoria — Les globaux seuls

Pour ces villes, aucun modèle régional fin n'est disponible sur Open-Meteo. Le système dispose uniquement des cinq membres globaux du socle (ECMWF, GFS, ICON, GEM, UKMO), avec une résolution de 10 à 25 km.

Cela peut sembler décevant, mais c'est en réalité **bien meilleur que la situation actuelle** (1 seul modèle). Et surtout, l'agrégation de cinq globaux indépendants permet de calculer un **écart inter-modèles** (c'est-à-dire la mesure dans laquelle les modèles sont en accord ou en désaccord). Cet écart est une information extrêmement précieuse : quand les cinq modèles s'accordent, la confiance est élevée ; quand ils divergent, cela signale une situation météo incertaine (ce qui arrive souvent dans les régions de mousson comme Delhi ou Bangkok).

Dans ce cas, **l'intervalle de confiance devient l'information la plus importante à afficher à l'utilisateur**, plus que la valeur brute.

**Verdict** : agrégation de globaux, suffisante pour une prévision utile. La clé est d'afficher l'incertitude honnêtement.

### 6.7 Et Best Match dans tout cela ?

Dans aucune de ces dix villes, Best Match n'est nécessaire comme source principale. Même dans le cas le plus défavorable (Delhi, Bangkok, Buenos Aires, Pretoria), le socle global fournit cinq membres, ce qui est suffisant pour agréger.

Best Match reste utilisé pour :
- la **probabilité de précipitation** (partout, comme c'est déjà le cas dans l'application actuelle) ;
- la vue **"maintenant"** (conditions actuelles cohérentes) ;
- le **secours** en cas de panne de l'appel multi-modèles.

> **À retenir.** Le passage aux modèles Seamless transforme radicalement la couverture mondiale. New York passe de 1 modèle à 5–7. Delhi passe de 1 à 5. Et là où des modèles régionaux fins existent (HRRR, MSM, AROME, UKV...), ils sont automatiquement inclus sans aucun code géographique.

---

## 7. Conséquences sur l'architecture de l'application

### 7.1 Refonte du module de récupération des données

Le fichier `src/lib/fetchMeteoData.js` contient aujourd'hui une URL avec 11 modèles codés en dur. Cette URL devrait être construite dynamiquement à partir d'un **registre central de modèles** — un fichier de configuration unique qui décrit chaque modèle (son identifiant Open-Meteo, son fournisseur, sa famille, son type de couverture, sa résolution).

Ce registre résout un problème existant : aujourd'hui, la liste des modèles est dupliquée à deux endroits (dans l'URL de `fetchMeteoData` et dans les fichiers JSON de configuration par variable comme `config/temperature.json`). Ce point est identifié dans le backlog comme le problème **A9 (Liste de modèles dupliquée)**.

Une fonction comme `getModelsForLocation(latitude, longitude)` consulterait ce registre et retournerait la liste des modèles à demander à l'API. Dans un premier temps, cette fonction retournerait toujours le même socle de cinq Seamless + globaux. Dans un second temps, elle pourrait ajouter des modèles régionaux conditionnels via des boîtes englobantes.

### 7.2 Impact sur le quota API

Open-Meteo facture son usage (au-delà du seuil gratuit) en unités pondérées, qui dépendent du nombre de variables demandées, du nombre de modèles, et du nombre de jours de prévision.

La bonne nouvelle est que le passage aux Seamless **réduit le gaspillage**. Aujourd'hui, les modèles régionaux européens renvoient des colonnes entièrement vides (`null`) quand l'utilisateur n'est pas en Europe, mais chaque colonne consomme tout de même du quota. Avec les Seamless, chaque modèle demandé renvoie toujours des données utiles, partout dans le monde.

L'ajout ultérieur de boîtes englobantes permettrait d'aller plus loin : ne pas demander `meteofrance_seamless` quand l'utilisateur est à Buenos Aires (car le modèle retomberait de toute façon sur ARPEGE Monde, redondant avec les autres globaux).

Les prévisions longue portée (7–16 jours) via les modèles d'intelligence artificielle (AIFS, GraphCast) représentent un coût supplémentaire et devraient être proposées derrière un **bouton "tendance"**, plutôt que chargées systématiquement.

### 7.3 Impact sur le cache

Le système de cache actuel présente deux faiblesses que cette refonte met en évidence :

1. **La clé de cache est trop précise.** Les coordonnées sont arrondies à quatre décimales, ce qui correspond à une précision d'environ 11 mètres. Deux recherches pour "Paris" avec des coordonnées légèrement différentes (issues du géocodage) ne partageront jamais leur cache. Arrondir à deux décimales (précision d'environ 1,1 km) ou "snapper" au centroïde de la ville améliorerait énormément le taux de réutilisation du cache.

2. **Le cache ne survit pas aux redémarrages.** Il est stocké en mémoire (une `Map` JavaScript au niveau du module), ce qui signifie qu'il est perdu à chaque redémarrage du serveur — un événement fréquent dans un environnement serverless comme Vercel. Un cache durable (Redis, Vercel KV, ou en-têtes HTTP `s-maxage`) réduirait significativement le nombre d'appels API. Ce point est identifié dans le backlog comme le problème **A6 (Cache mémoire non durable)**.

De plus, la clé de cache devrait intégrer une **signature du jeu de modèles** utilisé. Si la liste de modèles change (par exemple parce que l'on ajoute un centre régional via boîte englobante), un ancien cache avec une liste différente ne devrait pas être réutilisé.

### 7.4 Pondération et méthode d'agrégation

Aujourd'hui, le champ `weight` présent dans les fichiers de configuration de chaque variable (`config/temperature.json`, etc.) est collecté mais ignoré. Toutes les valeurs sont fixées à 1.0 et la fonction `gaussian_weighted()` n'en tient pas compte. Ce point est identifié comme le problème **A2 (Pondérations modèles inertes)** dans le backlog.

La refonte proposerait d'activer réellement ces poids, avec deux critères :
- la **résolution** du modèle à l'heure considérée (un modèle à 3 km pèse plus qu'un modèle à 25 km) ;
- la **famille** du modèle (les modèles d'une même famille partagent un poids réduit pour éviter la surreprésentation).

De plus, l'application dispose déjà de fonctions statistiques avancées qui ne sont actuellement pas utilisées (`winsorizedMean`, `mean_trimmed`, `adaptiveGaussianWeighted`, `robustGaussianWeighted`). La stratégie d'agrégation adaptative donnerait enfin un rôle concret à ces outils. Ce point est lié au problème **T1 (Sigma fixe pour la température)** du backlog.

### 7.5 Risque de cohérence inter-variables

Un point de vigilance important mérite d'être souligné. Lorsque l'on agrège **chaque variable météo séparément** (la température en combinant les températures de cinq modèles, le vent en combinant les vents de cinq modèles, etc.), on risque de produire un état physiquement incohérent. Par exemple, un modèle peut prévoir 10°C avec de la pluie forte, tandis qu'un autre prévoit 25°C avec du ciel clair. Leur moyenne (17°C, pluie modérée) n'a pas de réalité physique.

Pour atténuer ce risque, trois précautions sont recommandées :
- utiliser **le même ensemble de modèles et les mêmes poids** pour toutes les variables à une heure donnée ;
- dériver le code météo (WMO) **après** l'agrégation plutôt qu'en l'agrégeant directement ;
- pour la vue "maintenant" (0–6 h), préférer **Best Match** (source unique cohérente) à l'agrégation.

> **À retenir.** La refonte touche quatre aspects de l'architecture : la construction dynamique de la liste de modèles, l'optimisation du quota API, la fiabilisation du cache, et l'activation de la pondération. Chaque modification est indépendante et peut être déployée incrémentalement.

---

## 8. Plan de migration recommandé

La migration est découpée en cinq phases, de la plus simple à la plus ambitieuse. Chaque phase apporte une amélioration concrète et peut être déployée indépendamment des suivantes.

### Phase 0 — Victoire rapide (effort faible, bénéfice immédiat)

**Objectif** : supprimer le problème "un seul modèle hors Europe" sans toucher à l'architecture.

**Ce qui change** : dans `fetchMeteoData.js`, remplacer la liste de 11 modèles régionaux européens par le socle de cinq modèles Seamless + globaux dans l'URL de l'API. C'est une modification de quelques lignes.

**Résultat** : New York, Tokyo, Delhi et toutes les autres villes du monde passent immédiatement de 1 modèle à au moins 5. L'agrégation existante (gaussienne centrée médiane) fonctionne déjà correctement avec ces nouvelles données.

**Risques** : très faibles. Les modèles Seamless renvoient des données dans le même format que les modèles individuels.

*Correspond aux items R1 (Victoire rapide seamless) et R2 (Stratégie seamless + best_match) du backlog.*

### Phase 1 — Registre unique de modèles (effort faible à moyen)

**Objectif** : centraliser la liste de modèles en une source de vérité unique.

**Ce qui change** : création d'un fichier de registre (par exemple `config/models.json` ou `shared/modelRegistry.js`) qui décrit chaque modèle, et d'une fonction `getModelsForLocation()` qui construit la liste dynamiquement.

**Résultat** : fin de la duplication entre `fetchMeteoData.js` et les configs par variable. Ajout ou retrait d'un modèle en un seul endroit.

*Correspond à l'item A9 (Liste de modèles dupliquée) du backlog.*

### Phase 2 — Agrégation adaptative (effort moyen)

**Objectif** : adapter la méthode statistique au nombre de modèles effectifs.

**Ce qui change** : à chaque heure, comptage des modèles non nuls, choix de la méthode (winsorisée / gaussienne / médiane), activation des poids par résolution et par famille, et exposition de l'intervalle de confiance à l'interface utilisateur.

**Résultat** : pondérations enfin actives, incertitude visible, méthode robuste quand les modèles sont nombreux.

*Correspond aux items A2 (Pondérations inertes), A3 (Pas de bascule par horizon), T1 (Sigma fixe température), et D2 (Exploiter le désaccord inter-modèles) du backlog.*

### Phase 3 — Boîtes englobantes pour les centres régionaux (effort moyen)

**Objectif** : ajouter des modèles régionaux supplémentaires là où ils sont pertinents, et économiser du quota là où ils ne le sont pas.

**Ce qui change** : implémentation de `isInBbox(lat, lon)` à partir du fichier `docs/model_domains.json` (à compléter), pour conditionner l'ajout de centres comme `meteofrance_seamless`, `jma_seamless`, `cma_grapes_global`, `bom_access_global`.

**Résultat** : davantage de diversité en Europe, au Japon, en Chine, en Australie. Moins de quota gaspillé ailleurs.

*Correspond aux items R3 (Routage bbox), R5 (Modèles régionaux à ajouter) et R7 (Stratégie régionale ressuscitée) du backlog.*

### Phase 4 — Tendance longue portée et cache durable (effort moyen à élevé)

**Objectif** : ajouter les prévisions 7–16 jours via les modèles d'IA, et fiabiliser le cache.

**Ce qui change** : ajout des modèles ECMWF AIFS et GFS GraphCast derrière un bouton "tendance", affichage sous forme de bandeau séparé (flèche de tendance + indice de confiance, pas de détail horaire). Passage du cache en mémoire à un cache durable (Redis ou Vercel KV), et révision de la clé de cache (arrondi, signature du jeu de modèles, TTL étagé).

*Correspond aux items M5 (Affichage tendance 7–14 j) et A6 (Cache non durable) du backlog.*

> **À retenir.** La migration est incrémentale et à faible risque. La Phase 0 peut être réalisée immédiatement avec un bénéfice mondial. Chaque phase suivante enrichit le système sans remettre en cause les précédentes.

---

## 9. Points restant à décider

Six décisions attendent d'être tranchées avant de passer au code. Chacune est formulée ici comme une question ouverte.

- [ ] **Décision D1 (Composition du socle mondial)** — Le socle retenu est-il `ecmwf_ifs025` + `gfs_seamless` + `icon_seamless` + `gem_seamless` + `ukmo_seamless`, soit cinq centres indépendants ? Faut-il y ajouter d'emblée `meteofrance_seamless` et `jma_seamless`, ou attendre la Phase 3 (boîtes englobantes) pour les ajouter conditionnellement ?

- [ ] **Décision D2 (Seuils de bascule de méthode d'agrégation)** — Les seuils proposés (5+ modèles → winsorisée, 3–4 → gaussienne/médiane, 2 → médiane, 1 → valeur seule, 0 → Best Match) sont-ils pertinents ? Faut-il affiner ces seuils après expérimentation ?

- [ ] **Décision D3 (Pondération par famille et par résolution)** — Comment gérer concrètement les modèles qui partagent des données ECMWF en interne (KNMI, DMI, MET Norway) ? Quel coefficient réducteur appliquer ? Comment pondérer la résolution (linéaire, logarithmique, par paliers) ?

- [ ] **Décision D4 (Nowcast 0–6 h : Best Match ou agrégation ?)** — Pour la vue "maintenant", préfère-t-on Best Match (cohérence physique entre variables) ou l'agrégation (robustesse statistique) ? C'est un compromis réel : Best Match garantit la cohérence mais ne permet pas de mesurer l'incertitude.

- [ ] **Décision D5 (Boîtes englobantes dès la Phase 1 ?)** — Faut-il implémenter les boîtes englobantes dès la Phase 1 pour économiser le quota, ou commencer par le socle pur (sans routage géographique) pour valider le système plus simplement ?

- [ ] **Décision D6 (Stratégie de cache)** — Quel niveau d'arrondi pour la clé de cache (deux décimales, centroïde de la ville, autre) ? Faut-il investir dans un cache durable (Redis / Vercel KV) dès maintenant, ou attendre d'avoir mesuré le volume d'appels ?

> **À retenir.** Ces six décisions n'ont pas de réponse universelle — elles dépendent du contexte du projet (budget, urgence, volume d'utilisateurs). La plupart peuvent être tranchées empiriquement après la Phase 0, en observant les données réelles.

---

## 10. Conclusion : les idées essentielles à retenir

Ce rapport couvre un sujet vaste — comment une application météo devrait choisir et combiner ses sources de données à l'échelle mondiale. Voici les cinq idées à garder en mémoire.

**Première idée.** Le problème actuel est que Purple Haze est pensée pour l'Europe. Hors du continent, la prévision repose souvent sur un seul modèle, ce qui supprime toute possibilité d'agrégation et d'estimation de l'incertitude.

**Deuxième idée.** La solution la plus élégante repose sur les modèles **Seamless** d'Open-Meteo. Chaque modèle Seamless combine automatiquement les différentes résolutions d'un même fournisseur (du régional fin au global) en une série continue. En demandant cinq modèles Seamless de cinq centres indépendants, on obtient une couverture mondiale avec des modèles fins là où ils existent — sans aucun code géographique.

**Troisième idée.** **Best Match** n'est pas le système de secours général. Avec le socle Seamless, on dispose toujours d'au moins cinq modèles, même dans les régions les moins couvertes. L'adaptation se fait à l'intérieur de l'agrégation (en changeant de méthode statistique et en élargissant l'intervalle de confiance), pas en basculant vers Best Match. Ce dernier conserve trois rôles précis : la probabilité de précipitation, le nowcast cohérent, et le secours d'urgence.

**Quatrième idée.** La migration peut être incrémentale. La Phase 0 (remplacement de la liste de modèles dans une URL) apporte un bénéfice mondial immédiat avec un risque minimal. Les phases suivantes enrichissent progressivement le système.

**Cinquième idée.** L'incertitude est une information, pas un défaut. Afficher un intervalle de confiance large quand les modèles divergent est plus honnête — et plus utile à l'utilisateur — qu'une fausse précision basée sur un seul modèle.

---

## Références internes

- Backlog §9 (Régionalisation mondiale) + items A1, A2, A3, A5, A6, A9, T1, T2, D2, R0–R8 : `docs/Milestone-Backlog-Ameliorations.md`
- Domaines géographiques des modèles : `docs/model_domains.json` (environ 20 boîtes englobantes à compléter)
- Module d'accès aux données actuel : `src/lib/fetchMeteoData.js`
- Configurations par variable : `config/temperature.json`, `precipitation.json`, `wmo.json`, `wind.json`, `humidite.json`
- Configuration inactive à ressusciter : `config/forecast_strategy.json`
