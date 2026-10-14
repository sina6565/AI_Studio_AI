import { Router, Request, Response } from 'express';
import { getDatabaseStatus } from '../../database/connection';
import registry from '../../providers/registry';
import jobQueueProcessor from '../../jobs/JobQueueProcessor';

const router = Router();

/**
 * Liveness probe: the process is running and able to serve HTTP.
 * Must never depend on external services, so a platform health check can
 * pass even while MongoDB/Redis are still starting or unavailable.
 */
const liveness = (_req: Request, res: Response): void => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
};

/**
 * Readiness probe: critical dependencies are usable.
 * MongoDB is required for persistence, so readiness fails (503) while it is
 * down instead of falsely reporting the whole application as healthy.
 */
const readiness = (_req: Request, res: Response): void => {
  const db = getDatabaseStatus();
  const ready = db.connected;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ready' : 'not_ready',
    timestamp: new Date().toISOString(),
    database: { connected: db.connected, state: db.details?.state },
  });
};

router.get('/', liveness);
router.get('/live', liveness);
router.get('/ready', readiness);
router.get('/detailed', (_req: Request, res: Response) => {
  const db = getDatabaseStatus();
  const providers = registry.getStatus();
  const queue = jobQueueProcessor.getConnectionStatus();
  const healthy = db.connected;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    database: db,
    providers,
    queue,
  });
});

export default router;
