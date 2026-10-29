import { CloudSun, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-night-950/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-brand-300" aria-hidden="true" />
          <span>
            <span className="font-semibold text-slate-200">WeatherWise</span> · A full-stack weather
            dashboard
          </span>
        </div>
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span>Weather data by</span>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 font-medium text-brand-300 underline-offset-2 hover:underline"
          >
            Open-Meteo.com
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <span>· Free non-commercial API</span>
          <Link to="/" className="sr-only">
            WeatherWise home
          </Link>
        </p>
      </div>
    </footer>
  );
}
