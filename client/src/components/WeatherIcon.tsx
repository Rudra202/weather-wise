import { getWeatherVisual } from '../utils/weatherCodes';

interface WeatherIconProps {
  code: number | null | undefined;
  isDay?: boolean | null;
  className?: string;
  strokeWidth?: number;
}

export default function WeatherIcon({
  code,
  isDay = true,
  className = 'h-6 w-6',
  strokeWidth = 1.6,
}: WeatherIconProps) {
  const visual = getWeatherVisual(code, isDay);
  const Icon = visual.Icon;
  return (
    <Icon
      className={`${className} ${visual.tone}`}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}
