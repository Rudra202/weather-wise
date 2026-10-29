import {
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import type { CurrentWeather, DailyForecast, TemperatureUnit } from '../types/weather';
import { formatLocationTime } from '../utils/format';
import { formatNumber, formatTemperature, unitSymbol } from '../utils/temperature';

interface WeatherDetailsProps {
  current: CurrentWeather;
  today: DailyForecast | undefined;
  unit: TemperatureUnit;
}

interface DetailCard {
  label: string;
  value: string;
  hint: string;
  Icon: LucideIcon;
  tone: string;
}

function compassDirection(degrees: number | null): string {
  if (degrees === null || !Number.isFinite(degrees)) return 'Wind speed';
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return `From ${points[Math.round(degrees / 22.5) % 16] ?? 'N'}`;
}

export default function WeatherDetails({ current, today, unit }: WeatherDetailsProps) {
  const symbol = unitSymbol(unit);
  const cards: DetailCard[] = [
    {
      label: 'Feels like',
      value: `${formatTemperature(current.feelsLike, unit)}°${symbol}`,
      hint: 'Apparent temperature',
      Icon: Thermometer,
      tone: 'text-amber-300',
    },
    {
      label: 'Humidity',
      value: formatNumber(current.humidity, '%'),
      hint: 'Relative humidity',
      Icon: Droplets,
      tone: 'text-cyan-300',
    },
    {
      label: 'Wind',
      value: formatNumber(current.windSpeed, ' km/h'),
      hint: compassDirection(current.windDirection),
      Icon: Wind,
      tone: 'text-sky-300',
    },
    {
      label: 'Pressure',
      value: formatNumber(current.pressure, ' hPa', 0),
      hint: 'Mean sea level',
      Icon: Gauge,
      tone: 'text-violet-300',
    },
    {
      label: 'Sunrise',
      value: today?.sunrise ? formatLocationTime(today.sunrise) : '—',
      hint: 'Local time',
      Icon: Sunrise,
      tone: 'text-orange-300',
    },
    {
      label: 'Sunset',
      value: today?.sunset ? formatLocationTime(today.sunset) : '—',
      hint: 'Local time',
      Icon: Sunset,
      tone: 'text-rose-300',
    },
  ];

  return (
    <section aria-labelledby="weather-details-title">
      <h2 id="weather-details-title" className="sr-only">
        Weather details
      </h2>
      <dl className="grid h-full grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-2">
        {cards.map(({ label, value, hint, Icon, tone }) => (
          <div
            key={label}
            className="glass-panel flex flex-col justify-between rounded-2xl p-4 transition hover:border-white/25 sm:p-5"
          >
            <dt className="flex items-center justify-between gap-2 text-xs font-medium text-slate-400">
              <span>{label}</span>
              <Icon className={`h-4 w-4 ${tone}`} aria-hidden="true" />
            </dt>
            <dd className="mt-3">
              <span className="block font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {value}
              </span>
              <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
