/**
 * Configuration management for the platform
 */

import { config } from 'dotenv';

// Load environment variables
config();

interface DatabaseConfig {
  url: string;
  poolSize: number;
  timeout: number;
}

interface RedisConfig {
  url: string;
  password?: string;
  timeout: number;
}

interface JWTConfig {
  secret: string;
  expiry: string;
  bcryptRounds: number;
}

interface CORSConfig {
  origin: string[];
  credentials: boolean;
}

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface JobQueueConfig {
  name: string;
  maxAttempts: number;
  backoffDelay: number;
  timeout: number;
  /**
   * 'auto'   - use Redis/Bull when it is reachable, otherwise run the job
   *            in-process (single-container deployments without Redis).
   * 'redis'  - require Redis; job creation fails when it is unavailable.
   * 'inline' - never open a Redis connection; always run in-process.
   */
  mode: 'auto' | 'redis' | 'inline';
  inlineConcurrency: number;
}

interface StorageConfig {
  type: 'local' | 's3' | 'gcs';
  path?: string;
  s3?: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region: string;
  };
}

interface ProviderConfig {
  agnes?: {
    enabled: boolean;
    apiKey: string;
    apiUrl: string;
    timeout: number;
  };
  openai?: {
    enabled: boolean;
    apiKey: string;
  };
  stability?: {
    enabled: boolean;
    apiKey: string;
  };
}

interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
}

interface AppConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  apiVersion: string;
  apiPrefix: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  jwt: JWTConfig;
  cors: CORSConfig;
  rateLimit: RateLimitConfig;
  jobQueue: JobQueueConfig;
  storage: StorageConfig;
  providers: ProviderConfig;
  logging: LoggingConfig;
}

// Helper function to validate the queue mode. Unsupported values must not
// silently disable the queue: fall back to the safe default 'auto'.
const parseQueueMode = (value?: string): 'auto' | 'redis' | 'inline' => {
  const mode = (value || 'auto').trim().toLowerCase();
  if (mode === 'redis' || mode === 'inline' || mode === 'auto') return mode;
  console.warn(
    `Unsupported QUEUE_MODE "${value}" - falling back to "auto" (redis with in-process fallback)`
  );
  return 'auto';
};

// Helper function to parse comma-separated strings
const parseCSV = (value?: string): string[] => {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
};

// Helper function to validate required environment variables
const requireEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

// Determine database URL: prefer MONGODB_URI, fall back to DATABASE_URL or default
const mongodbUri =
  process.env.MONGODB_URI ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27017/ai-platform';

const nodeEnv = (process.env.NODE_ENV as AppConfig['nodeEnv']) || 'development';

const config_: AppConfig = {
  nodeEnv,
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiVersion: 'v1',
  apiPrefix: '/api',

  database: {
    url: mongodbUri,
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10', 10),
    timeout: 30000,
  },

  redis: {
    url: requireEnv('REDIS_URL', 'redis://localhost:6379'),
    password: process.env.REDIS_PASSWORD,
    timeout: 30000,
  },

  jwt: {
    // Keep the convenience fallback for local development/tests only. Production must provide its own secret.
    secret: requireEnv('JWT_SECRET', nodeEnv === 'production' ? undefined : 'dev-secret-key'),
    expiry: process.env.JWT_EXPIRY || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },

  cors: {
    // An empty parse result must fall back to the default dev origins. Note
    // that `[]` is truthy in JS, so the previous `parseCSV(...) || [...]`
    // never applied the fallback and rejected every browser origin.
    origin:
      parseCSV(process.env.CORS_ORIGIN).length > 0
        ? parseCSV(process.env.CORS_ORIGIN)
        : ['http://localhost:5173', 'http://localhost:8081'],
    credentials: true,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  jobQueue: {
    name: process.env.JOB_QUEUE_NAME || 'ai-tasks',
    maxAttempts: parseInt(process.env.JOB_MAX_ATTEMPTS || '3', 10),
    backoffDelay: parseInt(process.env.JOB_BACKOFF_DELAY || '5000', 10),
    timeout: parseInt(process.env.JOB_TIMEOUT || '300000', 10),
    mode: parseQueueMode(process.env.QUEUE_MODE),
    inlineConcurrency: Math.max(
      1,
      parseInt(process.env.QUEUE_INLINE_CONCURRENCY || '2', 10) || 2,
    ),
  },

  storage: {
    type: (process.env.STORAGE_TYPE as StorageConfig['type']) || 'local',
    path: process.env.STORAGE_PATH || '/tmp/ai-platform-storage',
    s3: process.env.S3_ENDPOINT
      ? {
          endpoint: process.env.S3_ENDPOINT,
          accessKey: requireEnv('S3_ACCESS_KEY', ''),
          secretKey: requireEnv('S3_SECRET_KEY', ''),
          bucket: process.env.S3_BUCKET || 'ai-platform',
          region: process.env.S3_REGION || 'us-east-1',
        }
      : undefined,
  },

  providers: {
    agnes: {
      enabled: process.env.AGNES_ENABLED === 'true',
      apiKey: process.env.AGNES_API_KEY || '',
      apiUrl: process.env.AGNES_API_URL || 'https://api.agnes.ai',
      timeout: parseInt(process.env.AGNES_TIMEOUT || '300000', 10),
    },
    openai: {
      enabled: process.env.OPENAI_ENABLED === 'true',
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    stability: {
      enabled: process.env.STABILITY_ENABLED === 'true',
      apiKey: process.env.STABILITY_API_KEY || '',
    },
  },

  logging: {
    level: (process.env.LOG_LEVEL as LoggingConfig['level']) || 'info',
    format: (process.env.LOG_FORMAT as LoggingConfig['format']) || 'json',
  },
};

// Validate security-sensitive configuration in production.
if (config_.nodeEnv === 'production') {
  const jwtSecret = process.env.JWT_SECRET || '';
  const placeholderSecrets = new Set([
    'dev-secret-key',
    'replace-with-unique-local-development-secret',
    'your-secret-jwt-key-change-in-production',
    'your-super-secret-jwt-key-change-in-production',
  ]);

  if (
    jwtSecret.length < 32 ||
    placeholderSecrets.has(jwtSecret.trim().toLowerCase())
  ) {
    throw new Error('JWT_SECRET must be a unique secret of at least 32 characters in production');
  }
  if (config_.cors.origin.includes('*')) {
    throw new Error('CORS_ORIGIN must list trusted origins in production; wildcard origins are not allowed');
  }
  if (!config_.providers.agnes?.apiKey) {
    console.warn(
      'Agnes AI provider not configured - image generation will be unavailable'
    );
  }
  if (!process.env.MONGODB_URI && !process.env.DATABASE_URL) {
    // Do not crash the process here: the HTTP server must still start so the
    // platform health check can pass. The database layer reports a degraded
    // state via /health and connectDatabase() logs the failure at runtime.
    console.warn(
      'MONGODB_URI/DATABASE_URL not set in production - starting without database; health will report degraded'
    );
  }
}

export default config_;
export type { AppConfig };