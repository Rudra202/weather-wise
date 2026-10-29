import { useEffect, useState } from 'react';
import {
  CalendarDays,
  ChevronDown,
  CloudRain,
  Droplets,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import type { DailyForecast, TemperatureUnit } from '../types/weather';
import {
  formatForecastDateFull,
  formatForecastDay,
  formatHour,
  formatLocationTime,
  formatShortDate,
} from '../utils/format';
import { formatNumber, formatTemperature } from '../utils/temperature';
import WeatherIcon from './WeatherIcon';

interface WeeklyForecastProps {
  daily: DailyForecast[];
  currentLocalTime: string | null;
  unit: TemperatureUnit;
}

interface DayStat {
  label: string;
  value: string;
  Icon: LucideIcon;
  tone: string;
}

export default function WeeklyForecast({
  daily,
  currentLocalTime,
  unit,
}: WeeklyForecastProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(daily[0]?.date ?? null);

  // Keep the open day valid when the user searches for another place.
  useEffect(() => {
    setSelectedDate((current) =>
      current && daily.some((day) => day.date === current)
        ? current
        : (daily[0]?.date ?? null),
    );
  }, [daily]);

  if (daily.length === 0) return null;

  const minima = daily.flatMap((day) =>
    typeof day.tempMin === 'number' ? [day.tempMin] : [],
  );
  const maxima = daily.flatMap((day) =>
    typeof day.tempMax === 'number' ? [day.tempMax] : [],
  );
  const lowest = minima.length > 0 ? Math.min(...minima) : 0;
  const highest = maxima.length > 0 ? Math.max(...maxima) : 1;
  const span = Math.max(highest - lowest, 1);

  const selected = daily.find((day) => day.date === selectedDate) ?? daily[0];
  const selectedHours = selected.hourly ?? [];
  const selectedLabel = formatForecastDateFull(selected.date);
  const currentHourKey = currentLocalTime?.slice(0, 13) ?? null;

  const stats: DayStat[] = [
    {
      label: 'Rain chance',
      value: formatNumber(selected.precipitationProbabilityMax, '%'),
      Icon: Droplets,
      tone: 'text-cyan-300',
    },
    {
      label: 'Rainfall',
      value: formatNumber(selected.precipitationSum, ' mm', 1),
      Icon: CloudRain,
      tone: 'text-sky-300',
    },
    {
      label: 'Max wind',
      value: formatNumber(selected.windSpeedMax, ' km/h'),
      Icon: Wind,
      tone: 'text-teal-300',
    },
    {
      label: 'Max UV',
      value: formatNumber(selected.uvIndexMax, '', 1),
      Icon: Sun,
      tone: 'text-amber-300',
    },
  ];

  return (
    <section aria-labelledby="weekly-forecast-title" className="glass-panel rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="weekly-forecast-title"
            className="flex items-center gap-2 font-display text-lg font-semibold text-white"
          >
            <CalendarDays className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
            {daily.length}-day forecast
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Daily highs and lows, local dates · Select a day for its hourly detail
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label="Choose a forecast day"
        className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-7"
      >
        {daily.map((day) => {
          const isToday = formatForecastDay(day.date, currentLocalTime) === 'Today';
          const isSelected = day.date === selected.date;
          const min = typeof day.tempMin === 'number' ? day.tempMin : null;
          const max = typeof day.tempMax === 'number' ? day.tempMax : null;
          const left = min !== null ? ((min - lowest) / span) * 100 : 0;
          const width = min !== null && max !== null ? ((max - min) / span) * 100 : 0;
          const dayLabel = formatForecastDay(day.date, currentLocalTime);

          return (
            <button
              key={day.date}
              type="button"
              aria-pressed={isSelected}
              aria-label={`${dayLabel}, ${formatShortDate(day.date)}: ${day.condition}, high ${formatTemperature(day.tempMax, unit, { withUnit: true })}, low ${formatTemperature(day.tempMin, unit, { withUnit: true })}.`}
              onClick={() => setSelectedDate(day.date)}
              className={`group rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950 ${
                isSelected
                  ? 'border-brand-300/60 bg-brand-400/15 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]'
                  : isToday
                    ? 'border-brand-300/35 bg-brand-400/[0.07] hover:border-brand-300/55 hover:bg-brand-400/10'
                    : 'border-white/10 bg-white/[0.035] hover:border-white/25 hover:bg-white/[0.07]'
              }`}
            >
              <span className="flex items-start justify-between gap-1">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    isSelected || isToday ? 'text-brand-300' : 'text-slate-400'
                  }`}
                >
                  {dayLabel}
                </span>
                <ChevronDown
                  className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform ${
                    isSelected ? 'rotate-180 text-brand-300' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span className="mt-0.5 block text-[10px] text-slate-400">
                {formatShortDate(day.date)}
              </span>
              <WeatherIcon code={day.weatherCode} isDay className="mx-auto mt-3 h-8 w-8" />
              <span
                className="mt-3 line-clamp-1 block text-center text-[11px] font-medium text-slate-300"
                title={day.condition}
              >
                {day.condition}
              </span>
              <span className="mt-2 flex items-baseline justify-center gap-1.5 font-display text-sm">
                <span className="font-semibold text-white">
                  {formatTemperature(day.tempMax, unit)}°
                </span>
                <span className="text-slate-400">{formatTemperature(day.tempMin, unit)}°</span>
              </span>
              <span className="mt-2 block h-1 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-amber-300"
                  style={{ marginLeft: `${left}%`, width: `${Math.max(width, 6)}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="daily-detail-panel"
        role="region"
        aria-labelledby="daily-detail-title"
        className="animate-rise mt-4 rounded-2xl border border-brand-300/25 bg-night-900/60 p-4 sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <WeatherIcon code={selected.weatherCode} isDay className="mt-0.5 h-10 w-10 shrink-0" />
            <div>
              <h3
                id="daily-detail-title"
                className="font-display text-base font-semibold text-white"
              >
                {selectedLabel}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {selected.condition} · High{' '}
                <strong className="font-semibold text-slate-200">
                  {formatTemperature(selected.tempMax, unit, { withUnit: true })}
                </strong>{' '}
                · Low{' '}
                <strong className="font-semibold text-slate-200">
                  {formatTemperature(selected.tempMin, unit, { withUnit: true })}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
              <Sunrise className="h-3.5 w-3.5 text-orange-300" aria-hidden="true" />
              Sunrise {selected.sunrise ? formatLocationTime(selected.sunrise) : '—'}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-slate-300">
              <Sunset className="h-3.5 w-3.5 text-rose-300" aria-hidden="true" />
              Sunset {selected.sunset ? formatLocationTime(selected.sunset) : '—'}
            </span>
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(({ label, value, Icon, tone }) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5"
            >
              <dt className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                <Icon className={`h-3.5 w-3.5 ${tone}`} aria-hidden="true" />
                {label}
              </dt>
              <dd className="mt-1 font-display text-sm font-semibold text-white">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Hourly forecast
          </p>
          {selectedHours.length > 0 ? (
            <div className="no-scrollbar mt-2 flex snap-x gap-2 overflow-x-auto pb-1">
              {selectedHours.map((hour) => {
                const isNow = hour.time.slice(0, 13) === currentHourKey;
                return (
                  <div
                    key={hour.time}
                    className={`w-[4.6rem] shrink-0 snap-start rounded-xl border px-2 py-2.5 text-center ${
                      isNow
                        ? 'border-brand-300/55 bg-brand-400/15'
                        : 'border-white/10 bg-white/[0.035]'
                    }`}
                    title={`${hour.condition} · ${formatTemperature(hour.temperature, unit, { withUnit: true })}`}
                  >
                    <p
                      className={`text-[10px] font-medium ${
                        isNow ? 'text-brand-300' : 'text-slate-400'
                      }`}
                    >
                      {isNow ? 'Now' : formatHour(hour.time)}
                    </p>
                    <WeatherIcon
                      code={hour.weatherCode}
                      isDay={hour.isDay}
                      className="mx-auto mt-1.5 h-5 w-5"
                    />
                    <p className="mt-1.5 font-display text-sm font-semibold text-white">
                      {formatTemperature(hour.temperature, unit)}°
                    </p>
                    <p className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-cyan-200/80">
                      {hour.precipitationProbability !== null &&
                      hour.precipitationProbability > 0 ? (
                        <>
                          <Droplets className="h-2.5 w-2.5" aria-hidden="true" />
                          {hour.precipitationProbability}%
                        </>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-400">
              Hourly detail is not available for this day.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
