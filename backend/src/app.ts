import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import logger from './utils/logger';
import authRoutes from './api/routes/auth';
import jobRoutes from './api/routes/jobs';
import userRoutes from './api/routes/users';
import projectRoutes from './api/routes/projects';
import generateRoutes from './api/routes/generate';
import healthRoutes from './api/routes/health';

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  const allowedOrigins = config.cors.origin;
  const allowAllOrigins = allowedOrigins.includes('*');
  // Credentialed CORS cannot safely use Access-Control-Allow-Origin: *.
  // Production wildcard origins are rejected during config validation; in
  // development, wildcard mode is allowed only without credentials.
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin not allowed by CORS'));
    },
    credentials: allowAllOrigins ? false : config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(compression());
  if (config.nodeEnv !== 'test') app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use('/api/', rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.maxRequests, standardHeaders: true, legacyHeaders: false }));
  // Root-level probes (liveness + readiness) plus the versioned API health.
  app.use('/health', healthRoutes);
  app.use(`${config.apiPrefix}/${config.apiVersion}/health`, healthRoutes);
  // Root endpoint. Many deployment platforms (including SnapDeploy) probe `/`
  // by default; returning a cheap 200 here avoids a failed health check even
  // though the API itself lives under /api/v1 and /health.
  app.get('/', (_req, res) =>
    res.json({
      status: 'ok',
      service: 'ai-platform-backend',
      version: '1.0.0',
      health: '/health',
    }),
  );
  // Authentication endpoints get a stricter limit than the general API limiter
  // so credential stuffing is throttled without affecting normal API usage.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts. Please try again later.',
      },
    },
  });
  app.use(`${config.apiPrefix}/${config.apiVersion}/auth`, authLimiter, authRoutes);
  app.use(`${config.apiPrefix}/${config.apiVersion}/jobs`, jobRoutes);
  app.use(`${config.apiPrefix}/${config.apiVersion}/users`, userRoutes);
  app.use(`${config.apiPrefix}/${config.apiVersion}/projects`, projectRoutes);
  app.use(`${config.apiPrefix}/${config.apiVersion}/generate`, generateRoutes);
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', err);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({ success: false, error: { code: err.code || 'INTERNAL_SERVER_ERROR', message: config.nodeEnv === 'production' && statusCode === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error') } });
  });
  return app;
}

export default createApp();
