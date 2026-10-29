import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  hint?: string;
}

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  hint,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required
          aria-describedby={hintId}
          className="h-11 w-full rounded-xl border border-white/10 bg-night-950/60 px-3.5 pr-11 text-sm text-white placeholder:text-slate-500 transition focus:border-brand-400/60 focus:outline-none focus:ring-4 focus:ring-brand-400/10"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {hint ? (
        <p id={hintId} className="mt-1.5 text-[11px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
