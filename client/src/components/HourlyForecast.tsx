import { Clock3, Droplets } from 'lucide-react';
import type { HourlyForecast as HourlyItem, TemperatureUnit } from '../types/weather';
import { formatHour } from '../utils/format';
import { formatTemperature } from '../utils/temperature';
import WeatherIcon from './WeatherIcon';

interface HourlyForecastProps {
  hourly: HourlyItem[];
  unit: TemperatureUnit;
}

export default function HourlyForecast({ hourly, unit }: HourlyForecastProps) {
  if (hourly.length === 0) return null;

  return (
    <section
      aria-labelledby="hourly-forecast-title"
      className="glass-panel rounded-3xl p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2
            id="hourly-forecast-title"
            className="flex items-center gap-2 font-display text-lg font-semibold text-white"
          >
            <Clock3 className="h-4.5 w-4.5 text-brand-300" aria-hidden="true" />
            Next 24 hours
          </h2>
          <p className="mt-1 text-xs text-slate-400">Hourly outlook in the location&apos;s local time</p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Scroll →</span>
      </div>

      <div className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto pb-1">
        {hourly.map((hour, index) => (
          <div
            key={hour.time}
            className="w-[5.4rem] shrink-0 snap-start rounded-2xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center transition hover:border-white/20 hover:bg-white/[0.07]"
            title={`${hour.condition} · ${formatTemperature(hour.temperature, unit, { withUnit: true })}`}
          >
            <p className="text-[11px] font-medium text-slate-400">
              {index === 0 ? 'Next' : formatHour(hour.time)}
            </p>
            <WeatherIcon
              code={hour.weatherCode}
              isDay={hour.isDay}
              className="mx-auto mt-2 h-6 w-6"
            />
            <p className="mt-2 font-display text-base font-semibold text-white">
              {formatTemperature(hour.temperature, unit)}°
            </p>
            <p className="mt-1 flex items-center justify-center gap-0.5 text-[10px] text-cyan-200/80">
              {hour.precipitationProbability !== null && hour.precipitationProbability > 0 ? (
                <>
                  <Droplets className="h-2.5 w-2.5" aria-hidden="true" />
                  {hour.precipitationProbability}%
                </>
              ) : (
                <span className="text-slate-600">—</span>
              )}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
