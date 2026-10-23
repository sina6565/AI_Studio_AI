/**
 * Startup environment validation.
 *
 * Logs a non-secret summary of which environment variables are present so an
 * operator can see at a glance which optional features are enabled. It never
 * prints values, and it never crashes the process: the HTTP server must still
 * start so liveness/readiness probes can report the real dependency state.
 */

import config from '../config';
import logger from '../utils/logger';

export interface EnvCheck {
  name: string;
  present: boolean;
  required: boolean;
  note: string;
}

const has = (name: string): boolean => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0;
};

export function validateEnvironment(): { ok: boolean; checks: EnvCheck[] } {
  const isProduction = config.nodeEnv === 'production';

  const checks: EnvCheck[] = [
    {
      name: 'MONGODB_URI/DATABASE_URL',
      present: has('MONGODB_URI') || has('DATABASE_URL'),
      required: true,
      note: 'database persistence',
    },
    {
      name: 'JWT_SECRET',
      present: has('JWT_SECRET') && process.env.JWT_SECRET !== 'dev-secret-key',
      required: isProduction,
      note: 'authentication token signing',
    },
    {
      name: 'REDIS_URL',
      present: has('REDIS_URL'),
      required: false,
      note: 'job queue (optional; QUEUE_MODE=auto falls back to in-process)',
    },
    {
      name: 'AGNES_ENABLED',
      present: has('AGNES_ENABLED'),
      required: false,
      note: 'Agnes provider toggle',
    },
    {
      name: 'AGNES_API_KEY',
      present: has('AGNES_API_KEY'),
      required: false,
      note: 'Agnes provider credentials',
    },
  ];

  logger.info(
    `[Startup] Job queue mode: ${config.jobQueue.mode}` +
      (config.jobQueue.mode === 'auto'
        ? ' (Redis when reachable, in-process fallback otherwise)'
        : ''),
  );

  for (const check of checks) {
    if (!check.present) {
      const level = check.required ? 'REQUIRED' : 'optional';
      logger.warn(`[Startup] ${check.name} is not set (${check.note}) [${level}]`);
    }
  }

  const missingRequired = checks.filter((c) => c.required && !c.present);
  if (missingRequired.length === 0) {
    logger.info('[Startup] Environment validation passed');
  } else {
    logger.error(
      `[Startup] Missing required environment variables: ${missingRequired
        .map((c) => c.name)
        .join(', ')}`,
    );
  }

  return { ok: missingRequired.length === 0, checks };
}
