import { CloudSun, Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-night-950">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="glass-panel max-w-md rounded-3xl px-6 py-12 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-400/10 text-brand-300">
            <CloudSun className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-300">
            404
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">
            This forecast drifted away
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            The page you are looking for does not exist. Head back to the dashboard to search for a
            location.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-2 text-sm font-semibold text-night-950 transition hover:bg-brand-300"
          >
            <HomeIcon className="h-4 w-4" aria-hidden="true" />
            Back to weather
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
