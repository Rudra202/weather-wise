import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import PasswordField from '../components/PasswordField';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { resetPassword } from '../services/authService';

export default function ResetPassword() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) setError('This reset link is missing or invalid.');
  }, [token]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('This reset link is missing or invalid.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      await refresh();
      navigate('/', { replace: true });
    } catch (resetError) {
      setError(getErrorMessage(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter a new password for your account."
      footer={
        <Link to="/login" className="font-semibold text-brand-300 hover:underline">
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

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4" noValidate>
        <PasswordField
          id="reset-password"
          label="New password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="At least 8 characters"
        />
        <PasswordField
          id="reset-confirm"
          label="Confirm password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Repeat your password"
        />

        <button
          type="submit"
          disabled={submitting || !token}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-400 text-sm font-semibold text-night-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          )}
          {submitting ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </AuthLayout>
  );
}
