export type WeatherCondition = {
  label: string;
  group:
    | 'clear'
    | 'partly-cloudy'
    | 'cloudy'
    | 'fog'
    | 'drizzle'
    | 'rain'
    | 'snow'
    | 'showers'
    | 'thunderstorm'
    | 'unknown';
};

/**
 * WMO 4677 weather interpretation codes used by Open-Meteo.
 * https://open-meteo.com/en/docs#weathervariables
 */
const CONDITIONS: Record<number, WeatherCondition> = {
  0: { label: 'Clear sky', group: 'clear' },
  1: { label: 'Mainly clear', group: 'clear' },
  2: { label: 'Partly cloudy', group: 'partly-cloudy' },
  3: { label: 'Overcast', group: 'cloudy' },
  45: { label: 'Fog', group: 'fog' },
  48: { label: 'Depositing rime fog', group: 'fog' },
  51: { label: 'Light drizzle', group: 'drizzle' },
  53: { label: 'Moderate drizzle', group: 'drizzle' },
  55: { label: 'Dense drizzle', group: 'drizzle' },
  56: { label: 'Light freezing drizzle', group: 'drizzle' },
  57: { label: 'Dense freezing drizzle', group: 'drizzle' },
  61: { label: 'Slight rain', group: 'rain' },
  63: { label: 'Moderate rain', group: 'rain' },
  65: { label: 'Heavy rain', group: 'rain' },
  66: { label: 'Light freezing rain', group: 'rain' },
  67: { label: 'Heavy freezing rain', group: 'rain' },
  71: { label: 'Slight snowfall', group: 'snow' },
  73: { label: 'Moderate snowfall', group: 'snow' },
  75: { label: 'Heavy snowfall', group: 'snow' },
  77: { label: 'Snow grains', group: 'snow' },
  80: { label: 'Slight rain showers', group: 'showers' },
  81: { label: 'Moderate rain showers', group: 'showers' },
  82: { label: 'Violent rain showers', group: 'showers' },
  85: { label: 'Slight snow showers', group: 'snow' },
  86: { label: 'Heavy snow showers', group: 'snow' },
  95: { label: 'Thunderstorm', group: 'thunderstorm' },
  96: { label: 'Thunderstorm with slight hail', group: 'thunderstorm' },
  99: { label: 'Thunderstorm with heavy hail', group: 'thunderstorm' },
};

const UNKNOWN: WeatherCondition = { label: 'Unknown conditions', group: 'unknown' };

export function describeWeatherCode(code: number | null | undefined): WeatherCondition {
  if (typeof code !== 'number' || !Number.isFinite(code)) return UNKNOWN;
  return CONDITIONS[code] ?? UNKNOWN;
}
