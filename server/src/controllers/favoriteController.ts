import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Favorite, buildLocationKey } from '../models/Favorite.js';
import { HttpError } from '../utils/httpError.js';
import { numberInRange, optionalString, requiredString } from '../utils/validation.js';

function userIdFrom(req: Request): string {
  if (!req.auth) throw new HttpError(401, 'Authentication is required.', 'UNAUTHENTICATED');
  return req.auth.userId;
}

export async function listFavorites(req: Request, res: Response): Promise<void> {
  const favorites = await Favorite.find({ userId: userIdFrom(req) })
    .sort({ createdAt: -1 })
    .limit(100);

  res.json({
    success: true,
    data: { favorites: favorites.map((favorite) => favorite.toJSON()) },
  });
}

export async function createFavorite(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const name = requiredString(req.body?.name, 'Location name', { max: 120 });
  const country = requiredString(req.body?.country, 'Country', { max: 120 });
  const latitude = numberInRange(req.body?.latitude, 'Latitude', -90, 90);
  const longitude = numberInRange(req.body?.longitude, 'Longitude', -180, 180);
  const admin1 = optionalString(req.body?.admin1, 'Region', { max: 120 }) ?? null;
  const countryCode =
    optionalString(req.body?.countryCode, 'Country code', { max: 2 })?.toUpperCase() ?? null;
  const timezone = optionalString(req.body?.timezone, 'Timezone', { max: 80 }) ?? null;

  const locationKey = buildLocationKey(latitude, longitude);
  const duplicate = await Favorite.exists({ userId, locationKey });
  if (duplicate) {
    throw new HttpError(409, 'That location is already in your favorites.', 'ALREADY_FAVORITED');
  }

  const favorite = await Favorite.create({
    userId,
    name,
    country,
    latitude,
    longitude,
    admin1,
    countryCode,
    timezone,
    locationKey,
  });

  res.status(201).json({
    success: true,
    data: { favorite: favorite.toJSON() },
  });
}

export async function deleteFavorite(req: Request, res: Response): Promise<void> {
  const userId = userIdFrom(req);
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    throw new HttpError(400, 'Invalid favorite id.', 'INVALID_ID');
  }

  // Ownership is part of the query, never taken from the request body.
  const favorite = await Favorite.findOneAndDelete({ _id: id, userId });
  if (!favorite) {
    throw new HttpError(404, 'Favorite not found.', 'FAVORITE_NOT_FOUND');
  }

  res.json({ success: true, data: { id } });
}
