import type { FavoriteLocation, Location } from '../types/weather';
import { apiRequest } from './api';

export function getFavorites(): Promise<{ favorites: FavoriteLocation[] }> {
  return apiRequest<{ favorites: FavoriteLocation[] }>('/favorites');
}

export function addFavorite(location: Location): Promise<{ favorite: FavoriteLocation }> {
  return apiRequest<{ favorite: FavoriteLocation }>('/favorites', {
    method: 'POST',
    body: {
      name: location.name,
      country: location.country,
      admin1: location.admin1 ?? null,
      countryCode: location.countryCode ?? null,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone ?? null,
    },
  });
}

export function removeFavorite(id: string): Promise<{ id: string }> {
  return apiRequest<{ id: string }>(`/favorites/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}
