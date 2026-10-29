import mongoose from 'mongoose';
import { config } from './env.js';

// Mongoose reconnects on its own; these logs make outages and recoveries visible
// to operators instead of silently returning 503s.
mongoose.connection.on('disconnected', () => {
  console.warn('[db] MongoDB disconnected. Protected routes will return 503.');
});
mongoose.connection.on('reconnected', () => {
  console.log('[db] MongoDB reconnected. Protected routes are available again.');
});
mongoose.connection.on('error', (error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[db] MongoDB connection error: ${message}`);
});

/**
 * Connects to MongoDB. The server intentionally keeps running in development
 * when the database is unavailable so that the public weather features still
 * work; protected routes return 503 until a connection exists.
 */
export async function connectToDatabase(): Promise<boolean> {
  if (!config.mongoUri) {
    console.warn('[db] MONGODB_URI is not set. Auth and favorites are unavailable.');
    return false;
  }

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
    });
    console.log(`[db] Connected to MongoDB (${mongoose.connection.name}).`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[db] MongoDB connection failed: ${message}`);
    return false;
  }
}

export function isDatabaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
