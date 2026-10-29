import { config } from '../config/env.js';
import { geocodeCache, weatherCache } from '../utils/cache.js';
import { HttpError } from '../utils/httpError.js';
import { describeWeatherCode } from '../utils/weatherCodes.js';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const PHOTON_URL = 'https://photon.komoot.io/api/';
const ARCGIS_URL =
  'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'is_day',
  'precipitation',
  'weather_code',
  'wind_speed_10m',
  'wind_direction_10m',
  'pressure_msl',
].join(',');

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'sunrise',
  'sunset',
  'precipitation_probability_max',
  'precipitation_sum',
  'wind_speed_10m_max',
  'uv_index_max',
].join(',');

const HOURLY_FIELDS = [
  'temperature_2m',
  'weather_code',
  'precipitation_probability',
  'is_day',
].join(',');

export interface GeocodingResult {
  id: number;
  name: string;
  admin1: string | null;
  admin2: string | null;
  country: string;
  countryCode: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  population: number | null;
  featureCode: string | null;
}

interface RankedPlace {
  result: GeocodingResult;
  rank: number;
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

export interface ForecastResult {
  location: {
    latitude: number;
    longitude: number;
    timezone: string | null;
    timezoneAbbreviation: string | null;
    elevation: number | null;
  };
  current: CurrentWeather;
  daily: DailyForecast[];
  hourly: HourlyForecast[];
  updatedAt: string;
}

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function fetchJson(url: string): Promise<JsonObject> {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WeatherWise/1.0 (educational weather dashboard)',
      },
      signal: AbortSignal.timeout(config.upstreamTimeoutMs),
    });
  } catch (error) {
    const timedOut =
      error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    console.error(`[weather] Upstream request failed: ${error instanceof Error ? error.message : error}`);
    throw new HttpError(
      timedOut ? 504 : 502,
      timedOut
        ? 'The weather provider took too long to respond. Please try again.'
        : 'Could not reach the weather provider. Please try again.',
      timedOut ? 'UPSTREAM_TIMEOUT' : 'UPSTREAM_UNREACHABLE',
    );
  }

  if (!response.ok) {
    console.error(`[weather] Upstream responded with HTTP ${response.status} for ${url}`);
    throw new HttpError(
      502,
      'The weather provider returned an error. Please try again shortly.',
      'UPSTREAM_ERROR',
    );
  }

  try {
    const body: unknown = await response.json();
    if (!isObject(body)) throw new Error('Expected a JSON object.');
    return body;
  } catch (error) {
    console.error(`[weather] Invalid upstream JSON: ${error instanceof Error ? error.message : error}`);
    throw new HttpError(502, 'The weather provider returned an invalid response.', 'UPSTREAM_INVALID');
  }
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanFromNumber(value: unknown): boolean | null {
  if (value === 0) return false;
  if (value === 1) return true;
  return null;
}

const SETTLEMENT_TYPES = new Set([
  'city',
  'town',
  'village',
  'hamlet',
  'isolated_dwelling',
  'suburb',
  'neighbourhood',
  'quarter',
  'locality',
  'borough',
  'district',
  'municipality',
  'administrative',
  'province',
  'state',
  'region',
]);

function normalizePlaceName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

/**
 * A name that matches the query exactly should beat a fuzzy match from another
 * provider, and a prefix match (e.g. "Mayur Vihar Phase 2") should beat an
 * unrelated same-name place. These ranks sit above every provider rank.
 */
function nameMatchRank(name: string, query: string): number | null {
  const normalizedName = normalizePlaceName(name);
  const normalizedQuery = normalizePlaceName(query);
  if (!normalizedName || !normalizedQuery) return null;
  if (normalizedName === normalizedQuery) return 0.15;
  if (normalizedName.startsWith(normalizedQuery)) return 0.35;
  if (normalizedName.includes(normalizedQuery)) return 0.6;
  return null;
}

function bestRank(baseRank: number, name: string, query: string): number {
  return Math.min(baseRank, nameMatchRank(name, query) ?? baseRank);
}

function isSettlementFeature(osmKey: string, type: string | null): boolean {
  if (osmKey === 'place') return type === null || SETTLEMENT_TYPES.has(type);
  if (osmKey === 'boundary') return type !== null && SETTLEMENT_TYPES.has(type);
  if (osmKey === 'landuse') return type === 'locality' || type === 'residential';
  // Parks and open spaces are a useful last resort for neighbourhoods without a
  // place node (OpenStreetMap has no place node for Nihal Vihar, for example).
  if (osmKey === 'leisure') {
    return (
      type === null ||
      ['park', 'garden', 'playground', 'nature_reserve', 'common', 'pitch', 'stadium', 'sports_centre', 'other'].includes(type)
    );
  }
  return false;
}

function photonRank(osmKey: string): number {
  switch (osmKey) {
    case 'place':
      return 1.5;
    case 'boundary':
      return 2.5;
    case 'landuse':
      return 4;
    case 'leisure':
      return 5;
    default:
      return 5;
  }
}

function matchesPhotonQuery(name: string, query: string, contextTokens: string[]): boolean {
  const normalizedName = normalizePlaceName(name);
  if (!normalizedName) return false;
  if (normalizedName.includes(normalizePlaceName(query))) return true;

  const allTokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  if (allTokens.length === 0) return true;

  // At least one query word must appear in the place name, and every word that
  // is not already part of the feature's region/country must appear too. This
  // keeps "Nihal Vihar Delhi" matching "Nihal Vihar Park" while rejecting
  // unrelated townships that merely mention Delhi in their address.
  if (!allTokens.some((token) => normalizedName.includes(token))) return false;
  return allTokens
    .filter((token) => !contextTokens.includes(token))
    .every((token) => normalizedName.includes(token));
}

function mapPhotonFeature(
  feature: unknown,
  query: string,
): { result: GeocodingResult; rank: number } | null {
  if (!isObject(feature)) return null;
  const geometry = feature.geometry;
  const properties = feature.properties;
  if (!isObject(geometry) || !isObject(properties)) return null;

  const coordinates = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
  const longitude = numberOrNull(coordinates[0]);
  const latitude = numberOrNull(coordinates[1]);
  const name = stringOrNull(properties.name);
  const osmKey = stringOrNull(properties.osm_key);
  const type = stringOrNull(properties.type);
  if (latitude === null || longitude === null || !name || !osmKey) return null;
  if (!isSettlementFeature(osmKey, type)) return null;

  const contextTokens = [
    properties.city,
    properties.district,
    properties.county,
    properties.state,
    properties.country,
  ]
    .flatMap((value) =>
      typeof value === 'string' ? value.toLowerCase().split(/[^a-z0-9]+/) : [],
    )
    .filter((token) => token.length >= 3);
  if (!matchesPhotonQuery(name, query, contextTokens)) return null;

  return {
    rank: bestRank(photonRank(osmKey), name, query),
    result: {
      id: 0,
      name,
      admin1: stringOrNull(properties.state),
      admin2:
        stringOrNull(properties.district) ??
        stringOrNull(properties.city) ??
        stringOrNull(properties.county),
      country: stringOrNull(properties.country) ?? 'Unknown country',
      countryCode: stringOrNull(properties.countrycode)?.toUpperCase() ?? null,
      latitude,
      longitude,
      timezone: null,
      population: null,
      featureCode: `osm:${osmKey}:${type ?? 'unknown'}`,
    },
  };
}

async function searchOpenMeteo(query: string): Promise<GeocodingResult[]> {
  const url = new URL(GEOCODING_URL);
  url.searchParams.set('name', query);
  url.searchParams.set('count', '8');
  url.searchParams.set('language', 'en');
  url.searchParams.set('format', 'json');

  const body = await fetchJson(url.toString());
  const rawResults = Array.isArray(body.results) ? body.results : [];

  return rawResults.flatMap((item): GeocodingResult[] => {
    if (!isObject(item)) return [];
    const latitude = numberOrNull(item.latitude);
    const longitude = numberOrNull(item.longitude);
    const name = stringOrNull(item.name);
    if (latitude === null || longitude === null || !name) return [];

    return [
      {
        id: typeof item.id === 'number' ? item.id : 0,
        name,
        admin1: stringOrNull(item.admin1),
        admin2: stringOrNull(item.admin2),
        country: stringOrNull(item.country) ?? 'Unknown country',
        countryCode: stringOrNull(item.country_code),
        latitude,
        longitude,
        timezone: stringOrNull(item.timezone),
        population: numberOrNull(item.population),
        featureCode: stringOrNull(item.feature_code),
      },
    ];
  });
}

/**
 * Open-Meteo's geocoder is city/region focused, so it misses many
 * neighbourhoods (e.g. Mayur Vihar, Nihal Vihar, Meerabagh in Delhi).
 * Photon/OpenStreetMap fills that gap. It is best-effort: if Photon is
 * unavailable we still return the Open-Meteo results.
 */
async function searchPhoton(query: string): Promise<RankedPlace[]> {
  const url = new URL(PHOTON_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('limit', '20');
  url.searchParams.set('lang', 'en');

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WeatherWise/1.0 (educational weather dashboard)',
      },
      signal: AbortSignal.timeout(4000),
    });
  } catch (error) {
    console.warn(
      `[weather] Neighbourhood search unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return [];
  }

  if (!response.ok) {
    console.warn(`[weather] Neighbourhood search returned HTTP ${response.status}`);
    return [];
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return [];
  }
  if (!isObject(body) || !Array.isArray(body.features)) return [];

  return body.features
    .flatMap((feature) => {
      const mapped = mapPhotonFeature(feature, query);
      return mapped ? [mapped] : [];
    })
    .sort((a, b) => a.rank - b.rank);
}

const ARCGIS_LOCALITY_TYPES = new Set(['Locality', 'Neighborhood', 'PostalLocality']);
const ARCGIS_CITY_TYPES = new Set(['City', 'Municipality']);
const ARCGIS_DISTRICT_TYPES = new Set(['Subregion', 'District', 'MetroArea']);
const ARCGIS_POI_TYPES = new Set(['POI']);

function arcgisRank(addrType: string): number | null {
  if (ARCGIS_LOCALITY_TYPES.has(addrType)) return 1;
  if (ARCGIS_CITY_TYPES.has(addrType)) return 2;
  if (ARCGIS_DISTRICT_TYPES.has(addrType)) return 3;
  if (ARCGIS_POI_TYPES.has(addrType)) return 4.5;
  return null;
}

function mapArcgisCandidate(candidate: unknown, query: string): RankedPlace | null {
  if (!isObject(candidate)) return null;
  const location = candidate.location;
  const attributes = candidate.attributes;
  if (!isObject(location) || !isObject(attributes)) return null;

  const score = numberOrNull(candidate.score) ?? numberOrNull(attributes.Score);
  if (score === null || score < 70) return null;

  const addrType = stringOrNull(attributes.Addr_type);
  if (!addrType) return null;
  const rank = arcgisRank(addrType);
  if (rank === null) return null;

  const latitude = numberOrNull(location.y) ?? numberOrNull(attributes.Y);
  const longitude = numberOrNull(location.x) ?? numberOrNull(attributes.X);
  if (latitude === null || longitude === null) return null;

  const name =
    stringOrNull(attributes.PlaceName) ??
    stringOrNull(attributes.ShortLabel) ??
    stringOrNull(candidate.address);
  if (!name) return null;

  const country = stringOrNull(attributes.CntryName);
  if (!country) return null;

  return {
    rank: bestRank(rank, name, query),
    result: {
      id: 0,
      name,
      admin1: stringOrNull(attributes.Region),
      admin2:
        stringOrNull(attributes.Subregion) ??
        stringOrNull(attributes.District) ??
        stringOrNull(attributes.City),
      country,
      // ArcGIS returns an ISO3 code while the UI expects ISO2. Leave it unset
      // rather than showing the wrong country badge.
      countryCode: null,
      latitude,
      longitude,
      timezone: null,
      population: null,
      featureCode: `esri:${addrType.toLowerCase()}`,
    },
  };
}

// ArcGIS occasionally rate-limits its anonymous endpoint. Skip it for a while
// instead of slowing every search down with a request that is bound to fail.
let arcgisDisabledUntil = 0;

async function searchArcgis(query: string): Promise<RankedPlace[]> {
  if (Date.now() < arcgisDisabledUntil) return [];

  const url = new URL(ARCGIS_URL);
  url.searchParams.set('f', 'json');
  url.searchParams.set('SingleLine', query);
  url.searchParams.set('maxLocations', '10');
  url.searchParams.set(
    'outFields',
    'Addr_type,PlaceName,ShortLabel,City,District,Subregion,Region,CntryName,Country',
  );
  if (config.arcgisApiKey) url.searchParams.set('token', config.arcgisApiKey);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3500),
    });
  } catch (error) {
    console.warn(
      `[weather] Locality search unavailable: ${error instanceof Error ? error.message : error}`,
    );
    return [];
  }

  if (response.status === 403 || response.status === 429) {
    arcgisDisabledUntil = Date.now() + 5 * 60 * 1000;
    console.warn(
      `[weather] Locality search returned HTTP ${response.status}; pausing it for 5 minutes`,
    );
    return [];
  }

  if (!response.ok) {
    console.warn(`[weather] Locality search returned HTTP ${response.status}`);
    return [];
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return [];
  }
  if (!isObject(body) || !Array.isArray(body.candidates)) return [];

  return body.candidates
    .flatMap((candidate) => {
      const mapped = mapArcgisCandidate(candidate, query);
      return mapped ? [mapped] : [];
    })
    .sort((a, b) => a.rank - b.rank);
}

function isDuplicatePlace(candidate: GeocodingResult, existing: GeocodingResult[]): boolean {
  const candidateName = normalizePlaceName(candidate.name);
  return existing.some((item) => {
    if (normalizePlaceName(item.name) !== candidateName) return false;
    const sameRegion =
      (item.admin1 ?? '').toLowerCase() === (candidate.admin1 ?? '').toLowerCase();
    const nearby =
      Math.abs(item.latitude - candidate.latitude) < 0.2 &&
      Math.abs(item.longitude - candidate.longitude) < 0.2;
    return sameRegion || nearby;
  });
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  const cacheKey = `geo:${query.toLowerCase()}`;
  const cached = geocodeCache.get<GeocodingResult[]>(cacheKey);
  if (cached) return cached;

  const [openMeteoResults, arcgisResults, photonResults] = await Promise.all([
    searchOpenMeteo(query),
    searchArcgis(query),
    searchPhoton(query),
  ]);

  // Open-Meteo's city gazetteer wins. Photon comes before ArcGIS so that an
  // exact OpenStreetMap locality breaks a tie with an exact Esri locality (and
  // OSM's Tokyo neighbourhood wins over similarly named rural places).
  const ranked: RankedPlace[] = [
    ...openMeteoResults.map((result) => ({ result, rank: 0 })),
    ...photonResults,
    ...arcgisResults,
  ].sort((a, b) => a.rank - b.rank);

  const merged: GeocodingResult[] = [];
  const nameCounts = new Map<string, number>();
  for (const { result } of ranked) {
    if (merged.length >= 10) break;
    if (isDuplicatePlace(result, merged)) continue;

    // Prevent one provider from filling the list with the same name in many
    // states (e.g. every "Mayur Vihar" in India) before closer variants show.
    const nameKey = normalizePlaceName(result.name);
    const seen = nameCounts.get(nameKey) ?? 0;
    if (seen >= 4) continue;
    nameCounts.set(nameKey, seen + 1);
    merged.push(result);
  }

  geocodeCache.set(cacheKey, merged, config.geocodeCacheTtlMs);
  return merged;
}

export async function getForecast(latitude: number, longitude: number): Promise<ForecastResult> {
  const cacheKey = `weather:${latitude.toFixed(3)}:${longitude.toFixed(3)}`;
  const cached = weatherCache.get<ForecastResult>(cacheKey);
  if (cached) return cached;

  const url = new URL(FORECAST_URL);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', CURRENT_FIELDS);
  url.searchParams.set('daily', DAILY_FIELDS);
  url.searchParams.set('hourly', HOURLY_FIELDS);
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '7');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');

  const body = await fetchJson(url.toString());
  if (!isObject(body.current) || !isObject(body.daily) || !isObject(body.hourly)) {
    throw new HttpError(502, 'The weather provider returned incomplete data.', 'UPSTREAM_INVALID');
  }

  const currentRaw = body.current;
  const dailyRaw = body.daily;
  const hourlyRaw = body.hourly;

  const currentCode = numberOrNull(currentRaw.weather_code);
  const current: CurrentWeather = {
    time: stringOrNull(currentRaw.time),
    temperature: numberOrNull(currentRaw.temperature_2m),
    feelsLike: numberOrNull(currentRaw.apparent_temperature),
    humidity: numberOrNull(currentRaw.relative_humidity_2m),
    windSpeed: numberOrNull(currentRaw.wind_speed_10m),
    windDirection: numberOrNull(currentRaw.wind_direction_10m),
    pressure: numberOrNull(currentRaw.pressure_msl),
    precipitation: numberOrNull(currentRaw.precipitation),
    weatherCode: currentCode,
    isDay: booleanFromNumber(currentRaw.is_day),
    condition: describeWeatherCode(currentCode).label,
  };

  const hourlyTimes = Array.isArray(hourlyRaw.time) ? hourlyRaw.time : [];

  const allHourly: HourlyForecast[] = hourlyTimes.flatMap(
    (timeValue, index): HourlyForecast[] => {
      if (typeof timeValue !== 'string') return [];
      const code = numberOrNull(
        Array.isArray(hourlyRaw.weather_code) ? hourlyRaw.weather_code[index] : null,
      );
      return [
        {
          time: timeValue,
          temperature: numberOrNull(
            Array.isArray(hourlyRaw.temperature_2m)
              ? hourlyRaw.temperature_2m[index]
              : null,
          ),
          weatherCode: code,
          condition: describeWeatherCode(code).label,
          precipitationProbability: numberOrNull(
            Array.isArray(hourlyRaw.precipitation_probability)
              ? hourlyRaw.precipitation_probability[index]
              : null,
          ),
          isDay: booleanFromNumber(
            Array.isArray(hourlyRaw.is_day) ? hourlyRaw.is_day[index] : null,
          ),
        },
      ];
    },
  );

  const hourlyByDate = new Map<string, HourlyForecast[]>();
  for (const hour of allHourly) {
    const dateKey = hour.time.slice(0, 10);
    const group = hourlyByDate.get(dateKey);
    if (group) group.push(hour);
    else hourlyByDate.set(dateKey, [hour]);
  }

  const dates = Array.isArray(dailyRaw.time) ? dailyRaw.time : [];
  const daily: DailyForecast[] = dates.flatMap((dateValue, index): DailyForecast[] => {
    if (typeof dateValue !== 'string') return [];
    const code = numberOrNull(
      Array.isArray(dailyRaw.weather_code) ? dailyRaw.weather_code[index] : null,
    );
    return [
      {
        date: dateValue,
        weatherCode: code,
        condition: describeWeatherCode(code).label,
        tempMax: numberOrNull(
          Array.isArray(dailyRaw.temperature_2m_max)
            ? dailyRaw.temperature_2m_max[index]
            : null,
        ),
        tempMin: numberOrNull(
          Array.isArray(dailyRaw.temperature_2m_min)
            ? dailyRaw.temperature_2m_min[index]
            : null,
        ),
        sunrise: stringOrNull(
          Array.isArray(dailyRaw.sunrise) ? dailyRaw.sunrise[index] : null,
        ),
        sunset: stringOrNull(
          Array.isArray(dailyRaw.sunset) ? dailyRaw.sunset[index] : null,
        ),
        precipitationProbabilityMax: numberOrNull(
          Array.isArray(dailyRaw.precipitation_probability_max)
            ? dailyRaw.precipitation_probability_max[index]
            : null,
        ),
        precipitationSum: numberOrNull(
          Array.isArray(dailyRaw.precipitation_sum) ? dailyRaw.precipitation_sum[index] : null,
        ),
        windSpeedMax: numberOrNull(
          Array.isArray(dailyRaw.wind_speed_10m_max)
            ? dailyRaw.wind_speed_10m_max[index]
            : null,
        ),
        uvIndexMax: numberOrNull(
          Array.isArray(dailyRaw.uv_index_max) ? dailyRaw.uv_index_max[index] : null,
        ),
        hourly: hourlyByDate.get(dateValue) ?? [],
      },
    ];
  });

  const foundIndex = hourlyTimes.findIndex(
    (time) => typeof time === 'string' && current.time !== null && time >= current.time,
  );
  // Fall back to the first hour if the provider does not include a future hour.
  const futureStart = foundIndex === -1 ? 0 : foundIndex;
  const hourly = allHourly.slice(futureStart, futureStart + 24);

  const result: ForecastResult = {
    location: {
      latitude: numberOrNull(body.latitude) ?? latitude,
      longitude: numberOrNull(body.longitude) ?? longitude,
      timezone: stringOrNull(body.timezone),
      timezoneAbbreviation: stringOrNull(body.timezone_abbreviation),
      elevation: numberOrNull(body.elevation),
    },
    current,
    daily,
    hourly,
    updatedAt: new Date().toISOString(),
  };

  weatherCache.set(cacheKey, result, config.weatherCacheTtlMs);
  return result;
}
