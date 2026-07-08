/**
 * Formats an Open-Meteo ISO datetime string (local time, no offset)
 * into a human-readable French label.
 * Input:  "2026-07-07T14:00"  →  Output: "Lun 7 juil. 14h00"
 */
export function formatDatetime(iso: string): string {
  const [datePart, timePart] = iso.split('T');
  if (!datePart) return iso;
  const [year, month, day] = datePart.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const MONTH_SHORT = ['jan.', 'fév.', 'mar.', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sep.', 'oct.', 'nov.', 'déc.'];
  const dayName = DAY_NAMES[date.getDay()];
  const monthName = MONTH_SHORT[month - 1];
  const time = timePart ? timePart.replace(':', 'h') : '';
  return `${dayName} ${day} ${monthName}${time ? ' ' + time : ''}`;
}

/** Wind direction (meteorological, degrees FROM) → compass label */
export function directionLabel(deg: number): string {
  const SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return SECTORS[Math.round(deg / 45) % 8];
}

/** Wind direction → arrow showing where the wind BLOWS TO (deg + 180°) */
export function directionArrow(deg: number): string {
  const ARROWS = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  return ARROWS[Math.round(deg / 45) % 8];
}

/** Downsamples aggregation for charts: hourly J1-J7, every 3h beyond */
export function downsampleForChart<T extends { hour: number }>(points: T[], maxHour: number): T[] {
  const zone1 = points.filter((p) => p.hour < 168);
  const zone2 = points.filter((p) => p.hour >= 168 && p.hour < maxHour && p.hour % 3 === 0);
  return [...zone1, ...zone2];
}

/**
 * Brightens a hex color if its luminance is too low to read on a dark
 * (#0f172a) tooltip background. Preserves hue; only scales brightness.
 */
export function ensureReadableColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance > 0.4) return hex;
  const factor = Math.min(0.45 / Math.max(luminance, 0.01), 2.8);
  const clamp = (v: number) => Math.min(255, Math.round(v * factor));
  return `#${clamp(r).toString(16).padStart(2, '0')}${clamp(g).toString(16).padStart(2, '0')}${clamp(b).toString(16).padStart(2, '0')}`;
}
