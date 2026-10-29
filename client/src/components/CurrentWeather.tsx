import { ArrowDown, ArrowUp, Clock3, MapPin, Umbrella } from 'lucide-react';
import type { Location, TemperatureUnit, WeatherData } from '../types/weather';
import { formatLocationDate, formatLocationTime, formatUpdatedAt } from '../utils/format';
import { formatNumber, formatTemperature, unitSymbol } from '../utils/temperature';
import { getWeatherTheme } from '../utils/weatherCodes';
import FavoriteButton from './FavoriteButton';
import WeatherIcon from './WeatherIcon';

interface CurrentWeatherProps {
  data: WeatherData;
  selectedLocation: Location;
  unit: TemperatureUnit;
  countryCenter: boolean;
}

export default function CurrentWeather({
  data,
  selectedLocation,
  unit,
  countryCenter,
}: CurrentWeatherProps) {
  const { current, daily, location } = data;
  const today = daily[0];
  const theme = getWeatherTheme(current.weatherCode, current.isDay);
  const symbol = unitSymbol(unit);
  const temperature = formatTemperature(current.temperature, unit);
  const feelsLike = formatTemperature(current.feelsLike, unit, { withUnit: true });
  const high = formatTemperature(today?.tempMax, unit, { withUnit: true });
  const low = formatTemperature(today?.tempMin, unit, { withUnit: true });
  const condition = current.condition;

  return (
    <section
      aria-labelledby="current-weather-title"
      className="relative overflow-hidden rounded-3xl border border-white/15 p-6 shadow-glass sm:p-8"
      style={{ backgroundImage: theme.backgroundImage }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
        style={{ backgroundColor: theme.glow }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-night-950/10 via-transparent to-night-950/35"
      />

      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">
              Current weather
            </p>
            <h2
              id="current-weather-title"
              className="mt-2 flex items-start gap-2 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl"
            >
              <MapPin className="mt-1.5 h-5 w-5 shrink-0 text-white/80 sm:h-6 sm:w-6" aria-hidden="true" />
              <span className="break-words">{location.name}</span>
            </h2>
            <p className="mt-1 text-sm text-white/75">
              {[location.admin1, location.country].filter(Boolean).join(', ') || location.country}
            </p>
          </div>
          <FavoriteButton
            location={{
              ...selectedLocation,
              name: location.name,
              country: location.country,
              admin1: location.admin1,
              countryCode: location.countryCode,
              latitude: location.latitude,
              longitude: location.longitude,
              timezone: location.timezone,
            }}
          />
        </div>

        {countryCenter ? (
          <p className="mt-3 rounded-xl border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-xs leading-relaxed text-amber-50">
            This is a country-center coordinate, not a countrywide forecast. Search for a city for
            local conditions.
          </p>
        ) : null}

        <div className="mt-8 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-start font-display text-[4.25rem] font-semibold leading-none tracking-[-0.06em] text-white sm:text-[5.5rem] lg:text-[7rem]">
              <span>{temperature}</span>
              <span className="mt-2 text-2xl font-medium tracking-normal text-white/65 sm:mt-4 sm:text-3xl">
                °{symbol}
              </span>
            </p>
            <p className="mt-3 flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
              <WeatherIcon
                code={current.weatherCode}
                isDay={current.isDay}
                className="h-6 w-6"
                strokeWidth={1.8}
              />
              {condition}
            </p>
            <p className="mt-1 text-sm text-white/70">Feels like {feelsLike}</p>
          </div>

          <div className="relative hidden shrink-0 sm:block">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <WeatherIcon
              code={current.weatherCode}
              isDay={current.isDay}
              className="relative h-28 w-28 drop-shadow-2xl lg:h-32 lg:w-32"
              strokeWidth={1.1}
            />
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2 text-xs font-medium text-white/85">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> {high}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
            <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> {low}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1">
            <Umbrella className="h-3.5 w-3.5" aria-hidden="true" />
            {formatNumber(current.precipitation, ' mm', 1)} precipitation
          </span>
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-4 text-[11px] text-white/65 sm:text-xs">
          <p>
            {formatLocationDate(current.time)} · {formatLocationTime(current.time)}
            {location.timezoneAbbreviation ? ` ${location.timezoneAbbreviation}` : ''}
          </p>
          <p className="inline-flex items-center gap-1.5">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            Updated {formatUpdatedAt(data.updatedAt)}
          </p>
        </div>
        <p className="mt-1 text-[10px] text-white/45">{location.timezone}</p>
      </div>
    </section>
  );
}
