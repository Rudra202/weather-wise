import type { TemperatureUnit } from '../types/weather';

interface UnitToggleProps {
  unit: TemperatureUnit;
  onChange: (unit: TemperatureUnit) => void;
}

const options: Array<{ value: TemperatureUnit; label: string }> = [
  { value: 'celsius', label: 'Celsius' },
  { value: 'fahrenheit', label: 'Fahrenheit' },
];

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  return (
    <div
      role="group"
      aria-label="Temperature unit"
      className="flex items-center rounded-full border border-white/10 bg-white/5 p-1"
    >
      {options.map((option) => {
        const active = unit === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            aria-label={`°${option.value === 'celsius' ? 'C' : 'F'} (${option.label})`}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition sm:px-3 ${
              active
                ? 'bg-brand-400 text-night-950 shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            °{option.value === 'celsius' ? 'C' : 'F'}
          </button>
        );
      })}
    </div>
  );
}
