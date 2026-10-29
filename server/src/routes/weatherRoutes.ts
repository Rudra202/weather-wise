import { Router } from 'express';
import { currentWeather, search } from '../controllers/weatherController.js';
import { forecastLimiter, searchLimiter } from '../middleware/rateLimit.js';

export const weatherRouter = Router();

// Public: no authentication is required for weather data.
weatherRouter.get('/search', searchLimiter, search);
weatherRouter.get('/', forecastLimiter, currentWeather);
