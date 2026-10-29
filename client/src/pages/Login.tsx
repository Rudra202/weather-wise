import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';

const inputClass =
  'h-11 w-full rounded-xl border border-white/10 bg-night-950/60 px-3.5 text-sm text-white placeholder:text-slate-500 transition focus:border-brand-400/60 focus:outline-none focus:ring-4 focus:ring-brand-400/10';

export default function Login() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') navigate(redirectTo, { replace: true });
  }, [status, navigate, redirectTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(getErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to sync your saved locations. Weather search stays free and public."
      footer={
        <>
          New to WeatherWise?{' '}
          <Link
            to="/register"
            state={{ from: redirectTo }}
            className="font-semibold text-brand-300 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <SocialAuthButtons next={redirectTo} />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          or use email
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-slate-300">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
            aria-invalid={Boolean(error)}
            className={inputClass}
          />
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Your password"
        />

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            state={{ from: redirectTo }}
            className="text-xs font-medium text-brand-300 transition hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-400 text-sm font-semibold text-night-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}
