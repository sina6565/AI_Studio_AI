import fs from 'fs';
import path from 'path';
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

/**
 * Locate the built web frontend for single-container deployments.
 *
 * The production Docker image copies the Vite build next to the compiled
 * backend (`/app/public`). When no build is present (local API-only
 * development, automated tests) this returns null and the server behaves
 * exactly as an API-only service, including the JSON probe at `/`.
 */
function resolveFrontendDist(): string | null {
  if (config.nodeEnv === 'test') return null;
  const candidates = [
    process.env.FRONTEND_DIST_DIR,
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', '..', 'frontend', 'dist'),
    path.join(process.cwd(), 'frontend', 'dist'),
  ].filter((dir): dir is string => Boolean(dir));
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  }
  return null;
}

export function createApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());
  const allowedOrigins = config.cors.origin;
  const allowAllOrigins = allowedOrigins.includes('*');
  app.use(cors({ origin: (origin, callback) => {
    if (!origin || allowAllOrigins || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  }, credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH','OPTIONS'], allowedHeaders: ['Content-Type','Authorization'] }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));
  app.use(compression());
  if (config.nodeEnv !== 'test') app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
  app.use('/api/', rateLimit({ windowMs: config.rateLimit.windowMs, max: config.rateLimit.maxRequests, standardHeaders: true, legacyHeaders: false }));
  // Root-level probes (liveness + readiness) plus the versioned API health.
  app.use('/health', healthRoutes);
  app.use(`${config.apiPrefix}/${config.apiVersion}/health`, healthRoutes);
  // Built web frontend shipped in the production image, if any. Health
  // probes above are unaffected; liveness should target `/health`
  // (see docs/OPERATIONS.md).
  const frontendDist = resolveFrontendDist();
  // Root endpoint. Many deployment platforms (including SnapDeploy) probe `/`
  // by default; returning a cheap 200 here avoids a failed health check even
  // though the API itself lives under /api/v1 and /health. When the built
  // frontend is present, `/` serves the homepage (still a 200).
  app.get('/', (_req, res) => {
    if (frontendDist) {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(frontendDist, 'index.html'));
      return;
    }
    res.json({
      status: 'ok',
      service: 'ai-platform-backend',
      version: '1.0.0',
      health: '/health',
    });
  });
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
  // Static frontend assets + SPA fallback. Registered after every API and
  // probe route, and never swallows `/api` or `/health` paths, so API 404s
  // keep returning JSON exactly as before.
  if (frontendDist) {
    app.use(
      express.static(frontendDist, {
        index: false,
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-cache');
        },
      }),
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/health')) return next();
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
    logger.info(`Serving built frontend from ${frontendDist}`);
  }
  app.use((_req, res) => res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } }));
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Unhandled error', err);
    const statusCode = err.statusCode || err.status || 500;
    res.status(statusCode).json({ success: false, error: { code: err.code || 'INTERNAL_SERVER_ERROR', message: config.nodeEnv === 'production' && statusCode === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error') } });
  });
  return app;
}

export default createApp();
