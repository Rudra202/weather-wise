import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { requestPasswordReset } from '../services/authService';

const inputClass =
  'h-11 w-full rounded-xl border border-white/10 bg-night-950/60 px-3.5 text-sm text-white placeholder:text-slate-500 transition focus:border-brand-400/60 focus:outline-none focus:ring-4 focus:ring-brand-400/10';

export default function ForgotPassword() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/login';

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') navigate('/', { replace: true });
  }, [status, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setDevResetUrl(null);

    if (!email.trim()) {
      setError('Enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      setNotice(result.message);
      if (result.devResetUrl) setDevResetUrl(result.devResetUrl);
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your account email and we will send a reset link if it exists."
      footer={
        <Link to="/login" state={{ from: redirectTo }} className="font-semibold text-brand-300 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-brand-300/20 bg-brand-400/10 px-3 py-2.5 text-xs text-brand-100"
        >
          {notice}
          {devResetUrl ? (
            <p className="mt-2 break-all text-[11px] text-slate-300">
              Development mode: <a className="underline" href={devResetUrl}>{devResetUrl}</a>
            </p>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        <div>
          <label htmlFor="reset-email" className="mb-1.5 block text-xs font-semibold text-slate-300">
            Email
          </label>
          <input
            id="reset-email"
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

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-400 text-sm font-semibold text-night-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Mail className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>
    </AuthLayout>
  );
}
