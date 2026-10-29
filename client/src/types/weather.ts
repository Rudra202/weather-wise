export interface Location {
  id?: number;
  name: string;
  admin1?: string | null;
  admin2?: string | null;
  country: string;
  countryCode?: string | null;
  latitude: number;
  longitude: number;
  timezone?: string | null;
  population?: number | null;
  featureCode?: string | null;
}

export interface WeatherLocation {
  name: string;
  country: string;
  admin1: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string;
  timezoneAbbreviation: string | null;
  elevation: number | null;
}

export interface CurrentWeather {
  time: string | null;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure: number | null;
  precipitation: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
  condition: string;
}

export interface DailyForecast {
  date: string;
  weatherCode: number | null;
  condition: string;
  tempMax: number | null;
  tempMin: number | null;
  sunrise: string | null;
  sunset: string | null;
  precipitationProbabilityMax: number | null;
  precipitationSum: number | null;
  windSpeedMax: number | null;
  uvIndexMax: number | null;
  hourly: HourlyForecast[];
}

export interface HourlyForecast {
  time: string;
  temperature: number | null;
  weatherCode: number | null;
  condition: string;
  precipitationProbability: number | null;
  isDay: boolean | null;
}

export interface WeatherAttribution {
  text: string;
  url: string;
}

export interface WeatherData {
  location: WeatherLocation;
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  updatedAt: string;
  attribution: WeatherAttribution;
}

export interface WeatherSearchData {
  query: string;
  locations: Location[];
}

export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface FavoriteLocation {
  id: string;
  name: string;
  country: string;
  admin1: string | null;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  createdAt: string;
}
