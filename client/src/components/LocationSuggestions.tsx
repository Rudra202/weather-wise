import { Globe2, Loader2, MapPin, RefreshCw, SearchX } from 'lucide-react';
import type { Location } from '../types/weather';
import { isCountryCenter } from '../utils/storage';

interface LocationSuggestionsProps {
  open: boolean;
  query: string;
  locations: Location[];
  loading: boolean;
  error: string | null;
  activeIndex: number;
  onSelect: (location: Location) => void;
  onHover: (index: number) => void;
  onRetry: () => void;
}

export default function LocationSuggestions({
  open,
  query,
  locations,
  loading,
  error,
  activeIndex,
  onSelect,
  onHover,
  onRetry,
}: LocationSuggestionsProps) {
  if (!open || query.trim().length < 2) return null;

  const hasResults = locations.length > 0;

  return (
    <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-2xl border border-white/15 bg-night-900/95 shadow-2xl backdrop-blur-xl">
      {loading ? (
        <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-300">
          <Loader2 className="h-4 w-4 animate-spin text-brand-300" aria-hidden="true" />
          Searching locations worldwide…
        </div>
      ) : error ? (
        <div className="flex items-start justify-between gap-3 px-4 py-4">
          <div className="flex items-start gap-3">
            <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-rose-100">Search failed</p>
              <p className="mt-0.5 text-xs text-slate-400">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-white/10"
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            Retry
          </button>
        </div>
      ) : hasResults ? (
        <>
          <ul
            id="location-suggestions"
            role="listbox"
            aria-label="Location suggestions"
            className="max-h-[22rem] overflow-y-auto p-1.5"
          >
            {locations.map((location, index) => {
              const countryCenter = isCountryCenter(location);
              const active = index === activeIndex;
              const region = [
                ...new Set(
                  [location.admin2, location.admin1, location.country].filter(
                    (part): part is string => Boolean(part),
                  ),
                ),
              ].join(', ');
              return (
                <li key={`${location.id ?? 'loc'}-${location.latitude}-${location.longitude}`} role="none">
                  <button
                    type="button"
                    id={`location-option-${index}`}
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => onHover(index)}
                    onClick={() => onSelect(location)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      active ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                        countryCenter
                          ? 'bg-amber-400/10 text-amber-300'
                          : 'bg-brand-400/10 text-brand-300'
                      }`}
                    >
                      {countryCenter ? (
                        <Globe2 className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-white">
                          {location.name}
                        </span>
                        {countryCenter ? (
                          <span className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                            Country center
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-400">
                        {countryCenter ? location.country : region || 'Unknown region'}
                        <span className="ml-1.5 text-slate-500">
                          {location.latitude.toFixed(2)}, {location.longitude.toFixed(2)}
                        </span>
                      </span>
                    </span>
                    {location.countryCode ? (
                      <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-slate-400">
                        {location.countryCode}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          {locations.some(isCountryCenter) ? (
            <p className="border-t border-white/10 px-4 py-2.5 text-[11px] leading-relaxed text-slate-400">
              Country results use a country-center coordinate. Pick a city for local conditions.
            </p>
          ) : null}
        </>
      ) : (
        <div className="flex items-start gap-3 px-4 py-4">
          <SearchX className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-slate-200">No places found</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Nothing matched “{query.trim()}”. Try a nearby city, a neighbourhood name, or a
              district.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
