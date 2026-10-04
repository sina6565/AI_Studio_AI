/**
 * Database connection and configuration
 * Supports MongoDB with connection pooling, retry logic, and health monitoring
 */

import mongoose from 'mongoose';
import config from '../config';
import logger from '../utils/logger';

let connectionAttempts = 0;
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAY_MS = 3000;

/**
 * Connect to MongoDB with retry logic and graceful error handling
 */
export async function connectDatabase(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || config.database.url;

  if (!mongoUri) {
    throw new Error(
      'MongoDB connection URI not found. Set MONGODB_URI environment variable or DATABASE_URL in config.'
    );
  }

  try {
    logger.info(
      `Attempting to connect to MongoDB (attempt ${connectionAttempts + 1}/${MAX_RETRY_ATTEMPTS})`
    );

    await mongoose.connect(mongoUri, {
      maxPoolSize: config.database.poolSize,
      minPoolSize: Math.max(1, Math.floor(config.database.poolSize / 2)),
      serverSelectionTimeoutMS: config.database.timeout,
      socketTimeoutMS: config.database.timeout,
      connectTimeoutMS: 10000,
      retryWrites: true,
      w: 'majority',
      authSource: 'admin',
    });

    connectionAttempts = 0;
    logger.info('MongoDB connected successfully');
    setupConnectionHandlers();
  } catch (error) {
    connectionAttempts += 1;
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`MongoDB connection failed: ${message}`);

    if (connectionAttempts < MAX_RETRY_ATTEMPTS) {
      logger.info(
        `Retrying connection in ${RETRY_DELAY_MS}ms (attempt ${connectionAttempts}/${MAX_RETRY_ATTEMPTS})...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDatabase();
    }

    throw new Error(
      `Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts: ${message}`
    );
  }
}

/**
 * Set up MongoDB connection event handlers
 */
function setupConnectionHandlers(): void {
  const connection = mongoose.connection;

  connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  connection.on('error', (error) => {
    logger.error('MongoDB connection error:', error);
  });

  connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
    connectionAttempts = 0;
  });
}

/**
 * Initialize database (create indexes)
 * Safe to run multiple times
 */
export async function initializeDatabase(): Promise<void> {
  try {
    logger.info('Initializing database indexes...');

    const collections = [
      mongoose.connection.collection('users'),
      mongoose.connection.collection('jobs'),
      mongoose.connection.collection('projects'),
      mongoose.connection.collection('contents'),
    ];

    for (const collection of collections) {
      try {
        await collection.syncIndexes();
        logger.info(`Indexes synchronized for ${collection.collectionName} collection`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.warn(`Could not sync indexes for ${collection.collectionName}: ${message}`);
      }
    }

    logger.info('Database initialization completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Database initialization failed: ${message}`);
    throw error;
  }
}

/**
 * Disconnect from MongoDB gracefully
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Error during MongoDB disconnection: ${message}`);
    throw error;
  }
}

/**
 * Get current database connection status
 */
export function getDatabaseStatus(): {
  connected: boolean;
  timestamp: Date;
  readyState: number;
  details?: Record<string, any>;
} {
  const readyState = mongoose.connection.readyState;
  const stateByCode: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    connected: readyState === 1,
    timestamp: new Date(),
    readyState,
    details: {
      state: stateByCode[readyState] || 'unknown',
      host: mongoose.connection.host,
      db: mongoose.connection.db?.getName(),
      collections: mongoose.connection.collections
        ? Object.keys(mongoose.connection.collections).length
        : 0,
    },
  };
}

/**
 * Check if database is ready for operations
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get connection URI (sanitized, no credentials exposed)
 */
export function getSanitizedConnectionUri(): string {
  const mongoUri = process.env.MONGODB_URI || config.database.url;
  if (!mongoUri) return 'Not configured';

  try {
    const url = new URL(mongoUri);
    url.username = '***';
    url.password = '***';
    return url.toString();
  } catch {
    return 'mongodb://***:***@host:port/database';
  }
}