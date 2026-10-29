import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config, isAllowedOrigin } from './config/env.js';
import { isDatabaseReady } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/authRoutes.js';
import { favoriteRouter } from './routes/favoriteRoutes.js';
import { weatherRouter } from './routes/weatherRoutes.js';
import { HttpError } from './utils/httpError.js';

export const app = express();

if (config.isProduction) app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new HttpError(403, 'Request origin is not allowed.', 'INVALID_ORIGIN'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
  }),
);
app.use(express.json({ limit: '16kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      environment: config.nodeEnv,
      database: isDatabaseReady() ? 'connected' : 'unavailable',
      timestamp: new Date().toISOString(),
    },
  });
});

app.use('/api/auth', authRouter);
app.use('/api/weather', weatherRouter);
app.use('/api/favorites', favoriteRouter);

app.use(notFoundHandler);
app.use(errorHandler);
