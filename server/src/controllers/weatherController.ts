import type { Request, Response } from 'express';
import { getForecast, searchLocations } from '../services/weatherService.js';
import { numberInRange, optionalString, requiredString } from '../utils/validation.js';

export async function search(req: Request, res: Response): Promise<void> {
  const query = requiredString(req.query.q, 'Search query', { min: 2, max: 80 });
  const locations = await searchLocations(query);

  res.json({
    success: true,
    data: {
      query,
      locations,
    },
  });
}

export async function currentWeather(req: Request, res: Response): Promise<void> {
  const latitude = numberInRange(req.query.lat, 'Latitude', -90, 90);
  const longitude = numberInRange(req.query.lon, 'Longitude', -180, 180);

  const name = optionalString(req.query.name, 'Location name', { max: 120 });
  const country = optionalString(req.query.country, 'Country', { max: 120 });
  const admin1 = optionalString(req.query.admin1, 'Region', { max: 120 });
  const countryCode = optionalString(req.query.countryCode, 'Country code', { max: 2 });
  const requestedTimezone = optionalString(req.query.timezone, 'Timezone', { max: 80 });

  const forecast = await getForecast(latitude, longitude);

  res.json({
    success: true,
    data: {
      location: {
        name: name ?? 'Selected location',
        country: country ?? '',
        admin1: admin1 ?? null,
        countryCode: countryCode?.toUpperCase() ?? null,
        latitude,
        longitude,
        timezone: forecast.location.timezone ?? requestedTimezone ?? 'UTC',
        timezoneAbbreviation: forecast.location.timezoneAbbreviation,
        elevation: forecast.location.elevation,
      },
      current: forecast.current,
      daily: forecast.daily,
      hourly: forecast.hourly,
      updatedAt: forecast.updatedAt,
      attribution: {
        text: 'Weather data by Open-Meteo.com',
        url: 'https://open-meteo.com/',
      },
    },
  });
}
