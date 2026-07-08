# CODE INDEX — Purple Haze

> **Grep-only.** Find a symbol → its file + line. Do NOT read this file in full; `grep` the symbol name.
> Update when exports are added/removed/renamed or line numbers shift > ±5 (see `doc-and-logs` rule).
> Line numbers are approximate; UI files expose only a default-export React component (not all listed).

## Core & orchestration

### src/core/forecastCore.js
| Line | Export | Kind |
|---|---|---|
| 76 | `getProcessedCacheStats()` | function |
| 100 | `clearProcessedCache()` | function |
| 108 | `getAllCacheStats()` | function |
| 187 | `buildForecastFromCoordinates(lat, lon)` | const (main entry) |
| 504 | `generateDailyCardData(hourlyData, dailyData)` | function |
| 563 | default → `buildForecastFromCoordinates` | default |
| 566 | `buildForecastFromHourly()` | const (DEPRECATED, throws) |

### src/lib/fetchMeteoData.js
| Line | Export | Kind |
|---|---|---|
| 284 | `fetchCurrentWeather(lat, lon, options)` | function |
| 391 | `fetchMeteoData(lat, lon, options)` | function |
| 528 | `clearCache()` | function |
| 538 | `getCacheStats()` | function |
| 569 | `getPredefinedSpots()` | function |
| 578 | `getSpotCoordinates(spotId)` | function |
| 590 | `fetchMeteoDataBySpot(spotId, options)` | function |
| 609 | `fetchCurrentWeatherBySpot(spotId, options)` | function |
| 627 | default `handler(req, res)` | default |

## traitement/ (per-variable processing)
| File | Export (line) |
|---|---|
| `traitement/temperature.js` | `traiterTemperature` (12), `getTemperatureStats` (110), default (148) |
| `traitement/temperature_apparente.js` | `traiterTemperatureApparente` (12), `getTemperatureApparenteStats` (114), default (152) |
| `traitement/humidite.js` | `traiterHumidite` (12), `getHumiditeStats` (110), default (148) |
| `traitement/wind.js` | `traiterVent` (15), `getVentStats` (125), default (149) |
| `traitement/precipitations.js` | `traiterPrecipitations` (18) |
| `traitement/wmo.js` | `traiterWmo` (16), `getWmoStats` (205), default (252) |
| `traitement/time_slots_smart_bary.js` | `aggregateTimeSlots` (92), `smartBaryWithRobustRisks` (271) |

## shared/ (pure algorithms)

### shared/wmo_algorithms.js
| Line | Export | Kind |
|---|---|---|
| 1204 | `wmoAlgorithms` (mode, severityGroups, bary, smart_bary…) | const map |
| 1223 | `isValidAlgorithm(name)` | function |
| 1231 | `getAvailableAlgorithms()` | function |

### shared/ (stats)
| File | Export (line) |
|---|---|
| `shared/gaussian_weighted.js` | `gaussian_weighted` (9), `adaptiveGaussianWeighted` (67), `robustGaussianWeighted` (102), `mixtureGaussianWeighted` (147), `constrainedGaussianWeighted` (226), `gaussianPDF` (278), default (285) |
| `shared/mean_trimmed.js` | `mean_trimmed` (9), `adaptiveTrimmedMean` (72), `winsorizedMean` (124), `robustTrimmedMean` (185), default (230) |
| `shared/median.js` | `median` (7), `weightedMedian` (42), `quartiles` (95), `medianAbsoluteDeviation` (149), default (169) |
| `shared/weighted_average.js` | `weighted_average` (8), `weightedAverage` (60), `normalizedWeightedAverage` (117), `adaptiveWeightedAverage` (158), `robustWeightedAverage` (225), `weightedStatistics` (281), default (323) |
| `shared/precipitation_mm.algorithms.js` | `aggregatePrecipMm` (20) |
| `shared/precipitation_%.algorithms.js` | `computePoP` (5) |
| `shared/wind_direction.algorithms.js` | `aggregateWindDirectionGaussian` (12), `meanVector` (69), `angularDifferenceDeg` (86), `normalizeDeg` (95), default (101) |
| `shared/time_interpretation_modes.js` | `TIME_INTERPRETATION_MODES` (14), `getTimeInterpretationMode` (38), `isPrecedingHourParameter` (47), `getRelevantHourIndices` (59), `getTimeRulesSummary` (110) |

## src/services/
| File | Export (line) |
|---|---|
| `forecastService.ts` | `fetchForecastData` (36), `fetchFullForecastData` (63), `fetchCacheStats` (83) |
| `geocoding.ts` | `searchLocations` (66), `searchLocationsLegacy` (114), `reverseGeocode` (217) |
| `localStorage.ts` | `FavoritesService` (31), `RecentSearchesService` (109), `SelectedLocationService` (160), `clearAllData` (201), `forceMigration` (210) |
| `apiCallsCounter.ts` | `apiCallsCounter` (195), `useApiCallsStats` (198) |

## src/store/
| File | Export (line) |
|---|---|
| `weatherStore.ts` | `useWeatherStore` (67) |

## src/utils/ (pure helpers)
| File | Export (line) |
|---|---|
| `dayNight.ts` | `isHourInRange` (29), `getDayNightStateAt` (44), `getVariantForEveningSlot` (70), `computeSlotVariant` (93) |
| `timezoneHelper.ts` | `formatInTimezone` (12), `getCurrentTimeInTimezone` (40), `getCurrentDateInTimezone` (52), `getCurrentDateStringInTimezone` (80), `getCurrentHourInTimezone` (99), `formatHourSlot` (123), `isCurrentHourInTimezone` (149), `extractTimezoneInfo` (178), `formatFullDateTime` (192) |
| `uvScale.ts` | `UV_SCALE` (13), `getUVColor` (24), `getUVLabel` (42) |
| `riskDetection.ts` | `getRiskFromWMO` (39), `analyzeSlotRisk` (63), `getRiskBadgeColor` (129) |
| `windDirection.ts` | `degreesToCompass` (6), `degreesToCompassWithArrow` (25) |
| `temperatureColors.ts` | `getTemperatureColor` (6), `getContrastTextColor` (26) |
| `dynamicBackground.ts` | `getCurrentBackgroundTheme` (18), `getBackgroundThemeData` (55), `getDynamicBackground` (83), `getSimpleDynamicBackground` (103) |
| `dateFormat.ts` | `formatDailyCardDate` (14), `isDateToday` (90), `isDateTomorrow` (108) |
| `dayUtils.ts` | `DAY_INITIALS` (8), `getDayInitial` (30), `formatDayFromDate` (37) |
| `wmoFinalIcons.ts` | `getWmoFinalIconPath` (8), `getWeatherIcon` (89) |
| `wmoIcons.ts` | `WMO_EMOJIS` (8), `getWMOIcon` (49), `getTimeSlotIcons` (56) |
| `wmoIconMapping.js` | `WMO_ICON_MAPPING` (6), `WMO_DESCRIPTIONS` (64), `SEVERITY_COLORS` (105), `getWmoIcon` (122), `getWmoDescription` (131), `getWmoSeverity` (140), `getWmoSeverityColor` (167) |

## src/app/api/ (routes — all `GET`/`POST` handlers)
`forecast/route.js` · `fetchMeteoData/route.js` · `cache-stats/route.js` (GET/POST/PUT/DELETE) · `api-stats/route.js` (GET/POST) · `config/wmo/route.js` · `test-meteo/route.ts` (GET/POST) · `test-param/{temperature,apparent-temperature,humidite,precipitation,wind,wmo,wmo/agg,final-params,results_all}/route.js` · `surf/spots.ts` · **`experimental/fetch/route.ts`** (POST — MVP individual-model fetch, generic `{id, apiModel}` payload).

## src/components/Experimental/ (MVP v2 — isolated, individual-model pipeline, multi-variable)
| File | Key Exports |
|------|-------------|
| `types.ts` | `MeshTier`, `HOURLY_VARS` (7 series), `HourlySeriesKey`, `WeatherVariable`, `ModelDefinition` (+`apiModel`), `BboxResult`, `ActiveRange`, `FetchResult` (`series` record), `DedupExclusion`, `CascadeGroup`, `TierSelection`, `AggregatedPoint` (+`wetFraction`), `VariableAggregations`, `TrendPoint` |
| `index.ts` | re-exports `ExperimentalPanel` |
| `ExperimentalPanel.tsx` | default `ExperimentalPanel` (orchestrator + 5 variable tabs: Température/Précip./Humidité/Vent/Ciel) |
| `data/models.ts` | `INDIVIDUAL_MODELS` (30, verified `apiModel` names), `AI_MODEL_IDS`, `getAIModels()`, `FAMILY_LABELS`, `PROVIDERS` |
| `data/families.ts` | `getRegion()`, `getMeshTier()`, `RESOLUTION_THRESHOLDS`, `MESH_TIER_CONFIG`, `GLOBAL_PASS_MODEL_IDS`, `REGION_PROVIDERS`, `MAX_MODELS_PER_TIER`, `MIN_POOL_SIZE`, `GAUSSIAN_SIGMA_MIN_TEMP`, `WINSORIZE_TRIM_PERCENT` |
| `Coverage/BoundingBoxResolver.ts` | `resolveBoundingBoxes()`, `getModelsInBounds()`, `countByMeshTier()` |
| `Coverage/ResolutionClassifier.ts` | `classifyByResolution()` (fine/medium/large) |
| `Coverage/RegionalFilter.ts` | `filterByRegion()` (medium+large only, global-pass exempt) |
| `Coverage/ModelDeduplicator.ts` | `applyExplicitDedup()` (AROME/KNMI rules), `detectCascades()` (intra-provider "seamless maison") |
| `Coverage/TierCapper.ts` | `capModelsPerTier()` (5 slots, cascade = 1 slot, family diversity first) |
| `Coverage/FetchTester.ts` | `fetchIndividualModels()`, `validateAndFallback()` (KNMI EU fallback if DINI fails) |
| `Algorithms/Aggregation.ts` | `aggregateProgressive(tiered, maxH, times, {key, strategy, sigmaFloor, clamp, withWetFraction})`, `aggregateAI()`, `poolFetchesAt()` (shared pool logic), `winsorizedMean()`, `robustGaussianMean()`, `median()`, `valueAt()` |
| `Algorithms/VariableAggregators.ts` | `aggregateAllVariables()` (7 series), `WMO_GROUPS`, `wmoGroupOf()` — precip median+wetFraction, wind dir vector mean (speed-weighted), WMO severity-group vote |
| `Algorithms/AlgorithmPicker.ts` | `describeAlgorithm()` (informational) |
| `Components/tabs/*.tsx` | `TemperatureTab`, `PrecipitationTab`, `HumidityTab`, `WindTab`, `SkyTab`, `ExplainerToggle` — each: daily J1–J14 recap + adapted chart + educational walkthrough |
| `Components/charts/*.tsx` | `ConsensusChart` (generic), `PrecipitationChart` (median bars + wet%), `WindChart` (speed/gusts + direction tooltip), `WmoDailyStrip` (daily vote icons), `chartUtils` (`formatDatetime`, `directionArrow/Label`, `downsampleForChart`) |
| `Components/*.tsx` | `PipelineSummary`, `DailyForecastTable` (temp, AI toggle J8+), `DailyVariableTable` (+`buildDayHeaders`), `AlgorithmExplainer` (per-variable educational), `TemperatureChart`, `AITemperatureChart`, `StepBoundingBox`, `StepModelSelection`, `StepFamilyDedup` (=`StepDedupCascade`), `StepAlgorithmChoice`, `StepFetchResults`, `TrendChart` + `StepAggregation` (orphans), `StatusBadge`, `ModelRow` |

## src/components/ (active UI — default export each)
- `ui/`: `PrecipitationWidget`, `SplashScreen`.
- `legacy-ui/`: `NewHeader`, `WeatherSummary`, `NowSection`, `HourlySlotsSection`, `HourlySection`, `HourlyScroll`, `HourlyCard`, `DailyCard`, `WeeklySection`, `DayHeader`, `DayLegend`, `WeatherLegend`, `PrecipitationBar`, `ToggleSimpleDetail`, `LocationSearchModal`, `CitiesButtons`, `Header`, `ActivityWidget`, `WeatherActivityWidget`.
- `shared/uiFlags.ts`: `USE_EMOJI_ICONS` (4).
