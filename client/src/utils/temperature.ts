import type { TemperatureUnit } from '../types/weather';

export function convertTemperature(
  celsius: number | null | undefined,
  unit: TemperatureUnit,
): number | null {
  if (typeof celsius !== 'number' || !Number.isFinite(celsius)) return null;
  return unit === 'celsius' ? celsius : (celsius * 9) / 5 + 32;
}

export function formatTemperature(
  celsius: number | null | undefined,
  unit: TemperatureUnit,
  options: { withUnit?: boolean; decimals?: number } = {},
): string {
  const converted = convertTemperature(celsius, unit);
  if (converted === null) return '—';

  const { withUnit = false, decimals = 0 } = options;
  const rounded = Number(converted.toFixed(decimals));
  const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(decimals);
  if (!withUnit) return value;
  return `${value}°${unit === 'celsius' ? 'C' : 'F'}`;
}

export function unitSymbol(unit: TemperatureUnit): string {
  return unit === 'celsius' ? 'C' : 'F';
}

export function formatNumber(
  value: number | null | undefined,
  suffix: string,
  decimals = 0,
): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)}${suffix}`;
}
