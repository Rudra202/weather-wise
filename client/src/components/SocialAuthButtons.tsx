// Buttons reflect provider availability reported by the API.
// Availability is checked once on mount.
import { useEffect, useState } from 'react';
import { Github } from 'lucide-react';
import { apiRequest, API_BASE_URL } from '../services/api';

interface SocialAuthButtonsProps {
  next?: string;
}

type Provider = 'google' | 'github';
type Availability = Record<Provider, boolean>;

function oauthHref(provider: Provider, next: string): string {
  const params = new URLSearchParams();
  if (next && next !== '/') params.set('next', next);
  const query = params.toString();
  return `${API_BASE_URL}/auth/oauth/${provider}${query ? `?${query}` : ''}`;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.24c1.9-1.75 2.98-4.33 2.98-7.36Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.63-2.42l-3.24-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.59A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.91a6 6 0 0 1 0-3.82V7.5H3.06a10 10 0 0 0 0 9l3.34-2.59Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.59C7.19 7.72 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

export default function SocialAuthButtons({ next = '/' }: SocialAuthButtonsProps) {
  const [available, setAvailable] = useState<Availability | null>(null);

  useEffect(() => {
    let active = true;
    apiRequest<Availability>('/auth/oauth/providers')
      .then((value) => {
        if (active) setAvailable(value);
      })
      .catch(() => {
        // If the availability check fails, keep the buttons usable. The OAuth
        // start route still returns a clear error for an unconfigured provider.
        if (active) setAvailable({ google: true, github: true });
      });
    return () => {
      active = false;
    };
  }, []);

  const buttonClass =
    'inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-100 transition hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-4 focus:ring-brand-400/10';
  const disabledClass =
    'inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-sm font-semibold text-slate-500';

  const googleEnabled = available?.google !== false;
  const githubEnabled = available?.github !== false;

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {googleEnabled ? (
          <a href={oauthHref('google', next)} className={buttonClass}>
            <GoogleIcon />
            Continue with Google
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={disabledClass}
            title="Google sign-in is not configured on this server."
          >
            <GoogleIcon />
            Continue with Google
          </button>
        )}

        {githubEnabled ? (
          <a href={oauthHref('github', next)} className={buttonClass}>
            <Github className="h-4 w-4" aria-hidden="true" />
            Continue with GitHub
          </a>
        ) : (
          <button
            type="button"
            disabled
            className={disabledClass}
            title="GitHub sign-in is not configured on this server."
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            Continue with GitHub
          </button>
        )}
      </div>

      {!googleEnabled || !githubEnabled ? (
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
          Some social sign-in options are unavailable right now. Use email and password or a
          one-time code instead.
        </p>
      ) : null}
    </div>
  );
}
