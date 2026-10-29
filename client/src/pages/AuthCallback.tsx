import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { useAuth } from '../hooks/useAuth';

function safeNext(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/';
  }
  return value.slice(0, 200);
}

export default function AuthCallback() {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const status = params.get('status');
  const reason = params.get('reason');
  const next = safeNext(params.get('next'));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'error') {
      setError(
        reason === 'access_denied'
          ? 'Sign-in was cancelled.'
          : 'We could not complete sign-in. Please try again.',
      );
      return;
    }

    let active = true;
    void refresh().then((user) => {
      if (!active) return;
      if (user) {
        navigate(next, { replace: true });
      } else {
        setError('We could not complete sign-in. Please try again.');
      }
    });

    return () => {
      active = false;
    };
  }, [refresh, navigate, next, status, reason]);

  return (
    <AuthLayout
      title={error ? 'Sign-in failed' : 'Signing you in'}
      subtitle={
        error
          ? 'No changes were made to your account.'
          : 'Finishing the secure sign-in and restoring your session.'
      }
      footer={
        <Link to="/login" className="font-semibold text-brand-300 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-100"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2.5 text-sm text-slate-300"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Verifying your sign-in…
        </div>
      )}
    </AuthLayout>
  );
}
