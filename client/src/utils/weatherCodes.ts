import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudHail,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  HelpCircle,
  Moon,
  Snowflake,
  Sun,
  type LucideIcon,
} from 'lucide-react';

export interface WeatherVisual {
  label: string;
  Icon: LucideIcon;
  tone: string;
}

const UNKNOWN: WeatherVisual = {
  label: 'Unknown conditions',
  Icon: HelpCircle,
  tone: 'text-slate-300',
};

/**
 * Maps WMO weather interpretation codes to a label and a Lucide icon.
 * Keep this in sync with server/src/utils/weatherCodes.ts.
 */
export function getWeatherVisual(
  code: number | null | undefined,
  isDay: boolean | null = true,
): WeatherVisual {
  if (typeof code !== 'number' || !Number.isFinite(code)) return UNKNOWN;

  if (code === 0) {
    return isDay === false
      ? { label: 'Clear sky', Icon: Moon, tone: 'text-indigo-200' }
      : { label: 'Clear sky', Icon: Sun, tone: 'text-amber-300' };
  }
  if (code === 1) {
    return isDay === false
      ? { label: 'Mainly clear', Icon: Moon, tone: 'text-indigo-200' }
      : { label: 'Mainly clear', Icon: Sun, tone: 'text-amber-300' };
  }
  if (code === 2) {
    return isDay === false
      ? { label: 'Partly cloudy', Icon: CloudMoon, tone: 'text-slate-200' }
      : { label: 'Partly cloudy', Icon: CloudSun, tone: 'text-amber-200' };
  }
  if (code === 3) return { label: 'Overcast', Icon: Cloud, tone: 'text-slate-300' };
  if (code === 45 || code === 48) {
    return { label: 'Fog', Icon: CloudFog, tone: 'text-slate-300' };
  }
  if (code >= 51 && code <= 57) {
    return { label: 'Drizzle', Icon: CloudDrizzle, tone: 'text-cyan-200' };
  }
  if (code >= 61 && code <= 67) {
    return { label: 'Rain', Icon: CloudRain, tone: 'text-sky-300' };
  }
  if (code >= 71 && code <= 77) {
    return { label: 'Snow', Icon: CloudSnow, tone: 'text-sky-100' };
  }
  if (code >= 80 && code <= 82) {
    return { label: 'Rain showers', Icon: CloudRain, tone: 'text-sky-300' };
  }
  if (code === 85 || code === 86) {
    return { label: 'Snow showers', Icon: Snowflake, tone: 'text-sky-100' };
  }
  if (code === 95) {
    return { label: 'Thunderstorm', Icon: CloudLightning, tone: 'text-violet-300' };
  }
  if (code === 96 || code === 99) {
    return { label: 'Thunderstorm with hail', Icon: CloudHail, tone: 'text-violet-300' };
  }
  return UNKNOWN;
}

export interface WeatherTheme {
  backgroundImage: string;
  glow: string;
}

export function getWeatherTheme(
  code: number | null | undefined,
  isDay: boolean | null = true,
): WeatherTheme {
  if (typeof code !== 'number' || !Number.isFinite(code)) {
    return {
      backgroundImage: 'linear-gradient(135deg, #0f2f46 0%, #155e75 52%, #1e3a5f 100%)',
      glow: 'rgba(56, 189, 248, 0.2)',
    };
  }

  if (code === 0 || code === 1) {
    return isDay === false
      ? {
          backgroundImage:
            'linear-gradient(135deg, #101a3d 0%, #17356b 52%, #312e81 100%)',
          glow: 'rgba(129, 140, 248, 0.32)',
        }
      : {
          backgroundImage:
            'linear-gradient(135deg, #0c4a6e 0%, #0284c7 46%, #f59e0b 125%)',
          glow: 'rgba(251, 191, 36, 0.28)',
        };
  }
  if (code === 2) {
    return isDay === false
      ? {
          backgroundImage:
            'linear-gradient(135deg, #0f172a 0%, #1e3a5f 55%, #334155 100%)',
          glow: 'rgba(148, 163, 184, 0.22)',
        }
      : {
          backgroundImage:
            'linear-gradient(135deg, #0e4f68 0%, #0e7490 48%, #64748b 120%)',
          glow: 'rgba(125, 211, 252, 0.2)',
        };
  }
  if (code === 3) {
    return {
      backgroundImage: 'linear-gradient(135deg, #16232f 0%, #334155 60%, #475569 100%)',
      glow: 'rgba(148, 163, 184, 0.18)',
    };
  }
  if (code === 45 || code === 48) {
    return {
      backgroundImage: 'linear-gradient(135deg, #1f2937 0%, #475569 60%, #64748b 100%)',
      glow: 'rgba(203, 213, 225, 0.16)',
    };
  }
  if (code !== null && code >= 51 && code <= 67) {
    return {
      backgroundImage: 'linear-gradient(135deg, #0f2f46 0%, #155e75 50%, #1e40af 100%)',
      glow: 'rgba(56, 189, 248, 0.22)',
    };
  }
  if (code !== null && ((code >= 71 && code <= 77) || code === 85 || code === 86)) {
    return {
      backgroundImage: 'linear-gradient(135deg, #1e3a5f 0%, #3b82a0 55%, #94a3b8 100%)',
      glow: 'rgba(224, 242, 254, 0.24)',
    };
  }
  if (code !== null && code >= 80 && code <= 82) {
    return {
      backgroundImage: 'linear-gradient(135deg, #0b2b40 0%, #0e7490 52%, #1d4ed8 100%)',
      glow: 'rgba(56, 189, 248, 0.22)',
    };
  }
  if (code !== null && code >= 95) {
    return {
      backgroundImage: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 55%, #0f172a 100%)',
      glow: 'rgba(167, 139, 250, 0.24)',
    };
  }
  return {
    backgroundImage: 'linear-gradient(135deg, #0f2f46 0%, #155e75 52%, #1e3a5f 100%)',
    glow: 'rgba(56, 189, 248, 0.2)',
  };
}
