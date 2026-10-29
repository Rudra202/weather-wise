import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import SocialAuthButtons from '../components/SocialAuthButtons';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';

const inputClass =
  'h-11 w-full rounded-xl border border-white/10 bg-night-950/60 px-3.5 text-sm text-white placeholder:text-slate-500 transition focus:border-brand-400/60 focus:outline-none focus:ring-4 focus:ring-brand-400/10';

export default function Register() {
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') navigate(redirectTo, { replace: true });
  }, [status, navigate, redirectTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!email.trim()) {
      setError('Email is required.');
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters and include a letter and a number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
      navigate(redirectTo, { replace: true });
    } catch (registerError) {
      setError(getErrorMessage(registerError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save favorite locations across devices. Your weather search remains public."
      footer={
        <>
          Already have an account?{' '}
          <Link
            to="/login"
            state={{ from: redirectTo }}
            className="font-semibold text-brand-300 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SocialAuthButtons next={redirectTo} />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-white/10" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          or create with email
        </span>
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div>
          <label htmlFor="register-name" className="mb-1.5 block text-xs font-semibold text-slate-300">
            Name
          </label>
          <input
            id="register-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Ada Lovelace"
            required
            maxLength={80}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1.5 block text-xs font-semibold text-slate-300">
            Email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
            maxLength={254}
            className={inputClass}
          />
        </div>

        <PasswordField
          id="register-password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use at least 8 characters with one letter and one number."
        />

        <PasswordField
          id="register-confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          placeholder="Repeat your password"
        />

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-400 text-sm font-semibold text-night-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? 'Creating account…' : 'Create account'}
        </button>

        <p className="text-center text-[11px] text-slate-500">
          Prefer no password?{' '}
          <Link
            to="/login"
            state={{ from: redirectTo }}
            className="font-medium text-brand-300 hover:underline"
          >
            Sign in with an email code
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
