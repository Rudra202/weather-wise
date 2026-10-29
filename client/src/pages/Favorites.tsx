import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CloudSun,
  Heart,
  Loader2,
  MapPin,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../services/api';
import { getFavorites, removeFavorite } from '../services/favoriteService';
import type { FavoriteLocation, Location } from '../types/weather';
import { formatCoordinatePair } from '../utils/format';
import { saveLastLocation } from '../utils/storage';

export default function Favorites() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getFavorites()
      .then((data) => {
        if (cancelled) return;
        setFavorites(data.favorites);
        setLoading(false);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(getErrorMessage(loadError));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const handleView = (favorite: FavoriteLocation) => {
    const location: Location = {
      name: favorite.name,
      country: favorite.country,
      admin1: favorite.admin1,
      countryCode: favorite.countryCode,
      latitude: favorite.latitude,
      longitude: favorite.longitude,
      timezone: favorite.timezone,
    };
    saveLastLocation(location);
    navigate('/');
  };

  const handleDelete = async (favorite: FavoriteLocation) => {
    const confirmed = window.confirm(`Remove ${favorite.name} from your saved locations?`);
    if (!confirmed) return;

    setDeletingId(favorite.id);
    setActionError(null);
    try {
      await removeFavorite(favorite.id);
      setFavorites((current) => current.filter((item) => item.id !== favorite.id));
    } catch (deleteError) {
      setActionError(getErrorMessage(deleteError));
    } finally {
      setDeletingId(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen flex-col bg-night-950">
        <Navbar />
        <div className="mx-auto flex w-full max-w-5xl flex-1 items-center justify-center px-4">
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-brand-300" aria-hidden="true" />
            Checking your session…
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/favorites' }} replace />;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-night-950">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%, rgba(14,116,144,0.26), transparent 55%), radial-gradient(ellipse at 85% 25%, rgba(49,46,129,0.2), transparent 55%)',
        }}
      />
      <Navbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-300">
              Your account
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Saved places
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">
              {user.name.split(' ')[0]}, your favorite locations are stored in MongoDB and available
              whenever you sign in.
            </p>
          </div>
          {!loading && !error ? (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
              {favorites.length} {favorites.length === 1 ? 'place' : 'places'}
            </span>
          ) : null}
        </div>

        {actionError ? (
          <div
            role="alert"
            className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-300/20 bg-rose-400/10 px-3 py-2.5 text-xs text-rose-100"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        ) : null}

        {loading ? (
          <div
            role="status"
            className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <span className="sr-only">Loading saved locations…</span>
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse rounded-3xl border border-white/10 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="glass-panel mt-8 flex flex-col items-center rounded-3xl px-6 py-12 text-center"
          >
            <AlertCircle className="h-8 w-8 text-rose-300" aria-hidden="true" />
            <h2 className="mt-4 font-display text-lg font-semibold text-white">
              Could not load favorites
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-400">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-brand-300"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </button>
          </div>
        ) : favorites.length === 0 ? (
          <div className="glass-panel mt-8 flex flex-col items-center rounded-3xl px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-rose-400/10 text-rose-200">
              <Heart className="h-8 w-8" aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-xl font-semibold text-white">
              No saved locations yet
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              Search for a city on the weather dashboard and use “Save place” to keep it here.
            </p>
            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-brand-300"
            >
              <CloudSun className="h-4 w-4" aria-hidden="true" />
              Find a city
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <article
                key={favorite.id}
                className="glass-panel flex flex-col rounded-3xl p-5 transition hover:border-white/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-400/10 text-brand-300">
                    <MapPin className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDelete(favorite)}
                    disabled={deletingId === favorite.id}
                    aria-label={`Remove ${favorite.name} from favorites`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200 disabled:opacity-50"
                  >
                    {deletingId === favorite.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>

                <h2 className="mt-4 font-display text-lg font-semibold text-white">
                  {favorite.name}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {[favorite.admin1, favorite.country].filter(Boolean).join(', ') || favorite.country}
                </p>

                <dl className="mt-4 space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex justify-between gap-3">
                    <dt>Coordinates</dt>
                    <dd className="text-right text-slate-400">
                      {formatCoordinatePair(favorite.latitude, favorite.longitude)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Timezone</dt>
                    <dd className="truncate text-right text-slate-400">
                      {favorite.timezone ?? 'Local to location'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Saved</dt>
                    <dd className="text-right text-slate-400">
                      {new Date(favorite.createdAt).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => handleView(favorite)}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand-300/40 hover:bg-white/10 hover:text-white"
                >
                  <CloudSun className="h-4 w-4 text-brand-300" aria-hidden="true" />
                  View forecast
                </button>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
