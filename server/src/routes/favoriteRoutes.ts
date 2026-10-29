import { Router } from 'express';
import {
  createFavorite,
  deleteFavorite,
  listFavorites,
} from '../controllers/favoriteController.js';
import { requireAuth, requireDatabase, verifyOrigin } from '../middleware/auth.js';
import { noStore } from '../middleware/noStore.js';
import { favoritesLimiter } from '../middleware/rateLimit.js';

export const favoriteRouter = Router();

// Every favorite route requires a verified cookie and a live database.
favoriteRouter.use(noStore, verifyOrigin, requireAuth, requireDatabase, favoritesLimiter);

favoriteRouter.get('/', listFavorites);
favoriteRouter.post('/', createFavorite);
favoriteRouter.delete('/:id', deleteFavorite);
