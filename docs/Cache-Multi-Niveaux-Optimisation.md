# Cache Multi-Niveaux - Optimisation Performance

## Problème identifié

### ❌ Architecture problématique initiale

L'architecture initiale causait des problèmes majeurs de performance :

1. **Appels API répétés** : Chaque clic sur DailyCard déclenche `fetchFullForecastData()`
2. **Recalculs inutiles** : `forecastCore.js` retraite les données brutes à chaque interaction
3. **Cache incomplet** : Le cache ne couvrait que les données brutes, pas les calculs
4. **Consommation ressources** : CPU/mémoire côté client sur-sollicités
5. **Limites API atteintes** : Quotas OpenMeteo dépassés rapidement
6. **UI lente** : Impression de "rechargement complet" à chaque clic

### 🔍 Analyse du problème

```
Flux initial problématique:
Clic DailyCard → fetchFullForecastData() → forecastCore.js → 11 modules traitement → Agrégations → UI
     ↑                    ↑                      ↑                    ↑              ↑
   Chaque clic         API fetch            Recalcul complet    CPU intensif    Lenteur UI
```

## Solution : Cache Multi-Niveaux

### 🏗️ Architecture optimisée

**Cache Niveau 1** : Données brutes (existant)
- **Localisation** : `pages/api/fetchMeteoData.js`
- **Contenu** : Réponses JSON d'OpenMeteo (3 APIs)
- **TTL** : 15 minutes
- **Avantage** : Évite les appels API répétés

**Cache Niveau 2** : Données traitées (nouveau)
- **Localisation** : `src/core/forecastCore.js`
- **Contenu** : Objets `{ hourlyData, dailyData, elevation }` finaux
- **TTL** : 15 minutes (synchronisé)
- **Avantage** : Évite les recalculs intensifs

### 🔧 Implémentation technique

#### 1. Cache Niveau 2 (forecastCore.js)

```javascript
// Cache traité avec TTL synchronisé
const processedCache = new Map();
const TTL_MINUTES = 15; // Identique à fetchMeteoData
const TTL_MS = TTL_MINUTES * 60 * 1000;

export const buildForecastFromCoordinates = async (lat, lon) => {
  // 0. Vérification cache traité AVANT tout calcul
  const cacheKey = generateCacheKey(lat, lon);
  const cachedProcessed = processedCache.get(cacheKey);
  
  if (isProcessedCacheValid(cachedProcessed)) {
    console.log(`📦 Cache HIT niveau 2 (traité) pour ${lat}, ${lon}`);
    return cachedProcessed.data; // RETOUR IMMÉDIAT
  }

  // 1. Calculs uniquement en cas de cache MISS
  console.log(`🚀 Cache MISS niveau 2 - Début du traitement`);
  // ... tous les calculs intensifs ...
  
  // 2. Mise en cache du résultat final
  const result = { hourlyData, dailyData, elevation };
  processedCache.set(cacheKey, {
    data: result,
    timestamp: Date.now(),
  });
  
  return result;
};
```

#### 2. Optimisation HourlySlotsSection

**AVANT** : Appel API à chaque clic DailyCard
```javascript
const loadHourlyData = async () => {
  const data = await fetchFullForecastData(lat, lon); // ❌ Appel à chaque clic
  const slots = generateHourlySlots(data.forecastData.hourlyData, selectedDayIndex);
  setHourlySlots(slots);
};
```

**APRÈS** : Lecture cache uniquement
```javascript
interface HourlySectionProps {
  hourlyData: any[]; // ✅ Données pré-calculées reçues
}

useEffect(() => {
  if (hourlyData && hourlyData.length > 0) {
    console.log(`📅 Génération slots pour jour ${selectedDayIndex} (pas de fetch API)`);
    const slots = generateHourlySlots(hourlyData, selectedDayIndex); // ✅ Calcul local uniquement
    setHourlySlots(slots);
  }
}, [selectedDayIndex, hourlyData]); // ✅ Pas de dépendance API
```

#### 3. Pré-calcul global (WeatherSummary)

```javascript
const WeatherSummary = ({ currentLocation, ... }) => {
  const [hourlyData, setHourlyData] = useState([]);

  // ✅ Récupération UNIQUE par localisation
  useEffect(() => {
    if (currentLocation) {
      loadHourlyDataOnce(); // UNE SEULE FOIS
    }
  }, [currentLocation]); // Seulement au changement de ville

  const loadHourlyDataOnce = async () => {
    console.log(`🔄 Récupération unique des données horaires`);
    const data = await fetchFullForecastData(lat, lon);
    setHourlyData(data.forecastData.hourlyData); // Cache local UI
  };

  return (
    <>
      <HourlySlotsSection 
        hourlyData={hourlyData} // ✅ Données partagées
        selectedDayIndex={selectedDayIndex}
      />
    </>
  );
};
```

### 📊 Stats et Debug

#### API Cache Stats

Route dédiée : `/api/cache-stats`
```javascript
export async function GET() {
  const stats = getAllCacheStats(); // Combine niveau 1 + 2
  return NextResponse.json({
    cache_system: "multi-level",
    level_1_raw: { total_entries, valid_entries, ttl_minutes, cache_size_mb },
    level_2_processed: { total_entries, valid_entries, ttl_minutes, cache_size_mb },
    sync_status: { ttl_synchronized, common_coordinates },
    performance: { total_cache_size_mb, efficiency_ratio }
  });
}
```

#### Debug UI intégré

Section debug dans `test-ui/page.tsx` avec :
- **Stats temps réel** : Mise à jour automatique à chaque interaction
- **Cache niveau 1 et 2** : Entrées valides, TTL, taille mémoire
- **Synchronisation** : Vérification cohérence TTL
- **Performance** : Ratio d'efficacité, taille totale cache
- **Bouton refresh** : Force la mise à jour des stats

```javascript
const handleDaySelect = (index) => {
  setSelectedDayIndex(index);
  // ✅ Mise à jour stats pour voir l'efficacité du cache
  setTimeout(() => updateCacheStats(), 500);
};
```

## Résultats attendus

### 🚀 Gains de performance

**Appels API** :
- ❌ Avant : 1 appel par clic DailyCard
- ✅ Après : 1 appel par ville toutes les 15 minutes max

**Calculs CPU** :
- ❌ Avant : 11 modules de traitement + agrégations à chaque clic
- ✅ Après : Lecture mémoire uniquement (cache niveau 2)

**Réactivité UI** :
- ❌ Avant : "Chargement..." à chaque clic
- ✅ Après : Changement instantané

**Consommation réseau** :
- ❌ Avant : ~50 requêtes/heure (limite rapidement atteinte)
- ✅ Après : ~4 requêtes/heure max par localisation

### 📈 Métriques observables

**Dans les logs console** :
```
📦 [ForecastCore] Cache HIT niveau 2 (traité) pour 47.833, -4.266
📅 [HourlySlotsSection] Génération slots pour jour 3 (pas de fetch API)
```

**Dans l'UI debug** :
- Performance : **95% efficace** (ratio cache hits)
- Total Cache : **2.4 MB** (niveau 1 + 2)
- Coords communes : **1** (cache synchronisé)

## Migration et compatibilité

### ✅ Rétrocompatibilité garantie

- **API routes** : Aucun changement d'interface
- **WeatherSummary** : Props inchangées
- **DailyCards** : Fonctionnement identique
- **forecastService** : Interface préservée

### 🔧 Points de contrôle

1. **Vérifier synchronisation TTL** : Logs et UI debug
2. **Observer réduction appels API** : Console réseau navigateur
3. **Mesurer réactivité** : Temps entre clic et affichage
4. **Contrôler taille cache** : Stats mémoire en temps réel

## Tests de validation

### Scénarios de test

1. **Premier chargement ville** : 
   - ✅ Cache MISS → Appel API + calculs
   - ✅ Données mises en cache niveau 1 et 2

2. **Clics DailyCards rapides** :
   - ✅ Cache HIT niveau 2 → Pas d'appel API
   - ✅ Changement instantané des slots horaires

3. **Changement de ville** :
   - ✅ Nouveau cache pour nouvelles coordonnées
   - ✅ Ancien cache conservé (dans la limite TTL)

4. **Expiration cache (15min)** :
   - ✅ Cache MISS automatique
   - ✅ Récupération fraîche des données

### Commandes de debug

```javascript
// Console navigateur
await fetch('/api/cache-stats').then(r => r.json())

// Stats détaillées
console.log(getAllCacheStats())

// Vider cache traité
clearProcessedCache()
```

## Prochaines optimisations

### Possibles améliorations

1. **Cache persistant** : localStorage pour survive aux rechargements
2. **Background refresh** : Renouvellement automatique avant expiration
3. **Compression** : Réduction taille mémoire cache
4. **Cache invalidation** : API pour forcer le refresh
5. **Service Worker** : Cache hors-ligne pour PWA

### Monitoring production

- **Métriques APM** : Temps de réponse API vs cache hits
- **Analytics** : Réduction abandons utilisateur
- **Alerting** : Seuils dépassement quota API
- **Observabilité** : Logs structurés pour debugging

---

## Conclusion

Le système de cache multi-niveaux transforme une application lente avec des appels API répétés en une interface réactive qui respecte les quotas. L'architecture est **extensible**, **observable** et **rétrocompatible**, garantissant une expérience utilisateur optimale.




