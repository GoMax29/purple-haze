import { BboxResult } from '../types';
import { FAMILY_LABELS } from '../data/models';
import { getMeshTier } from '../data/families';
import ModelRow from './ModelRow';

interface StepBoundingBoxProps {
  results: BboxResult[];
  lat: number;
  lon: number;
}

export default function StepBoundingBox({ results, lat, lon }: StepBoundingBoxProps) {
  const nwpResults = results.filter((r) => !r.model.isAI);
  const available = nwpResults.filter((r) => r.inBounds);
  const unavailable = nwpResults.filter((r) => !r.inBounds);

  const fineCount = available.filter(
    (r) => !r.model.excludeFromAggregation && getMeshTier(r.model.resolution_km) === 'fine'
  ).length;
  const mediumCount = available.filter(
    (r) => !r.model.excludeFromAggregation && getMeshTier(r.model.resolution_km) === 'medium'
  ).length;
  const largeCount = available.filter(
    (r) => !r.model.excludeFromAggregation && getMeshTier(r.model.resolution_km) === 'large'
  ).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 1 — Bounding Box
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {available.length}/{nwpResults.length} modèles couvrent le point
        </span>
      </div>

      {/* Coordinates */}
      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono bg-slate-800/50 rounded px-3 py-2">
        <span>Latitude: <span className="text-slate-200">{lat.toFixed(4)}°</span></span>
        <span>Longitude: <span className="text-slate-200">{lon.toFixed(4)}°</span></span>
      </div>

      {/* Mesh tier summary */}
      <div className="grid grid-cols-3 gap-2">
        <TierCard label="Fine < 5 km" count={fineCount} color="emerald" />
        <TierCard label="Moyenne 5-11" count={mediumCount} color="amber" />
        <TierCard label="Large > 11" count={largeCount} color="red" />
      </div>

      {/* Available models */}
      <div className="space-y-0.5">
        <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider mb-1">
          Modèles disponibles ({available.length})
        </div>
        {available.map((r) => (
          <ModelRow
            key={r.model.id}
            flag={r.model.providerFlag}
            name={r.model.name}
            family={FAMILY_LABELS[r.model.family] || r.model.family}
            resolution={`${r.model.resolution_km} km`}
            hours={r.model.forecast_hours}
            meshTier={getMeshTier(r.model.resolution_km)}
            inBounds={true}
          />
        ))}
      </div>

      {/* Unavailable models */}
      {unavailable.length > 0 && (
        <div className="space-y-0.5">
          <div className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mb-1">
            Hors couverture ({unavailable.length})
          </div>
          {unavailable.map((r) => (
            <ModelRow
              key={r.model.id}
              flag={r.model.providerFlag}
              name={r.model.name}
              family={FAMILY_LABELS[r.model.family] || r.model.family}
              resolution={`${r.model.resolution_km} km`}
              hours={r.model.forecast_hours}
              meshTier={getMeshTier(r.model.resolution_km)}
              inBounds={false}
              dimmed
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TierCard({ label, count, color }: { label: string; count: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    amber: 'text-amber-400 border-amber-500/30 bg-amber-500/5',
    red: 'text-red-400 border-red-500/30 bg-red-500/5',
  };

  return (
    <div className={`flex flex-col items-center py-2 rounded border ${colorMap[color]}`}>
      <span className="text-lg font-bold">{count}</span>
      <span className="text-[9px] uppercase tracking-wider text-slate-500 text-center px-1">{label}</span>
    </div>
  );
}
