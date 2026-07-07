# PROJECT STATUS — Purple Haze

> Live state of the project. **Read this first** at session start. Update at session end.
> Summary only — for symbols use `CODE_INDEX.md`, for ideas use `docs/Milestone-Backlog-Ameliorations.md`.

## Snapshot
- **Product**: weather app (Brittany), multi-model blend of Open-Meteo → hourly (168 h), daily cards (4 time slots), "now" view. Surf mode stubbed.
- **Stack**: Next.js 14 (App Router), React 18, TypeScript + legacy JS, Zustand, TailwindCSS (migration in progress), in-memory cache TTL 15 min.
- **Scripts**: `npm run dev` · `build` · `start` · `lint` · `test` (jest) · `icons:generate`.

## File Map (high level)
| Path | Role |
|---|---|
| `src/app/` | App Router pages + `api/` routes (`forecast`, `fetchMeteoData`, `cache-stats`, `test-param/*`, `experimental/fetch`) |
| `src/components/legacy-ui/` | Active UI (NewHeader, WeatherSummary, NowSection, HourlySlotsSection, DailyCard, WeeklySection…) |
| `src/components/Experimental/` | **MVP** — isolated experimental weather engine (types, data, Coverage/, Algorithms/, Components/) |
| `src/components/ui/` | Generic widgets (PrecipitationWidget, SplashScreen) |
| `src/core/forecastCore.js` | Orchestration: assembly hourly + daily aggregation |
| `src/services/` | `forecastService`, `geocoding`, `localStorage`, `apiCallsCounter` |
| `src/lib/fetchMeteoData.js` | Open-Meteo I/O + cache |
| `src/store/weatherStore.ts` | Zustand store |
| `src/utils/` | pure helpers (dayNight, timezoneHelper, uvScale, riskDetection, wmo icons…) |
| `traitement/*.js` | per-variable processing (temperature, wind, precipitations, wmo, humidite) |
| `shared/*.js` | pure algorithms (gaussian_weighted, mean_trimmed, median, weighted_average, wmo_algorithms, precipitation_mm/%, wind_direction, time_interpretation_modes) |
| `config/*.json` | per-variable model+algorithm config |
| `docs/` | Documentation.md, Project.md (history), Milestone-Backlog-Ameliorations.md, index.json |

## Current Parameters
- Cache TTL: 15 min (raw + processed levels). Hourly horizon: 168 h (7 d).
- Temperature: `gaussian_weighted`, σ=1, centered on median. Wind: gaussian (speed/gust) + vector direction.
- Precipitation mm: gaussian in log space (`wet_threshold_mm=0.0`). PoP: `0.6·prop + 0.3·Dp + 0.1·wEcheance`.
- WMO: `smart_bary` (discrete barycenter over dominant severity group).
- Default location: Saint-Brieuc (store) / Paris (page fallback).

## Known Issues (see backlog for full list + decisions)
- 🔴 PoP & log-median mm under-weight convective showers/storms (danger signal minimized).
- 🔴 `smart_bary` RAIN group mixes clear (0-3) with rain (61-82) → barycenter physically meaningless.
- 🔴 `uvIndex=5` / `aqi=42` hardcoded in "now" view (`page.tsx`). UV only J0–J5 (air-quality API).
- 🔴 `config/forecast_strategy.json` is dead config; per-model `weight` is collected but ignored (no real weighting / no horizon switching).
- 🟠 O(n²) `findValueByDatetime`; each `traitement` module re-fetches; in-memory cache not durable (serverless).
- 🟠 Inline styles everywhere (Tailwind rule), `console.log` in pipeline, `hourlyData: any[]` boundary.
- 🔴 **Regionalization**: configs tuned for Europe. `fetchMeteoData` sends one hardcoded 11-model URL for ALL locations; regional models return null outside their domain. Outside Europe, **temperature 0–48h = ECMWF only** (single model); WMO short term = 2 globals; precipitation is OK (already uses `icon_seamless`/`ukmo_seamless`). See backlog §9.

## Decision Log
- **2026-06-21** — Full architecture/algorithm/UX audit produced (see backlog).
- **2026-06-28** — Created `docs/Milestone-Backlog-Ameliorations.md` (Top 10 + 8 sections).
- **2026-06-28** — AI-model decision for 7–14 d tendency: adopt **ECMWF AIFS Single**, **NCEP AIGFS**, **NCEP HGEFS mean**; reject GenCast (no turnkey Open-Meteo). To be shown as a separate low-res "tendency" strip. (Not yet implemented.)
- **2026-06-28** — Cursor rules refactored to token-lean: 3 always-on (`context`, `dev-workflow`, `project-structure`), 1 globs (`code-style`), 1 on-demand (`doc-and-logs`). Added `PROJECT_STATUS.md` + `CODE_INDEX.md`.
- **2026-06-28** — Worldwide model regionalization analysis (backlog §9). Decision: prefer **seamless models + best_match** (Open-Meteo internal routing, no polygons) over bbox/point-in-polygon. `model_domains.json` exists (bbox approach #2, ~20 entries to complete). Quick-win (temp/WMO seamless) doable now; full region-routing engine deferred until after UV/PoP/WMO core fixes.
- **2026-06-28** — Aggregation/fallback strategy report written: `docs/Strategie-Agregation-Fallback-Mondiale.md`. Key conclusions: `seamless` auto-includes fine LAMs (HRRR/HRDPS/MSM/AROME) worldwide → aggregate a global seamless backbone everywhere; `best_match` is NOT the fallback (PoP source + nowcast coherence + emergency only); switch *aggregation method+confidence* by effective member count, not to best_match. 5-phase migration plan + 6 decisions (D-1…D-6) pending. No code changed.
- **2026-07-02** — Model-coverage analysis tool built (`model-coverage.html`). Definitive algorithm designed: seamless-first, family dedup (HARMONIE/ICON counted as 1), per-variable aggregation (median for precip, circular mean for wind dir, vote for WMO). ARPEGE World removed (inconsistent). IFS HRES reclassified mid-term. Long-term split into Classic NWP + AI/Hybrid for user comparison at 7–14 d.
- **2026-07-04** — Multi-model analysis on 3 cities (Plomeur, Paris, New York). Key findings:
  - **AI models (AIFS, AIGFS)**: competitive at 0–5 d, smoothing bias at 5–10 d (AIFS -3 to -5°C on EU heat waves), mean-reversion at 10+ d (statistically more often right than persistent NWP extremes). HGEFS (hybrid) is the best compromise.
  - **ARPEGE World confirmed broken**: flat amplitude (50% below consensus), phase-shifted diurnal cycle, only 5 d range. Already removed (2026-07-02).
  - **QC filter decided**: implement **amplitude filter** (Layer 1) before aggregation: compare each model's diurnal amplitude to consensus over 24h windows; exclude if ratio < 0.5 for 2 consecutive windows. Catches structurally broken models (ARPEGE World, low-res globals on coastal sites). **Dynamic z-score filter (Layer 2) deferred**: too risky with ≤4 models at long range; winsorised mean handles moderate divergence adequately.
  - **7–14 d tendency strip design**: NOT daily cards. Smooth curve with confidence tube (winsorised mean ± k·σ, k scaling with horizon). Confidence bands: ~P20/P80 at J+7 (~60%), ~P25/P75 at J+10 (~50%), ~P30/P70 at J+14 (~40%).
- **2026-07-04** — Complete seamless model architecture finalized. **10 independent families**, 14 universal endpoints. See Model Architecture below.
- **2026-07-05** — MVP Experimental Weather Engine implemented (`src/components/Experimental/`, 23 files). Fully isolated from V1. Region-based smart fetch (Phase 1 + Phase 2 fallback). Tailwind config fixed (`./src/**/*`). API model names corrected (`ncep_aigfs025`, `ncep_hgefs025_ensemble_mean`). Tier logic fixed (seamless contributes to all tiers it covers).

## Model Architecture (2026-07-04)

**10 independent families** — each counts as 1 source for aggregation dedup.

| # | Family | Universal fetch endpoint(s) | Notes |
|---|--------|-----------------------------|-------|
| 1 | ECMWF | `ecmwf_ifs` (9km) + `ecmwf_ifs025` | No seamless. KNMI/DMI/Norway/GeoSphere seamless share ECMWF backend → same family, useful only for local LAM within their domain |
| 2 | ICON/DWD | `dwd_icon_seamless` | D2→EU→Global. MeteoSwiss (CH1 1km) & ItaliaMeteo (2I 2km) = same family, regional bonus only |
| 3 | GFS/NCEP | `ncep_gfs_seamless` | HRRR→GFS Global |
| 4 | GEM/Canada | `gem_seamless` | HRDPS→Regional→Global |
| 5 | Météo-France | `meteofrance_seamless` | AROME 1.3km→ARPEGE Europe. No global fallback (~96h max) |
| 6 | UKMO | `ukmo_seamless` | UKV 2km→Global 10km |
| 7 | JMA | `jma_seamless` | MSM 5km→GSM |
| 8 | KMA | `kma_seamless` | LDPS 1.5km→GDPS |
| 9 | CMA | `cma_grapes_global` | Standalone global |
| 10 | BOM | `bom_access_global` | Standalone global |

**AI/Hybrid (branches of families 1 & 3)**: `ecmwf_aifs025_single`, `ncep_aigfs025`, `ncep_hgefs025_ensemble_mean`.

**Total universal fetch: 14 endpoints.** Regional seamless (KNMI/DMI/Norway/GeoSphere/MeteoSwiss) deferred to per-country optimization.

### QC pipeline (before aggregation)
1. **Amplitude filter** (Layer 1): diurnal amplitude ratio < 0.5 for 2×24h → model excluded for entire forecast. Catches resolution mismatches.
2. Winsorised mean (20%) on remaining qualified models.
3. **Dynamic z-score filter (Layer 2)**: DEFERRED — too risky with ≤4 models at long range.

## MVP Experimental Weather Engine (2026-07-05)

Fully isolated MVP panel added below Daily Cards. Does NOT touch V1. Lives in `src/components/Experimental/` (23 files) + 1 API route (`src/app/api/experimental/fetch/route.ts`). Single V1 change: 1 import + 1 conditional component in `src/app/page.tsx`.

**Pipeline (7 steps, runs when panel opened):**
1. Bbox resolution (35 individual models, informational)
2. Seamless fetch — **region-based smart fetch**: Phase 1 = region-matched + universal endpoints; Phase 2 = fallback if < 4 families
3. Family dedup (1 voice/family, finest resolution kept)
4. Tier assignment (a seamless contributes to ALL tiers it covers: 0 → forecast_hours)
5. Algorithm selection (N>=4 → Winsorised Mean, N=2-3 → Weighted Mean, N=1 → Single)
6. Outlier QC (spread vs median consensus, threshold 4°C over 48h)
7. Aggregation + charts (recharts: J1-J7 hourly, J7-J10 3x/day, J10-J16 trend band + AI curve)

**Region-based fetch logic** (`getRegion(lat, lon)` from model-coverage.html):
- Universal (always): `gfs_seamless`, `ecmwf_ifs`, `ecmwf_ifs025` + AI endpoints
- Europe: + `icon_seamless`, `meteofrance_seamless`, `ukmo_seamless`, `gem_seamless`
- Americas: + `gem_seamless`, `icon_seamless`
- Asia: + `jma_seamless`, `kma_seamless`, `cma_grapes_global`, `icon_seamless`
- Oceania: + `bom_access_global`, `icon_seamless`

**API names confirmed**: `ncep_aigfs025`, `ncep_hgefs025_ensemble_mean` (validated by user test).

## Agent Context
- Last prompt: Analysis + 6-item fix/feature session on Experimental Weather Engine.
- Active decisions: all prior algorithm decisions remain valid. MVP is a debug/comparison tool only; V1 pipeline unchanged.
- **What changed this session (cumulative)**:
  - Fixed AIFS API name (`ecmwf_aifs025` → `ecmwf_aifs025_single`) — confirmed via API test
  - Fixed UKMO tier: `mid` → `short` (UKV 2km covers Saint-Brieuc)
  - `ModelSelector.ts`: tier-based eligibility, AI excluded from short/mid, MAX_MODELS_PER_TIER=5, fallback caps at MIN_FAMILIES
  - Propagated family dedup to aggregation (steps 6–7 use deduplicated models only)
  - Fixed `OutlierFilter.ts`: meanTemp on 48h window
  - **UI overhaul** (prev session): new `PipelineSummary`, `DailyForecastTable`, `TemperatureChart`. Mobile-first.
  - **2026-07-07 fixes**:
    - `route.ts`: Added `forecast_days=16` (was returning only 7d), returns `times[]` array
    - `types.ts` + `FetchTester.ts`: propagated `times?: string[]` through FetchResult pipeline
    - `WinsorizedMean.ts`: added `aggregateTemperatureByTier(short,mid,long,maxH,times?)` + `aggregateTemperatureRange()` — NWP consensus now respects tier boundaries (GFS only from H120, IFS from H48)
    - `ExperimentalPanel.tsx`: per-tier NWP aggregation; `classicModelLines` = union of all tier models
    - `TemperatureChart.tsx`: numeric X axis (hours), per-model tier clipping, real datetime in tooltip (ISO → "Lun 7 juil. 14h00"), AI overlay removed from main chart
    - **NEW `AITemperatureChart.tsx`**: separate AI chart (J7–J14) with individual AIFS/AIGFS/HGEFS lines + AI consensus + NWP long-term reference line
    - `DailyForecastTable.tsx`: toggleable AI min/max for J8–J14 daily cards (button "▼ IA J8-J14")
- Next steps: (1) test in browser; (2) UV real + J6–J7 fallback; (3) PoP rework; (4) WMO fix; (5) V1 migration.
- Blockers: none. Nothing committed.
