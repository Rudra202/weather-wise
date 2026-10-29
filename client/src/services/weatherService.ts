import type { Location, WeatherData, WeatherSearchData } from '../types/weather';
import { apiRequest } from './api';

export function searchLocations(query: string, signal?: AbortSignal): Promise<WeatherSearchData> {
  return apiRequest<WeatherSearchData>(`/weather/search?q=${encodeURIComponent(query)}`, {
    signal,
  });
}

export function getWeather(location: Location, signal?: AbortSignal): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
    name: location.name,
    country: location.country,
  });

  if (location.admin1) params.set('admin1', location.admin1);
  if (location.countryCode) params.set('countryCode', location.countryCode);
  if (location.timezone) params.set('timezone', location.timezone);

  return apiRequest<WeatherData>(`/weather?${params.toString()}`, { signal });
}
