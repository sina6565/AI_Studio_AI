import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import orchestrator from '../../orchestrator/Orchestrator';
import { validateWithSchema } from '../../utils/validation';
import { JobPriority, JobType } from '../../types';

const router = Router();
router.use(authenticateToken);

const generationSchemas = {
  image: z.object({
    prompt: z.string().min(1).max(4000),
    size: z.string().max(64).optional(),
    quality: z.string().max(32).optional(),
    style: z.string().max(64).optional(),
    model: z.string().max(64).optional(),
    negativePrompt: z.string().max(2000).optional(),
  }),
  video: z.object({
    prompt: z.string().min(1).max(4000),
    duration: z.number().min(1).max(180).optional(),
    fps: z.number().min(1).max(60).optional(),
    resolution: z.string().max(64).optional(),
    model: z.string().max(64).optional(),
  }),
  audio: z.object({
    prompt: z.string().min(1).max(4000),
    duration: z.number().min(1).max(300).optional(),
    format: z.string().max(16).optional(),
    model: z.string().max(64).optional(),
  }),
  speech: z.object({
    text: z.string().min(1).max(20000),
    language: z.string().max(12).optional(),
    voice: z.string().max(64).optional(),
    speed: z.number().min(0.25).max(2).optional(),
    model: z.string().max(64).optional(),
  }),
} as const;

const generationKinds = {
  image: { type: JobType.IMAGE_GENERATION },
  video: { type: JobType.VIDEO_GENERATION },
  audio: { type: JobType.AUDIO_GENERATION },
  speech: { type: JobType.TEXT_TO_SPEECH },
} as const;

router.post('/:kind', async (req: AuthenticatedRequest, res, next) => {
  try {
    const kind = req.params.kind?.toLowerCase();
    const kindConfig = generationKinds[kind as keyof typeof generationKinds];

    if (!kindConfig) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Unsupported generation kind',
        },
      });
    }

    const schema = generationSchemas[kind as keyof typeof generationSchemas];
    const payload = validateWithSchema(req.body, schema, 'Invalid generation payload');

    const job = await orchestrator.createJob({
      userId: req.user!.userId,
      jobType: kindConfig.type,
      input: payload,
      priority: (req.body.priority as JobPriority | undefined) || JobPriority.NORMAL,
      projectId: req.body.projectId,
      webhookUrl: req.body.webhookUrl,
      userPreferences: req.body.userPreferences,
    });

    return res.status(202).json({ success: true, data: job });
  } catch (error) {
    return next(error);
  }
});

export default router;
