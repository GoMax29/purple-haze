import { BboxResult } from '../types';
import { FAMILY_LABELS } from '../data/models';
import ModelRow from './ModelRow';

interface StepBoundingBoxProps {
  results: BboxResult[];
  lat: number;
  lon: number;
}

export default function StepBoundingBox({ results, lat, lon }: StepBoundingBoxProps) {
  const available = results.filter((r) => r.inBounds);
  const unavailable = results.filter((r) => !r.inBounds);

  const shortCount = available.filter((r) => r.model.tier === 'short').length;
  const midCount = available.filter((r) => r.model.tier === 'mid').length;
  const longCount = available.filter((r) => r.model.tier === 'long').length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 1 — Bounding Box Resolution
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {available.length}/{results.length} modèles disponibles
        </span>
      </div>

      {/* Coordinates */}
      <div className="flex items-center gap-4 text-xs text-slate-400 font-mono bg-slate-800/50 rounded px-3 py-2">
        <span>Latitude: <span className="text-slate-200">{lat.toFixed(4)}°</span></span>
        <span>Longitude: <span className="text-slate-200">{lon.toFixed(4)}°</span></span>
      </div>

      {/* Tier summary */}
      <div className="grid grid-cols-3 gap-2">
        <TierCard label="Court" count={shortCount} color="emerald" />
        <TierCard label="Moyen" count={midCount} color="amber" />
        <TierCard label="Long" count={longCount} color="red" />
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
            tier={r.model.tier}
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
              tier={r.model.tier}
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
      <span className="text-[9px] uppercase tracking-wider text-slate-500">{label}</span>
    </div>
  );
}
