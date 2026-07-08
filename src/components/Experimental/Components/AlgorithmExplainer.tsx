'use client';

import { useMemo } from 'react';
import { WeatherVariable, TierSelection, CascadeGroup, FetchResult, AggregatedPoint, HourlySeriesKey } from '../types';
import { valueAt } from '../Algorithms/Aggregation';
import { formatDatetime } from './charts/chartUtils';

interface ExplainerConfig {
  methodTitle: string;
  method: string;
  why: string;
  limits: string;
  key: HourlySeriesKey;
  unit: string;
}

const CONFIGS: Record<WeatherVariable, ExplainerConfig> = {
  temperature: {
    methodTitle: 'Moyenne winsorisée / gaussienne robuste',
    method:
      'À chaque heure, si 4 modèles ou plus sont disponibles, on remplace les valeurs extrêmes par leurs voisines (winsorisation 20 %) puis on moyenne. Avec 2-3 modèles, on pondère chaque valeur par une gaussienne centrée sur la médiane : plus un modèle s\'écarte du consensus, moins il pèse.',
    why:
      'La température est un champ continu où le consensus a un sens physique. Ces deux méthodes atténuent fortement un modèle aberrant (ex. 30 °C quand les autres disent 20-21 °C) sans l\'ignorer complètement — s\'il avait raison, les autres convergeront vers lui aux runs suivants.',
    limits:
      'Par construction, le consensus lisse les extrêmes : en cas de canicule ou vague de froid record, il sera légèrement conservateur.',
    key: 'temperature_2m',
    unit: '°C',
  },
  precipitation: {
    methodTitle: 'Médiane multi-modèles',
    method:
      'À chaque heure, on prend la médiane des cumuls prévus par les modèles du pool. On affiche aussi la part de modèles qui voient de la pluie (> 0,1 mm) — un indicateur de probabilité.',
    why:
      'Moyenner des averses serait trompeur : si 2 modèles sur 6 placent une averse de 5 mm à des endroits différents, la moyenne étalerait 1,7 mm partout. La médiane répond à la vraie question : « la majorité des modèles voit-elle de la pluie ici, et combien ? »',
    limits:
      'La médiane peut manquer une averse convective isolée que seule une minorité de modèles capte — c\'est pour cela que le % de modèles en pluie est affiché à côté.',
    key: 'precipitation',
    unit: 'mm',
  },
  humidity: {
    methodTitle: 'Comme la température, bornée 0–100 %',
    method:
      'Même agrégation que la température (winsorisée si N ≥ 4, gaussienne robuste sinon), avec un plancher de sigma adapté (15 %) et un résultat borné entre 0 et 100 %.',
    why:
      'L\'humidité relative est un champ continu et lisse, comme la température. Les mêmes méthodes s\'appliquent naturellement.',
    limits:
      'Près de la saturation (brouillard, bruine), les modèles fins divergent beaucoup des modèles globaux — le consensus peut hésiter autour de 95-100 %.',
    key: 'relative_humidity_2m',
    unit: '%',
  },
  wind: {
    methodTitle: 'Vitesse winsorisée + direction vectorielle',
    method:
      'Vitesse et rafales sont agrégées comme la température. La direction, elle, est moyennée en vecteurs : chaque modèle apporte une flèche (direction × vitesse), on additionne les flèches et on lit l\'angle du résultat.',
    why:
      'On ne peut pas moyenner des angles arithmétiquement : 355° et 5° donneraient 180° (vent du sud !) alors que le vrai consensus est 0° (vent du nord). La pondération par la vitesse évite qu\'un modèle à vent quasi nul fasse dévier la direction.',
    limits:
      'Par vent très faible et variable, la direction consensus reste peu significative — c\'est physique, pas algorithmique.',
    key: 'wind_speed_10m',
    unit: 'km/h',
  },
  sky: {
    methodTitle: 'Vote par groupe de sévérité',
    method:
      'Les codes WMO sont des catégories (0 = ciel clair, 61 = pluie, 95 = orage…), pas des nombres : toute moyenne est physiquement absurde. Chaque modèle vote pour son groupe (clair, brouillard, bruine, pluie, averses, neige, orage). Le groupe majoritaire gagne ; en cas d\'égalité, le plus sévère l\'emporte (principe de précaution). Le code affiché est la médiane des codes du groupe gagnant.',
    why:
      'Le vote préserve le signal de danger : si 3 modèles sur 5 voient de l\'orage, le consensus dira orage — là où une moyenne de codes donnerait un résultat sans aucun sens.',
    limits:
      'Un phénomène vu par une minorité de modèles (2/5) disparaît du vote horaire. Le récapitulatif journalier compense : un groupe significatif présent ≥ 3 h gagne la journée.',
    key: 'weather_code',
    unit: '',
  },
};

interface AlgorithmExplainerProps {
  variable: WeatherVariable;
  tierSelections: TierSelection[];
  cascades: CascadeGroup[];
  modelLines: FetchResult[];
  aggregation: AggregatedPoint[];
}

/**
 * Educational walkthrough of the pipeline for one variable:
 * where the data comes from, how the pool degrades with the horizon,
 * how values are combined, and a concrete example from the current run.
 */
export default function AlgorithmExplainer({
  variable,
  tierSelections,
  cascades,
  modelLines,
  aggregation,
}: AlgorithmExplainerProps) {
  const config = CONFIGS[variable];

  // Concrete example: first hour >= H24 with at least 3 models
  const example = useMemo(() => {
    const point = aggregation.find((p) => p.hour >= 24 && p.modelCount >= 3);
    if (!point) return null;
    const contributions = modelLines
      .map((ml) => ({ model: ml.model, value: valueAt(ml, point.hour, config.key) }))
      .filter((c): c is { model: FetchResult['model']; value: number } => c.value !== null);
    return { point, contributions };
  }, [aggregation, modelLines, config.key]);

  const tierLine = (sel: TierSelection) =>
    sel.models.map((m) => `${m.providerFlag} ${m.name} (${m.resolution_km} km, ${m.forecast_hours} h)`).join(' · ');

  return (
    <div className="space-y-4 text-[11px] leading-relaxed text-slate-400">
      {/* 1. Data sources */}
      <section>
        <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          1 · D&apos;où viennent les données ?
        </h4>
        <p>
          Chaque modèle est interrogé individuellement (pas de « seamless » : on sait exactement
          quelle résolution on agrège). Les modèles sont classés par finesse de maille :
        </p>
        <ul className="mt-1.5 space-y-1 pl-1">
          {tierSelections.map((sel) => (
            <li key={sel.meshTier} className="flex gap-1.5">
              <span className="shrink-0 font-semibold text-slate-300">
                {sel.meshTier === 'fine' ? 'Fine (< 5 km) :' : sel.meshTier === 'medium' ? 'Moyenne (5–11 km) :' : 'Large (> 11 km) :'}
              </span>
              <span>{tierLine(sel) || 'aucun modèle disponible ici'}</span>
            </li>
          ))}
        </ul>
        {cascades.length > 0 && (
          <p className="mt-1.5">
            Les modèles d&apos;un même centre se relaient (« seamless maison ») :{' '}
            {cascades
              .map((c) =>
                c.models
                  .map((m) => {
                    const r = c.activeRanges[m.id];
                    return `${m.name} H${r.startH}–${r.endH}`;
                  })
                  .join(' → ')
              )
              .join(' ; ')}
            .
          </p>
        )}
      </section>

      {/* 2. Progressive pool */}
      <section>
        <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          2 · Qui parle à quelle échéance ?
        </h4>
        <p>
          À chaque heure, on utilise les modèles les plus fins disponibles (au moins 3). Quand les
          mailles fines expirent (~48-60 h), les mailles moyennes prennent le relais, puis les
          mailles larges au-delà de ~120-180 h. La transition est progressive : les tiers cohabitent
          quand l&apos;un d&apos;eux devient trop peu nombreux, ce qui évite les sauts dans la courbe.
        </p>
      </section>

      {/* 3. Method for this variable */}
      <section>
        <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
          3 · Comment on combine : {config.methodTitle}
        </h4>
        <p>{config.method}</p>
        <p className="mt-1.5">
          <span className="text-slate-300 font-semibold">Pourquoi ce choix ? </span>
          {config.why}
        </p>
        <p className="mt-1.5">
          <span className="text-slate-300 font-semibold">Limite à connaître : </span>
          {config.limits}
        </p>
      </section>

      {/* 4. Concrete example */}
      {example && (
        <section>
          <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            4 · Exemple réel — {formatDatetime(example.point.datetime)}
          </h4>
          <div className="rounded-lg bg-slate-800/40 border border-slate-700/30 px-3 py-2 space-y-0.5">
            {example.contributions.map((c) => (
              <div key={c.model.id} className="flex justify-between gap-3 font-mono text-[10px]">
                <span className="truncate">{c.model.providerFlag} {c.model.name}</span>
                <span className="text-slate-300">
                  {variable === 'sky' ? `WMO ${c.value}` : `${Math.round(c.value * 10) / 10} ${config.unit}`}
                </span>
              </div>
            ))}
            <div className="flex justify-between gap-3 font-mono text-[10px] pt-1 mt-1 border-t border-slate-700/50 font-bold text-purple-300">
              <span>→ Consensus ({example.point.method})</span>
              <span>
                {variable === 'sky' ? `WMO ${example.point.value}` : `${example.point.value} ${config.unit}`}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
