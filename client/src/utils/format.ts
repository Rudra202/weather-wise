const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * Open-Meteo returns local wall-clock times without an offset (e.g.
 * "2026-10-29T14:00"). Parsing these directly would shift them into the
 * browser's timezone, so we split the string instead.
 */
function splitLocalIso(value: string | null | undefined): LocalParts | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  if (!year || !month || !day || !hour || !minute) return null;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

export function formatLocationDate(localIso: string | null | undefined): string {
  const parts = splitLocalIso(localIso);
  if (!parts) return 'Local time unavailable';
  const weekday = WEEKDAYS[new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay()];
  return `${weekday ?? ''}, ${MONTHS[parts.month - 1] ?? ''} ${parts.day}`;
}

export function formatLocationTime(localIso: string | null | undefined): string {
  const parts = splitLocalIso(localIso);
  if (!parts) return '—';
  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const suffix = parts.hour < 12 ? 'AM' : 'PM';
  return `${hour12}:${String(parts.minute).padStart(2, '0')} ${suffix}`;
}

export function formatHour(localIso: string): string {
  return formatLocationTime(localIso);
}

export function formatShortDate(date: string): string {
  const parts = splitDate(date);
  if (!parts) return date;
  return `${MONTHS[parts.month - 1]?.slice(0, 3) ?? ''} ${parts.day}`;
}

function splitDate(date: string | null | undefined): { year: number; month: number; day: number } | null {
  if (!date) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!match) return null;
  const [, year, month, day] = match;
  if (!year || !month || !day) return null;
  return { year: Number(year), month: Number(month), day: Number(day) };
}

export function formatForecastDay(date: string, currentLocalTime: string | null): string {
  const parts = splitDate(date);
  if (!parts) return date;
  const dateKey = `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
  const currentDateKey = currentLocalTime?.slice(0, 10);
  if (dateKey === currentDateKey) return 'Today';

  const weekdayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return WEEKDAYS_SHORT[weekdayIndex] ?? dateKey;
}

export function formatForecastDateFull(date: string): string {
  const parts = splitDate(date);
  if (!parts) return date;
  const weekdayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  return `${WEEKDAYS[weekdayIndex] ?? ''}, ${MONTHS[parts.month - 1] ?? ''} ${parts.day}`;
}

export function formatUpdatedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'just now';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatCoordinatePair(latitude: number, longitude: number): string {
  const latitudeDirection = latitude >= 0 ? 'N' : 'S';
  const longitudeDirection = longitude >= 0 ? 'E' : 'W';
  return `${Math.abs(latitude).toFixed(2)}° ${latitudeDirection}, ${Math.abs(longitude).toFixed(2)}° ${longitudeDirection}`;
}
