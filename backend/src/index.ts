/**
 * Server entry point
 */

import config from './config';
import { createApp } from './app';
import {
  connectDatabase,
  initializeDatabase,
  disconnectDatabase,
} from './database/connection';
import registry from './providers/registry';
import orchestrator from './orchestrator/Orchestrator';
import { recoverStuckJobs } from './jobs/recovery';
import jobQueueProcessor from './jobs/JobQueueProcessor';
import { validateEnvironment } from './config/validateEnv';
import logger from './utils/logger';

/**
 * Initialize database and providers without blocking the HTTP server.
 *
 * A failure here must NOT prevent the platform health check from passing:
 * the process keeps serving /health and reports a degraded state through
 * /health/detailed instead of crashing on startup.
 */
async function initializeDependencies(): Promise<void> {
  try {
    logger.info('Connecting to database...');
    await connectDatabase();
    logger.info('Database connected');

    logger.info('Initializing database...');
    await initializeDatabase();
    logger.info('Database initialized');

    // Mark jobs interrupted by a previous restart as failed so they do not
    // stay "processing" forever.
    await recoverStuckJobs();
  } catch (error) {
    logger.error(
      'Database initialization failed - server continues in degraded mode',
      error,
    );
  }

  try {
    logger.info('Initializing providers...');
    await registry.initializeAll();
    const availableProviders = registry.getAvailableProviders();
    logger.info(`${availableProviders.length} providers initialized`);

    // Register providers with orchestrator
    for (const provider of availableProviders) {
      orchestrator.registerProvider(provider);
    }
  } catch (error) {
    logger.error(
      'Provider initialization failed - server continues without providers',
      error,
    );
  }
}

/**
 * Start server
 */
async function start(): Promise<void> {
  try {
    logger.info('Starting AI Platform backend server...');
    validateEnvironment();

    // Create the Express app and start listening FIRST. The platform health
    // check must be reachable immediately, even while the database and AI
    // providers are still initializing in the background. Previously the
    // server only began listening after every async initialization step
    // completed, so an unreachable MongoDB or AI provider caused the health
    // check to time out ("container may have crashed during startup").
    const app = createApp();

    const server = app.listen(config.port, config.host, () => {
      logger.info(
        `Server listening on http://${config.host}:${config.port}`
      );
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`API Version: ${config.apiVersion}`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await jobQueueProcessor.close();
          logger.info('Job queue closed');
        } catch (error) {
          logger.error('Error closing job queue:', error);
        }
        try {
          await disconnectDatabase();
          logger.info('Database disconnected');
        } catch (error) {
          logger.error('Error disconnecting database:', error);
        }
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Initialize database and providers in the background (non-blocking).
    void initializeDependencies();
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start if not imported as module
if (require.main === module) {
  start();
}

export { start, initializeDependencies };
