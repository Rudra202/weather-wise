import { useEffect, useState } from 'react';
import { Globe2, History, MapPin } from 'lucide-react';
import CurrentWeather from '../components/CurrentWeather';
import Footer from '../components/Footer';
import HourlyForecast from '../components/HourlyForecast';
import Navbar from '../components/Navbar';
import SearchBar from '../components/SearchBar';
import { ErrorState, WeatherSkeleton } from '../components/WeatherStates';
import WeatherDetails from '../components/WeatherDetails';
import WeeklyForecast from '../components/WeeklyForecast';
import { useWeather } from '../hooks/useWeather';
import type { Location, TemperatureUnit } from '../types/weather';
import { formatCoordinatePair } from '../utils/format';
import {
  DEFAULT_LOCATION,
  isCountryCenter,
  loadLastLocation,
  loadTemperatureUnit,
  saveLastLocation,
  saveTemperatureUnit,
} from '../utils/storage';
import { getWeatherTheme } from '../utils/weatherCodes';

export default function Home() {
  const [location, setLocation] = useState<Location>(() => loadLastLocation() ?? DEFAULT_LOCATION);
  const [hasSavedLocation, setHasSavedLocation] = useState(() => loadLastLocation() !== null);
  const [unit, setUnit] = useState<TemperatureUnit>(() => loadTemperatureUnit());
  const { data, loading, error, retry } = useWeather(location);

  // Keep the displayed location name in sync with the resolved place returned by
  // the API (for example after a "use my location" lookup).
  useEffect(() => {
    if (!data?.location) return;
    setLocation((previous) => {
      if (
        previous.name === data.location.name &&
        previous.country === data.location.country
      ) {
        return previous;
      }
      return {
        ...previous,
        name: data.location.name,
        country: data.location.country,
        admin1: data.location.admin1,
        countryCode: data.location.countryCode,
        timezone: data.location.timezone,
      };
    });
  }, [data]);

  useEffect(() => {
    saveTemperatureUnit(unit);
  }, [unit]);

  const handleSelectLocation = (next: Location) => {
    saveLastLocation(next);
    setHasSavedLocation(true);
    setLocation(next);
  };

  const theme = getWeatherTheme(data?.current.weatherCode, data?.current.isDay);
  const countryCenter = isCountryCenter(location);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-night-950">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              'linear-gradient(rgba(148,163,184,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.045) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'linear-gradient(to bottom, black, transparent 85%)',
          }}
        />
        <div
          className="animate-drift absolute -left-48 top-0 h-[32rem] w-[32rem] rounded-full blur-3xl"
          style={{ backgroundColor: theme.glow, opacity: 0.55 }}
        />
        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
      </div>

      <Navbar unit={unit} onUnitChange={setUnit} />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-6 pt-8 sm:px-6 sm:pt-12">
        <section aria-labelledby="hero-title" className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-300" />
            </span>
            Live weather for any place on Earth
          </p>
          <h1 className="mt-5 font-display text-4xl font-bold tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
            Weather,{' '}
            <span className="bg-gradient-to-r from-brand-300 via-cyan-200 to-sky-400 bg-clip-text text-transparent">
              without borders.
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Search cities, neighbourhoods, regions, or countries for current conditions, hourly
            detail, and a seven-day outlook — in Celsius or Fahrenheit.
          </p>

          <div className="mt-8">
            <SearchBar onSelect={handleSelectLocation} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-night-900/50 px-3 py-1.5">
              <History className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
              {hasSavedLocation ? 'Last searched' : 'Suggested start'}:
              <strong className="font-semibold text-slate-200">{location.name}</strong>
              {location.admin1 ? <span className="text-slate-500">· {location.admin1}</span> : null}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-night-900/50 px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
              {location.country}
              <span className="text-slate-500">{formatCoordinatePair(location.latitude, location.longitude)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-night-900/50 px-3 py-1.5">
              <Globe2 className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
              Local timezone data
            </span>
          </div>
        </section>

        <div className="mt-10 sm:mt-12">
          {loading ? <WeatherSkeleton /> : null}

          {!loading && error ? (
            <ErrorState message={error} onRetry={retry} />
          ) : null}

          {!loading && !error && data ? (
            <>
              <p className="sr-only" role="status">
                Weather loaded for {data.location.name}, {data.location.country}.
              </p>
              <div className="animate-rise space-y-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                  <CurrentWeather
                    data={data}
                    selectedLocation={location}
                    unit={unit}
                    countryCenter={countryCenter}
                  />
                  <WeatherDetails current={data.current} today={data.daily[0]} unit={unit} />
                </div>

                <HourlyForecast hourly={data.hourly} unit={unit} />

                <WeeklyForecast
                  daily={data.daily}
                  currentLocalTime={data.current.time}
                  unit={unit}
                />
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
