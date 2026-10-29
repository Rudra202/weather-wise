import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="glass-panel mx-auto flex max-w-xl flex-col items-center rounded-3xl px-6 py-12 text-center"
    >
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-rose-400/10 text-rose-300">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </span>
      <h2 className="mt-5 font-display text-xl font-semibold text-white">Weather unavailable</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-brand-300"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
      <p className="mt-4 text-[11px] text-slate-500">
        If this keeps happening, check that the API server is running.
      </p>
    </div>
  );
}

export function WeatherSkeleton() {
  return (
    <div role="status" aria-live="polite" className="space-y-6">
      <span className="sr-only">Loading weather…</span>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="min-h-[26rem] animate-pulse rounded-3xl border border-white/10 bg-gradient-to-br from-night-800 to-night-900" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[6.5rem] animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
            />
          ))}
        </div>
      </div>
      <div className="h-44 animate-pulse rounded-3xl border border-white/10 bg-white/[0.045]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, index) => (
          <div
            key={index}
            className="h-48 animate-pulse rounded-2xl border border-white/10 bg-white/[0.045]"
          />
        ))}
      </div>
    </div>
  );
}
