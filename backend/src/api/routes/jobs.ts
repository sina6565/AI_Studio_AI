import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import orchestrator from '../../orchestrator/Orchestrator';
import { validateWithSchema, schemas } from '../../utils/validation';
import { Job } from '../../database/models';
import { JobPriority } from '../../types';
import { isGameJobType } from '../../game/types';

interface CreateJobInput {
  type: string;
  input: Record<string, any>;
  priority?: JobPriority;
  webhookUrl?: string;
}

/** Strip internal stack traces from every job representation sent to clients. */
function publicJob(job: any): any {
  const value = typeof job?.toObject === 'function' ? job.toObject() : { ...job };
  if (value.error && typeof value.error === 'object') {
    const { stack: _internalStack, ...safeError } = value.error;
    value.error = safeError;
  }
  return value;
}

const router = Router();
router.use(authenticateToken);
router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = validateWithSchema<CreateJobInput>(req.body, schemas.createJob);
    if (isGameJobType(input.type)) {
      // Fail fast with a field-level message instead of a provider error later.
      validateWithSchema(input.input, schemas.gameSpec);
    }
    const job = await orchestrator.createJob({ userId: req.user!.userId, jobType: input.type as any, input: input.input, priority: input.priority, webhookUrl: input.webhookUrl });
    res.status(201).json({ success: true, data: job });
  } catch (e) { next(e); }
});
router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const jobs = await Job.find({ userId: req.user!.userId }).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: jobs.map(publicJob) });
  } catch (e) { next(e); }
});
router.get('/stats', async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.userId;
    const [total, queued, processing, completed, failed] = await Promise.all([
      Job.countDocuments({ userId }),
      Job.countDocuments({ userId, status: 'queued' }),
      Job.countDocuments({ userId, status: 'processing' }),
      Job.countDocuments({ userId, status: 'completed' }),
      Job.countDocuments({ userId, status: 'failed' }),
    ]);
    res.json({ success: true, data: { total, queued, processing, completed, failed } });
  } catch (e) { next(e); }
});
router.get('/:jobId', async (req: AuthenticatedRequest, res, next) => {
  try {
    const job = await orchestrator.getJobStatus(req.params.jobId);
    if (job.userId !== req.user!.userId) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this job' } }); return; }
    res.json({ success: true, data: publicJob(job) });
  } catch (e) { next(e); }
});
router.post('/:jobId/cancel', async (req: AuthenticatedRequest, res, next) => {
  try {
    const job = await orchestrator.getJobStatus(req.params.jobId);
    if (job.userId !== req.user!.userId) { res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have access to this job' } }); return; }
    await orchestrator.cancelJob(req.params.jobId);
    res.json({ success: true, data: { jobId: req.params.jobId, cancelled: true } });
  } catch (e) { next(e); }
});
export default router;
