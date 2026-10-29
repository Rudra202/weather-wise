import { useEffect, useState } from 'react';
import { Check, Heart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ApiError, getErrorMessage } from '../services/api';
import { addFavorite, getFavorites } from '../services/favoriteService';
import type { Location } from '../types/weather';

interface FavoriteButtonProps {
  location: Location;
}

export default function FavoriteButton({ location }: FavoriteButtonProps) {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSaved(false);
    setError(null);
    if (!user) return;

    let cancelled = false;
    getFavorites()
      .then(({ favorites }) => {
        if (cancelled) return;
        const exists = favorites.some(
          (favorite) =>
            Math.abs(favorite.latitude - location.latitude) < 0.001 &&
            Math.abs(favorite.longitude - location.longitude) < 0.001,
        );
        setSaved(exists);
      })
      .catch(() => {
        // A failed lookup should not block saving; POST still enforces duplicates.
      });

    return () => {
      cancelled = true;
    };
  }, [user, location.latitude, location.longitude]);

  const handleClick = async () => {
    if (status === 'loading' || saving || saved) return;
    if (!user) {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addFavorite(location);
      setSaved(true);
    } catch (saveError) {
      if (saveError instanceof ApiError && saveError.code === 'ALREADY_FAVORITED') {
        setSaved(true);
      } else {
        setError(getErrorMessage(saveError));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={saving || saved || status === 'loading'}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md transition ${
          saved
            ? 'border-rose-300/30 bg-rose-400/15 text-rose-100'
            : 'border-white/20 bg-white/10 text-white hover:border-white/35 hover:bg-white/15'
        } disabled:cursor-default`}
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : saved ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Heart className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {saved ? 'Saved' : user ? 'Save place' : 'Sign in to save'}
      </button>
      {error ? (
        <span role="alert" className="max-w-[14rem] text-right text-[10px] leading-tight text-rose-100">
          {error}
        </span>
      ) : null}
    </div>
  );
}
