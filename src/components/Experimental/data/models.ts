import { ModelDefinition } from '../types';

export const FAMILY_LABELS: Record<string, string> = {
  harmonie: 'HARMONIE',
  icon: 'ICON',
  ifs: 'IFS',
  arpege: 'ARPÈGE',
  gfs: 'GFS',
  hrrr: 'HRRR',
  nam: 'NAM',
  nbm: 'NBM',
  ukmo: 'UKMO',
  jma: 'JMA',
  gem: 'GEM',
  bom: 'ACCESS',
  cma: 'GRAPES',
  kma: 'KMA',
  aifs: 'AIFS',
  aigfs: 'AIGFS',
  hgefs: 'HGEFS',
};

export const PROVIDERS: Record<string, { name: string; flag: string; full: string }> = {
  dwd: { name: 'DWD', flag: '🇩🇪', full: 'Deutscher Wetterdienst' },
  noaa: { name: 'NOAA', flag: '🇺🇸', full: 'NOAA NCEP' },
  mf: { name: 'Météo-France', flag: '🇫🇷', full: 'Météo-France' },
  ecmwf: { name: 'ECMWF', flag: '🇪🇺', full: 'ECMWF' },
  ukmo: { name: 'UKMO', flag: '🇬🇧', full: 'UK Met Office' },
  jma: { name: 'JMA', flag: '🇯🇵', full: 'Japan Meteorological Agency' },
  cmc: { name: 'CMC', flag: '🇨🇦', full: 'Canadian Meteorological Centre' },
  metno: { name: 'MET Norway', flag: '🇳🇴', full: 'Norwegian Meteorological Institute' },
  knmi: { name: 'KNMI', flag: '🇳🇱', full: 'KNMI' },
  dmi: { name: 'DMI', flag: '🇩🇰', full: 'Danish Meteorological Institute' },
  arpae: { name: 'ItaliaMeteo', flag: '🇮🇹', full: 'ItaliaMeteo ARPAE' },
  mch: { name: 'MeteoSwiss', flag: '🇨🇭', full: 'MeteoSwiss' },
  bom: { name: 'BOM', flag: '🇦🇺', full: 'Bureau of Meteorology' },
  cma: { name: 'CMA', flag: '🇨🇳', full: 'China Meteorological Administration' },
  kma: { name: 'KMA', flag: '🇰🇷', full: 'Korea Meteorological Administration' },
};

/**
 * Individual models with their geographic bounding boxes and verified
 * Open-Meteo API names (`apiModel` — tested 2026-07-08 against
 * https://api.open-meteo.com/v1/forecast?models=...).
 *
 * bounds format: [[lat_min, lon_min], [lat_max, lon_max]] or null for global.
 * NBM is kept for reference display but flagged excludeFromAggregation
 * (statistical blend of GFS/HRRR/NAM → would double-count those sources).
 */
export const INDIVIDUAL_MODELS: ModelDefinition[] = [
  // ─── ICON family (DWD + regional ICON runs) ───────────────
  { id: 'icon_global', name: 'ICON Global', provider: 'dwd', providerFlag: '🇩🇪', apiModel: 'icon_global', resolution_km: 11, forecast_hours: 180, bounds: null, color: '#1E40AF', family: 'icon', isAI: false, isGlobal: true },
  { id: 'icon_eu', name: 'ICON-EU', provider: 'dwd', providerFlag: '🇩🇪', apiModel: 'icon_eu', resolution_km: 7, forecast_hours: 120, bounds: [[29.5, -23.5], [70.5, 62.5]], color: '#3B82F6', family: 'icon', isAI: false, isGlobal: false },
  { id: 'icon_d2', name: 'ICON-D2', provider: 'dwd', providerFlag: '🇩🇪', apiModel: 'icon_d2', resolution_km: 2, forecast_hours: 48, bounds: [[43.18, -3.94], [58.08, 20.34]], color: '#60A5FA', family: 'icon', isAI: false, isGlobal: false },
  { id: 'mch_ch1', name: 'ICON CH1', provider: 'mch', providerFlag: '🇨🇭', apiModel: 'meteoswiss_icon_ch1', resolution_km: 1, forecast_hours: 33, bounds: [[43.5, 2.0], [50.0, 16.5]], color: '#0EA5E9', family: 'icon', isAI: false, isGlobal: false },
  { id: 'mch_ch2', name: 'ICON CH2', provider: 'mch', providerFlag: '🇨🇭', apiModel: 'meteoswiss_icon_ch2', resolution_km: 2, forecast_hours: 120, bounds: [[43.5, 2.0], [50.0, 16.5]], color: '#38BDF8', family: 'icon', isAI: false, isGlobal: false },
  { id: 'icon_2i', name: 'ICON 2I', provider: 'arpae', providerFlag: '🇮🇹', apiModel: 'italia_meteo_arpae_icon_2i', resolution_km: 2, forecast_hours: 60, bounds: [[33.0, -3.0], [49.5, 23.0]], color: '#E11D48', family: 'icon', isAI: false, isGlobal: false },

  // ─── GFS / NOAA ────────────────────────────────────────────
  { id: 'gfs', name: 'GFS', provider: 'noaa', providerFlag: '🇺🇸', apiModel: 'gfs_global', resolution_km: 13, forecast_hours: 384, bounds: null, color: '#166534', family: 'gfs', isAI: false, isGlobal: true },
  { id: 'hrrr', name: 'HRRR', provider: 'noaa', providerFlag: '🇺🇸', apiModel: 'gfs_hrrr', resolution_km: 3, forecast_hours: 48, bounds: [[21.14, -134.1], [52.61, -60.92]], color: '#15803D', family: 'hrrr', isAI: false, isGlobal: false },
  { id: 'nam', name: 'NAM', provider: 'noaa', providerFlag: '🇺🇸', apiModel: 'ncep_nam_conus', resolution_km: 3, forecast_hours: 60, bounds: [[12.2, -152.9], [57.6, -49.4]], color: '#059669', family: 'nam', isAI: false, isGlobal: false },
  { id: 'nbm', name: 'NBM', provider: 'noaa', providerFlag: '🇺🇸', apiModel: 'ncep_nbm_conus', resolution_km: 3, forecast_hours: 264, bounds: [[20.19, -135.0], [52.61, -60.0]], color: '#86EFAC', family: 'nbm', isAI: false, isGlobal: false, excludeFromAggregation: true },

  // ─── Météo-France ──────────────────────────────────────────
  { id: 'arpege_europe', name: 'ARPEGE Europe', provider: 'mf', providerFlag: '🇫🇷', apiModel: 'arpege_europe', resolution_km: 11, forecast_hours: 96, bounds: [[20.0, -32.0], [72.0, 42.0]], color: '#DC2626', family: 'arpege', isAI: false, isGlobal: false },
  // AROME uses the HARMONIE-AROME code but is operated by MF with ARPEGE
  // boundary conditions — counted in the ARPEGE/MF family for slot diversity
  { id: 'arome_france', name: 'AROME France', provider: 'mf', providerFlag: '🇫🇷', apiModel: 'arome_france', resolution_km: 2.5, forecast_hours: 48, bounds: [[37.5, -12.0], [55.4, 16.0]], color: '#EF4444', family: 'arpege', isAI: false, isGlobal: false },
  { id: 'arome_france_hd', name: 'AROME France HD', provider: 'mf', providerFlag: '🇫🇷', apiModel: 'arome_france_hd', resolution_km: 1.5, forecast_hours: 48, bounds: [[37.5, -12.0], [55.4, 16.0]], color: '#FCA5A5', family: 'arpege', isAI: false, isGlobal: false },

  // ─── ECMWF ─────────────────────────────────────────────────
  { id: 'ecmwf_ifs025', name: 'IFS 0.25°', provider: 'ecmwf', providerFlag: '🇪🇺', apiModel: 'ecmwf_ifs025', resolution_km: 25, forecast_hours: 360, bounds: null, color: '#5B21B6', family: 'ifs', isAI: false, isGlobal: true },
  { id: 'ecmwf_ifs_hres', name: 'IFS HRES', provider: 'ecmwf', providerFlag: '🇪🇺', apiModel: 'ecmwf_ifs', resolution_km: 9, forecast_hours: 360, bounds: null, color: '#7C3AED', family: 'ifs', isAI: false, isGlobal: true },

  // ─── UKMO ──────────────────────────────────────────────────
  { id: 'ukmo_global', name: 'UKMO Global', provider: 'ukmo', providerFlag: '🇬🇧', apiModel: 'ukmo_global_deterministic_10km', resolution_km: 10, forecast_hours: 168, bounds: null, color: '#B45309', family: 'ukmo', isAI: false, isGlobal: true },
  { id: 'ukmo_ukv', name: 'UKMO UKV', provider: 'ukmo', providerFlag: '🇬🇧', apiModel: 'ukmo_uk_deterministic_2km', resolution_km: 2, forecast_hours: 48, bounds: [[44, -15], [63, 9]], color: '#F59E0B', family: 'ukmo', isAI: false, isGlobal: false },

  // ─── JMA ───────────────────────────────────────────────────
  { id: 'jma_gsm', name: 'JMA GSM', provider: 'jma', providerFlag: '🇯🇵', apiModel: 'jma_gsm', resolution_km: 55, forecast_hours: 264, bounds: null, color: '#9A3412', family: 'jma', isAI: false, isGlobal: true },
  { id: 'jma_msm', name: 'JMA MSM', provider: 'jma', providerFlag: '🇯🇵', apiModel: 'jma_msm', resolution_km: 5, forecast_hours: 96, bounds: [[22.4, 120.0], [47.6, 150.0]], color: '#FB923C', family: 'jma', isAI: false, isGlobal: false },

  // ─── GEM / Canada ──────────────────────────────────────────
  { id: 'gem_global', name: 'GEM Global', provider: 'cmc', providerFlag: '🇨🇦', apiModel: 'gem_global', resolution_km: 15, forecast_hours: 240, bounds: null, color: '#831843', family: 'gem', isAI: false, isGlobal: true },
  { id: 'gem_regional', name: 'GEM Regional', provider: 'cmc', providerFlag: '🇨🇦', apiModel: 'gem_regional', resolution_km: 10, forecast_hours: 84, bounds: [[10.0, -175.0], [85.0, 10.0]], color: '#DB2777', family: 'gem', isAI: false, isGlobal: false },
  { id: 'gem_hrdps', name: 'GEM HRDPS', provider: 'cmc', providerFlag: '🇨🇦', apiModel: 'gem_hrdps_continental', resolution_km: 2.5, forecast_hours: 48, bounds: [[38.0, -142.0], [75.0, -50.0]], color: '#EC4899', family: 'gem', isAI: false, isGlobal: false },
  { id: 'gem_hrdps_west', name: 'GEM HRDPS West', provider: 'cmc', providerFlag: '🇨🇦', apiModel: 'gem_hrdps_west', resolution_km: 1, forecast_hours: 48, bounds: [[44.0, -140.0], [62.0, -110.0]], color: '#F9A8D4', family: 'gem', isAI: false, isGlobal: false },

  // ─── HARMONIE regionals (Nordic + Benelux) ─────────────────
  { id: 'met_nordic', name: 'MET Nordic', provider: 'metno', providerFlag: '🇳🇴', apiModel: 'metno_nordic', resolution_km: 1, forecast_hours: 60, bounds: [[52.0, -2.0], [72.0, 36.0]], color: '#0891B2', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'knmi_nl', name: 'HARMONIE NL', provider: 'knmi', providerFlag: '🇳🇱', apiModel: 'knmi_harmonie_arome_netherlands', resolution_km: 2, forecast_hours: 60, bounds: [[49.0, -1.0], [57.0, 11.0]], color: '#0D9488', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'knmi_europe', name: 'HARMONIE EU', provider: 'knmi', providerFlag: '🇳🇱', apiModel: 'knmi_harmonie_arome_europe', resolution_km: 5.5, forecast_hours: 60, bounds: [[36.0, -30.0], [66.0, 45.0]], color: '#2DD4BF', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'dmi_harmonie', name: 'HARMONIE DINI', provider: 'dmi', providerFlag: '🇩🇰', apiModel: 'dmi_harmonie_arome_europe', resolution_km: 2, forecast_hours: 60, bounds: [[36.0, -30.0], [70.0, 45.0]], color: '#4338CA', family: 'harmonie', isAI: false, isGlobal: false },

  // ─── Asia / Oceania globals ────────────────────────────────
  { id: 'bom_access_g', name: 'ACCESS-G', provider: 'bom', providerFlag: '🇦🇺', apiModel: 'bom_access_global', resolution_km: 15, forecast_hours: 240, bounds: null, color: '#D97706', family: 'bom', isAI: false, isGlobal: true },
  { id: 'cma_grapes', name: 'GRAPES Global', provider: 'cma', providerFlag: '🇨🇳', apiModel: 'cma_grapes_global', resolution_km: 13, forecast_hours: 240, bounds: null, color: '#65A30D', family: 'cma', isAI: false, isGlobal: true },
  { id: 'kma_gdps', name: 'KMA GDPS', provider: 'kma', providerFlag: '🇰🇷', apiModel: 'kma_gdps', resolution_km: 12, forecast_hours: 288, bounds: null, color: '#7C3AED', family: 'kma', isAI: false, isGlobal: true },
  { id: 'kma_ldps', name: 'KMA LDPS', provider: 'kma', providerFlag: '🇰🇷', apiModel: 'kma_ldps', resolution_km: 1.5, forecast_hours: 48, bounds: [[32.0, 124.0], [44.0, 132.0]], color: '#C084FC', family: 'kma', isAI: false, isGlobal: false },

  // ─── AI / Hybrid (always fetched, aggregated separately) ───
  { id: 'ecmwf_aifs025', name: 'AIFS 0.25°', provider: 'ecmwf', providerFlag: '🇪🇺', apiModel: 'ecmwf_aifs025_single', resolution_km: 25, forecast_hours: 360, bounds: null, color: '#A78BFA', family: 'aifs', isAI: true, isGlobal: true },
  { id: 'gfs_aigfs', name: 'AIGFS', provider: 'noaa', providerFlag: '🇺🇸', apiModel: 'ncep_aigfs025', resolution_km: 25, forecast_hours: 384, bounds: null, color: '#22C55E', family: 'aigfs', isAI: true, isGlobal: true },
  { id: 'gfs_hgefs', name: 'HGEFS Ens. Mean', provider: 'noaa', providerFlag: '🇺🇸', apiModel: 'ncep_hgefs025_ensemble_mean', resolution_km: 25, forecast_hours: 240, bounds: null, color: '#4ADE80', family: 'hgefs', isAI: true, isGlobal: true },
];

/** The 3 AI models, always fetched regardless of location */
export const AI_MODEL_IDS = ['ecmwf_aifs025', 'gfs_aigfs', 'gfs_hgefs'];

export function getAIModels(): ModelDefinition[] {
  return INDIVIDUAL_MODELS.filter((m) => m.isAI);
}
