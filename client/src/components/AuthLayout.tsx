import type { ReactNode } from 'react';
import { ArrowLeft, CloudSun } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-night-950">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 15% 0%, rgba(14,116,144,0.32), transparent 55%), radial-gradient(ellipse at 90% 20%, rgba(49,46,129,0.28), transparent 52%), radial-gradient(ellipse at 50% 110%, rgba(8,145,178,0.16), transparent 60%)',
        }}
      />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5" aria-label="WeatherWise home">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 text-night-950">
              <CloudSun className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="font-display text-lg font-bold text-white">WeatherWise</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to weather
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md animate-rise">
            <div className="glass-panel rounded-3xl p-6 sm:p-8">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>
              <div className="mt-6">{children}</div>
            </div>
            <div className="mt-5 text-center text-sm text-slate-400">{footer}</div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Weather data by{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="text-brand-300 hover:underline"
          >
            Open-Meteo.com
          </a>
        </p>
      </div>
    </div>
  );
}
