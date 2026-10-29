import type { Location, TemperatureUnit } from '../types/weather';

const LOCATION_KEY = 'weatherwise:last-location';
const UNIT_KEY = 'weatherwise:temperature-unit';

export const DEFAULT_LOCATION: Location = {
  name: 'New Delhi',
  admin1: 'Delhi',
  country: 'India',
  countryCode: 'IN',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
  featureCode: 'PPLA',
};

function isLocation(value: unknown): value is Location {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.country === 'string' &&
    typeof candidate.latitude === 'number' &&
    Number.isFinite(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    typeof candidate.longitude === 'number' &&
    Number.isFinite(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180
  );
}

export function loadLastLocation(): Location | null {
  try {
    const raw = localStorage.getItem(LOCATION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveLastLocation(location: Location): void {
  try {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Storage can be unavailable in private browsing; weather still works.
  }
}

export function loadTemperatureUnit(): TemperatureUnit {
  try {
    return localStorage.getItem(UNIT_KEY) === 'fahrenheit' ? 'fahrenheit' : 'celsius';
  } catch {
    return 'celsius';
  }
}

export function saveTemperatureUnit(unit: TemperatureUnit): void {
  try {
    localStorage.setItem(UNIT_KEY, unit);
  } catch {
    // Ignore storage failures.
  }
}

export function isCountryCenter(location: Pick<Location, 'featureCode'>): boolean {
  return typeof location.featureCode === 'string' && location.featureCode.startsWith('PCLI');
}

export function locationSubtitle(location: Location): string {
  if (isCountryCenter(location)) return 'Country center';
  return [location.admin1, location.country].filter(Boolean).join(', ');
}
