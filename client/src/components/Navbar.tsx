import { useState } from 'react';
import { CloudSun, Heart, LogIn, LogOut, UserRound } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { TemperatureUnit } from '../types/weather';
import UnitToggle from './UnitToggle';

interface NavbarProps {
  unit?: TemperatureUnit;
  onUnitChange?: (unit: TemperatureUnit) => void;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full px-3 py-1.5 text-sm font-medium transition ${
    isActive
      ? 'bg-white/10 text-white'
      : 'text-slate-300 hover:bg-white/5 hover:text-white'
  }`;

export default function Navbar({ unit, onUnitChange }: NavbarProps) {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-950/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="WeatherWise home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-300 to-brand-600 text-night-950 shadow-glow">
            <CloudSun className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-base font-bold tracking-tight text-white sm:text-lg">
              WeatherWise
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-brand-300/80 sm:block">
              Worldwide
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Weather
          </NavLink>
          <NavLink to="/favorites" className={navLinkClass}>
            Favorites
          </NavLink>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <NavLink
            to="/favorites"
            aria-label="Saved locations"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:text-white md:hidden"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
          </NavLink>

          {unit && onUnitChange ? <UnitToggle unit={unit} onChange={onUnitChange} /> : null}

          {status === 'loading' ? (
            <span className="h-9 w-20 animate-pulse rounded-full bg-white/10" aria-label="Loading account" />
          ) : user ? (
            <div className="flex items-center gap-1">
              <span
                title={user.name}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-xs font-medium text-slate-200 sm:px-3"
              >
                <UserRound className="h-3.5 w-3.5 text-brand-300" aria-hidden="true" />
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
              </span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                aria-label="Log out"
                title="Log out"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-rose-300/40 hover:text-rose-200 disabled:opacity-50"
              >
                <LogOut className={`h-4 w-4 ${loggingOut ? 'animate-pulse' : ''}`} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-brand-300/40 hover:text-white"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                Log in
              </Link>
              <Link
                to="/register"
                className="hidden rounded-full bg-brand-400 px-3 py-1.5 text-xs font-semibold text-night-950 transition hover:bg-brand-300 sm:inline-flex"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
