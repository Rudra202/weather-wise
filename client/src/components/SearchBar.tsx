import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { AlertCircle, Loader2, LocateFixed, Search, X } from 'lucide-react';
import { getErrorMessage } from '../services/api';
import { searchLocations } from '../services/weatherService';
import type { Location } from '../types/weather';
import LocationSuggestions from './LocationSuggestions';

interface SearchBarProps {
  onSelect: (location: Location) => void;
}

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 350;

export default function SearchBar({ onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [retryKey, setRetryKey] = useState(0);
  const [locating, setLocating] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);
  const requestId = useRef(0);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    if (trimmed.length < MIN_QUERY_LENGTH) {
      requestId.current += 1;
      setLocations([]);
      setError(null);
      setLoading(false);
      setActiveIndex(-1);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError(null);
    setOpen(true);

    const timer = window.setTimeout(() => {
      searchLocations(trimmed, controller.signal)
        .then((data) => {
          if (controller.signal.aborted || requestId.current !== currentRequest) return;
          setLocations(data.locations);
          setActiveIndex(data.locations.length > 0 ? 0 : -1);
          setLoading(false);
        })
        .catch((searchError: unknown) => {
          if (controller.signal.aborted || requestId.current !== currentRequest) return;
          setLocations([]);
          setActiveIndex(-1);
          setError(getErrorMessage(searchError));
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, retryKey]);

  const chooseLocation = (location: Location) => {
    skipNextSearch.current = true;
    setQuery(location.name);
    setLocations([]);
    setError(null);
    setLoading(false);
    setOpen(false);
    setActiveIndex(-1);
    onSelect(location);
    inputRef.current?.blur();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loading) return;
    const location = locations[activeIndex] ?? locations[0];
    if (location) chooseLocation(location);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      if (locations.length === 0) return;
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        if (current < 0) return direction === 1 ? 0 : locations.length - 1;
        return (current + direction + locations.length) % locations.length;
      });
      return;
    }

    if (event.key === 'Enter' && open && locations.length > 0) {
      event.preventDefault();
      const location = locations[activeIndex] ?? locations[0];
      if (location) chooseLocation(location);
    }
  };

  const handleChange = (value: string) => {
    skipNextSearch.current = false;
    setQuery(value);
    setError(null);
    setOpen(true);
  };

  const clearSearch = () => {
    skipNextSearch.current = false;
    setQuery('');
    setLocations([]);
    setError(null);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setError('Location is not supported by this browser.');
      setOpen(true);
      return;
    }
    setLocating(true);
    setError(null);
    setOpen(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const location: Location = {
          name: 'Your location',
          country: '',
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timezone: null,
        };
        onSelect(location);
      },
      (geoError) => {
        setLocating(false);
        const message =
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was denied. Search for a place instead.'
            : 'Could not determine your location. Try again or search manually.';
        setError(message);
        setOpen(true);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-3xl">
      <form role="search" onSubmit={handleSubmit} className="relative">
        <label htmlFor="location-search" className="sr-only">
          Search for a city, neighbourhood, locality, or country
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="location-search"
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="location-suggestions"
          aria-autocomplete="list"
          aria-activedescendant={
            open && activeIndex >= 0 ? `location-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          spellCheck={false}
          maxLength={80}
          value={query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            if (query.trim().length >= MIN_QUERY_LENGTH) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search any city, neighbourhood, locality, or country…"
          className="h-14 w-full rounded-2xl border border-white/15 bg-night-900/80 pl-12 pr-24 text-sm text-white shadow-glass backdrop-blur-xl transition placeholder:text-slate-500 hover:border-white/25 focus:border-brand-400/60 focus:bg-night-900 focus:outline-none focus:ring-4 focus:ring-brand-400/10 sm:h-16 sm:text-base"
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-300" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={handleUseMyLocation}
              aria-label="Use my current location"
              title="Use my current location"
              className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <LocateFixed className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-brand-300" aria-hidden="true" />
          ) : null}
          {query ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="h-9 w-9 place-items-center rounded-full text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </form>

      <LocationSuggestions
        open={open}
        query={query}
        locations={locations}
        loading={loading}
        error={error}
        activeIndex={activeIndex}
        onSelect={chooseLocation}
        onHover={setActiveIndex}
        onRetry={() => {
          setOpen(true);
          setRetryKey((key) => key + 1);
        }}
      />

      {error && query.trim().length < MIN_QUERY_LENGTH ? (
        <div
          role="alert"
          className="mt-2 flex items-start gap-2.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <p className="mt-2 px-1 text-center text-[11px] text-slate-500">
        Geocoding by Open-Meteo, Photon (OpenStreetMap), and Esri · Cities, neighbourhoods, and localities worldwide
      </p>
    </div>
  );
}
