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
- **2026-07-14** — Fetch pipeline optimization: multi-model URLs per tier (4 requests vs ~16), server-side cache per tier (TTL: fine/medium 90min, large 3h, AI 6h, nowcast 5min reserved), concurrency semaphore (10 max, eliminates 429 rate-limit errors). Per-variable pool mode: strict (temp/wind/humidity — finest tier only, no expansion) vs expansion (precip/WMO — needs ≥3 for vote). V1 fetch disabled in local dev via env var. Bbox buffer removed (unnecessary with multi-model URL — null models cost nothing).
- **2026-07-05** — MVP Experimental Weather Engine implemented (`src/components/Experimental/`, 23 files). Fully isolated from V1. Region-based smart fetch (Phase 1 + Phase 2 fallback). Tailwind config fixed (`./src/**/*`). API model names corrected (`ncep_aigfs025`, `ncep_hgefs025_ensemble_mean`). Tier logic fixed (seamless contributes to all tiers it covers).
- **2026-07-08 (3)** — **Engine v2 charts: individual model lines + tooltip readability**. All variable charts (humidity, precip, wind) now show individual NWP model curves at low opacity alongside consensus. `ensureReadableColor()` brightens dark hex colors for tooltip readability. WMO daily strip now shows per-model breakdown on hover. Analysis of Plomeur capture: all models visible on temperature chart is by design (transparency) — progressive pool only affects aggregation, not display. HGEFS integration in NWP pool at J7+ considered but deferred (would mix paradigms, to be evaluated).
- **2026-07-08 (2)** — **Engine v2 extended to all variables** with tabbed UI. One Open-Meteo request per model now fetches 7 hourly series (temp, RH, precip, weather_code, wind speed/gusts/direction). Per-variable aggregation on the same progressive pool: temp/humidity/wind = winsorized-or-gaussian (sigma floors: RH 15 %, speed 10, gusts 15 km/h; RH clamped 0-100); **precip = median + wetFraction** (share of models > 0.1 mm, probability proxy); **wind direction = vector mean weighted by speed**; **WMO = severity-group vote** (7 groups, tie → more severe, representative = median code of winning group; daily strip: significant group ≥ 3 h wins the day). 5 tabs (Température/Précip./Humidité/Vent/Ciel), each with J1-J14 recap + adapted chart + educational "Comment ça marche ?" walkthrough (per-variable method, why, limits, real-hour example). AI overlay stays temperature-only. Functional test passed on the 3 reference cities.
- **2026-07-08** — **Experimental Engine v2: seamless abandoned** (a seamless can silently return a coarser member — e.g. `icon_seamless` = ICON-EU 7 km at H0 for Finistère since ICON-D2 stops at lon −3.94°). New individual-model pipeline: bbox pre-filter → explicit dedup (AROME→HD, KNMI EU→DMI DINI w/ fetch fallback) → mesh classification (fine <5 / medium 5–11 incl / large >11 km) → regional filter for medium+large (global pass: GFS, IFS HRES+0.25°, ICON Global, UKMO Global, 3 AI) → intra-provider cascades = 1 slot (CH1→CH2, ICON-EU→ICON Global) → cap 5/tier (family diversity first) → per-hour progressive pool (fine → fine+med → med → med+large) → winsorized 20% (N≥4) / **robust gaussian MAD-sigma floor 5 °C** (N=2-3; [20,21,30]→21.4). Spread QC filter removed (resolution classing + gaussian replace it). NBM excluded (statistical blend). AI unchanged (3 models, separate chart). All `apiModel` names verified against Open-Meteo. Functional test passed on Quimper (3F/5M/2L), Paris (6F incl. CH1→CH2/5M/2L), New York (3F/4M/3L).

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

## MVP Experimental Weather Engine v2 (2026-07-08)

Fully isolated MVP panel added below Daily Cards. Does NOT touch V1. Lives in `src/components/Experimental/` + 1 API route (`src/app/api/experimental/fetch/route.ts`, generic — unchanged). Single V1 change: 1 import + 1 conditional component in `src/app/page.tsx`.

**Pipeline v2 (runs when panel opened):**
1. Bbox resolution (30 individual models with verified `apiModel` names)
2. Explicit dedup: AROME dropped if AROME HD present; KNMI HARMONIE EU dropped if DMI DINI present (reinstated if DINI fetch fails)
3. Mesh classification: fine < 5 km · medium 5–11 km incl. · large > 11 km (AI + NBM excluded)
4. Regional filter (medium+large only; fine self-filters via bbox). Global pass: GFS, IFS HRES, IFS 0.25°, ICON Global, UKMO Global + 3 AI
5. Intra-provider cascades ("seamless maison", 1 slot): ICON CH1[H0-33]→CH2[H33-120] (MeteoSwiss), ICON-EU[H0-120]→ICON Global[H120-180] (DWD)
6. Cap 5 slots/tier (1 per family finest-first, then finest resolution)
7. **Multi-model fetch by tier** (4 requests: fine+medium+large+AI) via `models=m1,m2,...` per tier. Server-side cache (TTL: fine/medium 90 min, large 3h, AI 6h). Concurrency semaphore (max 10). Fallback to individual fetches on failure. `forecast_hours` per tier: fine=72, medium=180, large=384.
8. **Per-variable pool selection** (2026-07-14):
   - `strict` (temperature, humidity, wind speed/gusts/direction): use finest available tier as-is (even 1 model). No expansion across tiers. Prioritises spatial resolution.
   - `expansion` (precipitation, WMO): progressive pool with MIN_POOL_SIZE=3, merges tiers. Needs multi-model vote/probability.
   - Methods: winsorized 20% (N≥4), robust gaussian MAD-sigma floor (N=2-3), raw (N=1).
9. AI consensus separate (3 models, full range, dedicated chart J7–J14 vs NWP reference)

**Multi-variable (2026-07-08 (2)):** one request per model fetches `HOURLY_VARS` (7 series). `aggregateAllVariables()` produces `VariableAggregations` (temperature, humidity, precipitation, windSpeed, windGusts, windDirection, wmo). UI = 5 tabs, each: daily J1-J14 recap (`DailyVariableTable` / `WmoDailyStrip`) + adapted chart (`ConsensusChart`, `PrecipitationChart`, `WindChart`) + `AlgorithmExplainer` educational toggle. Note: `arome_france_hd` returns null `weather_code` — WMO pool self-adjusts (per-key validity in `poolFetchesAt`).

**Verified selections (2026-07-08 test):**
- Quimper: fine = AROME HD + UKV + DMI DINI (ICON-D2 out of bbox at lon −4.1)
- Paris: fine = CH1→CH2 + AROME HD + ICON-D2 + UKV + DINI (ICON 2I capped out)
- New York: fine = HRDPS + HRRR + NAM; medium gets ICON Global + UKMO Global via global pass

**API names verified**: `gfs_global`, `gfs_hrrr`, `ncep_nam_conus`, `ncep_nbm_conus`, `ukmo_global_deterministic_10km`, `ukmo_uk_deterministic_2km`, `meteoswiss_icon_ch1/ch2`, `italia_meteo_arpae_icon_2i`, `knmi_harmonie_arome_europe/netherlands`, `dmi_harmonie_arome_europe`, `metno_nordic`, `gem_hrdps_continental`, `kma_ldps` (endpoint OK but returns null — kept, self-excludes via no_data).

## Agent Context
- Last prompt: fetch pipeline optimization + per-variable pool strategy.
- Active decisions: strict pool (temp/wind/humidity) vs expansion (precip/WMO); multi-model URLs per tier; server-side cache with TTL aligned on model run frequency; V1 disabled in local dev.
- **What changed this session (2026-07-14)**:
  - `route.ts` rewritten: multi-model URLs per tier (4 calls vs 16), server-side Map cache with tier-based TTL (90min/90min/3h/6h + 5min nowcast placeholder), semaphore max 10 concurrent, `forecast_hours` per tier, fallback-to-individual on failure, GET debug endpoint
  - `FetchTester.ts` refactored: `fetchByTier(lat, lon, tierGroups[])` replaces `fetchIndividualModels`; `FORECAST_HOURS_BY_TIER` config exported
  - `ExperimentalPanel.tsx`: calls `fetchByTier` with 4 TierGroup (fine/medium/large/ai)
  - `Aggregation.ts`: new `PoolMode` type (`'strict'`|`'expansion'`); `poolFetchesAt()` accepts mode param; strict = finest tier with ≥1 model, no cross-tier merging
  - `VariableAggregators.ts`: temp/humidity/windSpeed/windGusts use `poolMode:'strict'`; windDirection uses strict; precipitation/WMO keep `'expansion'`
  - `page.tsx`: V1 fetch guarded by `NEXT_PUBLIC_DISABLE_V1_FETCH` env var
  - `.env.local` created (gitignored): `NEXT_PUBLIC_DISABLE_V1_FETCH=true`
- Next steps: (1) Test multi-model parsing in production; (2) UV real + J6–J7 fallback; (3) `start_date`/`end_date` optimization for large tier (optional); (4) PoP rework in V1; (5) V1 migration of v2 engine.
- Blockers: none.
