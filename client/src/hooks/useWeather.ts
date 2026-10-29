import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';
import { getWeather } from '../services/weatherService';
import type { Location, WeatherData } from '../types/weather';

interface WeatherState {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

interface UseWeatherResult extends WeatherState {
  retry: () => void;
}

/**
 * Owns one forecast request for the selected location. Components receive the
 * same data instead of each fetching independently.
 */
export function useWeather(location: Location | null): UseWeatherResult {
  const [state, setState] = useState<WeatherState>({
    data: null,
    loading: Boolean(location),
    error: null,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!location) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    getWeather(location, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setState({ data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ data: null, loading: false, error: getErrorMessage(error) });
      });

    return () => controller.abort();
  }, [location, refreshKey]);

  const retry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  return { ...state, retry };
}
