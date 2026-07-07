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
  graphcast: 'GraphCast',
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
 * 35 individual models with their geographic bounding boxes.
 * Used for Step 1 (bbox resolution) — informational display showing
 * which models theoretically cover the selected point.
 *
 * Data extracted from model-coverage.html reference tool.
 * bounds format: [[lat_min, lon_min], [lat_max, lon_max]] or null for global.
 */
export const INDIVIDUAL_MODELS: ModelDefinition[] = [
  { id: 'icon_global', name: 'ICON Global', provider: 'dwd', providerFlag: '🇩🇪', resolution_km: 11, forecast_hours: 180, tier: 'long', bounds: null, color: '#1E40AF', region: 'europe', family: 'icon', isAI: false, isGlobal: true },
  { id: 'icon_eu', name: 'ICON-EU', provider: 'dwd', providerFlag: '🇩🇪', resolution_km: 7, forecast_hours: 120, tier: 'mid', bounds: [[29.5, -23.5], [70.5, 62.5]], color: '#3B82F6', family: 'icon', isAI: false, isGlobal: false },
  { id: 'icon_d2', name: 'ICON-D2', provider: 'dwd', providerFlag: '🇩🇪', resolution_km: 2, forecast_hours: 48, tier: 'short', bounds: [[43.18, -3.94], [58.08, 20.34]], color: '#60A5FA', family: 'icon', isAI: false, isGlobal: false },
  { id: 'gfs', name: 'GFS', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 13, forecast_hours: 384, tier: 'long', bounds: null, color: '#166534', region: 'universal', family: 'gfs', isAI: false, isGlobal: true },
  { id: 'gfs_graphcast', name: 'GFS GraphCast', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 25, forecast_hours: 240, tier: 'long', bounds: null, color: '#16A34A', family: 'graphcast', isAI: true, isGlobal: true },
  { id: 'gfs_aigfs', name: 'AIGFS', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 25, forecast_hours: 384, tier: 'long', bounds: null, color: '#22C55E', family: 'aigfs', isAI: true, isGlobal: true },
  { id: 'gfs_hgefs', name: 'HGEFS Ens. Mean', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 25, forecast_hours: 240, tier: 'long', bounds: null, color: '#4ADE80', family: 'hgefs', isAI: true, isGlobal: true },
  { id: 'hrrr', name: 'HRRR', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 3, forecast_hours: 48, tier: 'short', bounds: [[21.14, -134.1], [52.61, -60.92]], color: '#15803D', family: 'hrrr', isAI: false, isGlobal: false },
  { id: 'nam', name: 'NAM', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 3, forecast_hours: 60, tier: 'short', bounds: [[12.2, -152.9], [57.6, -49.4]], color: '#059669', family: 'nam', isAI: false, isGlobal: false },
  { id: 'nbm', name: 'NBM', provider: 'noaa', providerFlag: '🇺🇸', resolution_km: 3, forecast_hours: 264, tier: 'mid', bounds: [[20.19, -135.0], [52.61, -60.0]], color: '#86EFAC', family: 'nbm', isAI: false, isGlobal: false },
  { id: 'arpege_europe', name: 'ARPEGE Europe', provider: 'mf', providerFlag: '🇫🇷', resolution_km: 11, forecast_hours: 96, tier: 'mid', bounds: [[20.0, -32.0], [72.0, 42.0]], color: '#DC2626', family: 'arpege', isAI: false, isGlobal: false },
  { id: 'arome_france', name: 'AROME France', provider: 'mf', providerFlag: '🇫🇷', resolution_km: 2.5, forecast_hours: 48, tier: 'short', bounds: [[37.5, -12.0], [55.4, 16.0]], color: '#EF4444', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'arome_france_hd', name: 'AROME France HD', provider: 'mf', providerFlag: '🇫🇷', resolution_km: 1.5, forecast_hours: 48, tier: 'short', bounds: [[37.5, -12.0], [55.4, 16.0]], color: '#FCA5A5', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'ecmwf_ifs025', name: 'IFS 0.25°', provider: 'ecmwf', providerFlag: '🇪🇺', resolution_km: 25, forecast_hours: 360, tier: 'long', bounds: null, color: '#5B21B6', region: 'universal', family: 'ifs', isAI: false, isGlobal: true },
  { id: 'ecmwf_ifs_hres', name: 'IFS HRES', provider: 'ecmwf', providerFlag: '🇪🇺', resolution_km: 9, forecast_hours: 360, tier: 'mid', bounds: null, color: '#7C3AED', family: 'ifs', isAI: false, isGlobal: true },
  { id: 'ecmwf_aifs025', name: 'AIFS 0.25°', provider: 'ecmwf', providerFlag: '🇪🇺', resolution_km: 25, forecast_hours: 360, tier: 'long', bounds: null, color: '#A78BFA', family: 'aifs', isAI: true, isGlobal: true },
  { id: 'ukmo_global', name: 'UKMO Global', provider: 'ukmo', providerFlag: '🇬🇧', resolution_km: 10, forecast_hours: 168, tier: 'long', bounds: null, color: '#B45309', region: 'europe', family: 'ukmo', isAI: false, isGlobal: true },
  { id: 'ukmo_ukv', name: 'UKMO UKV', provider: 'ukmo', providerFlag: '🇬🇧', resolution_km: 2, forecast_hours: 48, tier: 'short', bounds: [[44, -15], [63, 9]], color: '#F59E0B', family: 'ukmo', isAI: false, isGlobal: false },
  { id: 'jma_gsm', name: 'JMA GSM', provider: 'jma', providerFlag: '🇯🇵', resolution_km: 55, forecast_hours: 264, tier: 'long', bounds: null, color: '#9A3412', region: 'asia', family: 'jma', isAI: false, isGlobal: true },
  { id: 'jma_msm', name: 'JMA MSM', provider: 'jma', providerFlag: '🇯🇵', resolution_km: 5, forecast_hours: 96, tier: 'mid', bounds: [[22.4, 120.0], [47.6, 150.0]], color: '#FB923C', family: 'jma', isAI: false, isGlobal: false },
  { id: 'gem_global', name: 'GEM Global', provider: 'cmc', providerFlag: '🇨🇦', resolution_km: 15, forecast_hours: 240, tier: 'long', bounds: null, color: '#831843', region: 'americas', family: 'gem', isAI: false, isGlobal: true },
  { id: 'gem_regional', name: 'GEM Regional', provider: 'cmc', providerFlag: '🇨🇦', resolution_km: 10, forecast_hours: 84, tier: 'mid', bounds: [[10.0, -175.0], [85.0, 10.0]], color: '#DB2777', family: 'gem', isAI: false, isGlobal: false },
  { id: 'gem_hrdps', name: 'GEM HRDPS', provider: 'cmc', providerFlag: '🇨🇦', resolution_km: 2.5, forecast_hours: 48, tier: 'short', bounds: [[38.0, -142.0], [75.0, -50.0]], color: '#EC4899', family: 'gem', isAI: false, isGlobal: false },
  { id: 'gem_hrdps_west', name: 'GEM HRDPS West', provider: 'cmc', providerFlag: '🇨🇦', resolution_km: 1, forecast_hours: 48, tier: 'short', bounds: [[44.0, -140.0], [62.0, -110.0]], color: '#F9A8D4', family: 'gem', isAI: false, isGlobal: false },
  { id: 'met_nordic', name: 'MET Nordic', provider: 'metno', providerFlag: '🇳🇴', resolution_km: 1, forecast_hours: 60, tier: 'short', bounds: [[52.0, -2.0], [72.0, 36.0]], color: '#0891B2', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'knmi_nl', name: 'HARMONIE NL', provider: 'knmi', providerFlag: '🇳🇱', resolution_km: 2, forecast_hours: 60, tier: 'short', bounds: [[49.0, -1.0], [57.0, 11.0]], color: '#0D9488', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'knmi_europe', name: 'HARMONIE EU', provider: 'knmi', providerFlag: '🇳🇱', resolution_km: 5.5, forecast_hours: 60, tier: 'mid', bounds: [[36.0, -30.0], [66.0, 45.0]], color: '#2DD4BF', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'dmi_harmonie', name: 'HARMONIE DINI', provider: 'dmi', providerFlag: '🇩🇰', resolution_km: 2, forecast_hours: 60, tier: 'short', bounds: [[36.0, -30.0], [70.0, 45.0]], color: '#4338CA', family: 'harmonie', isAI: false, isGlobal: false },
  { id: 'icon_2i', name: 'ICON 2I', provider: 'arpae', providerFlag: '🇮🇹', resolution_km: 2, forecast_hours: 60, tier: 'short', bounds: [[33.0, -3.0], [49.5, 23.0]], color: '#E11D48', family: 'icon', isAI: false, isGlobal: false },
  { id: 'mch_ch1', name: 'ICON CH1', provider: 'mch', providerFlag: '🇨🇭', resolution_km: 1, forecast_hours: 33, tier: 'short', bounds: [[43.5, 2.0], [50.0, 16.5]], color: '#0EA5E9', family: 'icon', isAI: false, isGlobal: false },
  { id: 'mch_ch2', name: 'ICON CH2', provider: 'mch', providerFlag: '🇨🇭', resolution_km: 2, forecast_hours: 120, tier: 'mid', bounds: [[43.5, 2.0], [50.0, 16.5]], color: '#38BDF8', family: 'icon', isAI: false, isGlobal: false },
  { id: 'bom_access_g', name: 'ACCESS-G', provider: 'bom', providerFlag: '🇦🇺', resolution_km: 15, forecast_hours: 240, tier: 'long', bounds: null, color: '#D97706', region: 'oceania', family: 'bom', isAI: false, isGlobal: true },
  { id: 'cma_grapes', name: 'GRAPES Global', provider: 'cma', providerFlag: '🇨🇳', resolution_km: 13, forecast_hours: 240, tier: 'long', bounds: null, color: '#65A30D', region: 'asia', family: 'cma', isAI: false, isGlobal: true },
  { id: 'kma_gdps', name: 'KMA GDPS', provider: 'kma', providerFlag: '🇰🇷', resolution_km: 12, forecast_hours: 288, tier: 'long', bounds: null, color: '#7C3AED', region: 'asia', family: 'kma', isAI: false, isGlobal: true },
  { id: 'kma_ldps', name: 'KMA LDPS', provider: 'kma', providerFlag: '🇰🇷', resolution_km: 1.5, forecast_hours: 48, tier: 'short', bounds: [[32.0, 124.0], [44.0, 132.0]], color: '#C084FC', family: 'kma', isAI: false, isGlobal: false },
];
