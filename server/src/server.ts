import { createServer } from 'node:http';
import { app } from './app.js';
import { connectToDatabase, disconnectFromDatabase } from './config/db.js';
import { config } from './config/env.js';

async function start(): Promise<void> {
  const connected = await connectToDatabase();
  if (!connected && config.isProduction) {
    console.error('[server] Refusing to start without a database in production.');
    process.exit(1);
  }

  const server = createServer(app);
  server.listen(config.port, () => {
    console.log(`[server] WeatherWise API listening on http://localhost:${config.port}`);
    console.log(`[server] Allowed client origin: ${config.clientUrl}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down.`);
    server.close(async () => {
      await disconnectFromDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void start();
