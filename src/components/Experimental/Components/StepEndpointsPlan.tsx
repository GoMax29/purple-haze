import { SeamlessEndpoint } from '../types';
import { Region, AI_ENDPOINT_IDS } from '../data/families';

interface StepEndpointsPlanProps {
  region: Region | string;
  phase1Endpoints: SeamlessEndpoint[];
  allEndpoints: SeamlessEndpoint[];
}

const REGION_LABELS: Record<string, string> = {
  europe: '🇪🇺 Europe',
  americas: '🌎 Amériques',
  asia: '🌏 Asie',
  oceania: '🌏 Océanie',
  other: '🌍 Autre',
};

const TIER_LABELS: Record<string, { label: string; color: string }> = {
  short: { label: 'CT', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  mid: { label: 'MT', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  long: { label: 'LT', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

export default function StepEndpointsPlan({ region, phase1Endpoints, allEndpoints }: StepEndpointsPlanProps) {
  const phase2Endpoints = allEndpoints.filter(
    (ep) => !phase1Endpoints.some((p1) => p1.id === ep.id)
  );

  const nwpPhase1 = phase1Endpoints.filter((ep) => !AI_ENDPOINT_IDS.includes(ep.id));
  const aiPhase1 = phase1Endpoints.filter((ep) => AI_ENDPOINT_IDS.includes(ep.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
          Étape 1 — Plan de fetch
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          {phase1Endpoints.length} Phase 1 · {phase2Endpoints.length} Phase 2
        </span>
      </div>

      {/* Region badge */}
      <div className="flex items-center gap-3 text-xs">
        <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-semibold">
          Région : {REGION_LABELS[region] || region}
        </span>
        <span className="text-slate-500 text-[10px]">
          Les endpoints universels + régionaux seront fetchés en Phase 1
        </span>
      </div>

      {/* Phase 1: NWP */}
      <div className="space-y-1">
        <div className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider mb-1">
          Phase 1 — NWP classique ({nwpPhase1.length})
        </div>
        <div className="grid gap-0.5">
          {nwpPhase1.map((ep) => (
            <EndpointRow key={ep.id} endpoint={ep} />
          ))}
        </div>
      </div>

      {/* Phase 1: AI */}
      {aiPhase1.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-pink-400 font-semibold uppercase tracking-wider mb-1">
            Phase 1 — IA / Hybride ({aiPhase1.length})
          </div>
          <div className="grid gap-0.5">
            {aiPhase1.map((ep) => (
              <EndpointRow key={ep.id} endpoint={ep} isAI />
            ))}
          </div>
        </div>
      )}

      {/* Phase 2 */}
      {phase2Endpoints.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider mb-1">
            Phase 2 — Fallback si &lt; 4 familles ({phase2Endpoints.length})
          </div>
          <div className="grid gap-0.5 opacity-50">
            {phase2Endpoints.map((ep) => (
              <EndpointRow key={ep.id} endpoint={ep} dimmed />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EndpointRow({ endpoint, isAI, dimmed }: { endpoint: SeamlessEndpoint; isAI?: boolean; dimmed?: boolean }) {
  const tierInfo = TIER_LABELS[endpoint.tier] || TIER_LABELS.long;
  return (
    <div className={`flex items-center gap-2 py-1 px-3 rounded bg-slate-800/30 border border-slate-700/20 ${dimmed ? 'opacity-60' : ''}`}>
      <span className="text-sm w-6 text-center">{endpoint.providerFlag}</span>
      <span className={`text-[11px] flex-1 ${isAI ? 'text-pink-200' : 'text-slate-200'}`}>
        {endpoint.name}
      </span>
      <span className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${tierInfo.color}`}>
        {tierInfo.label}
      </span>
      <span className="text-[9px] text-slate-500 font-mono w-12 text-right">
        {endpoint.resolution_km} km
      </span>
      <span className="text-[9px] text-slate-600 font-mono w-12 text-right">
        {endpoint.forecast_hours}h
      </span>
    </div>
  );
}
