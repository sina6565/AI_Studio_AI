import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import orchestrator from '../../orchestrator/Orchestrator';
import { validateWithSchema } from '../../utils/validation';

const router = Router();
router.use(authenticateToken);

const generationSchemas = {
  image: z.object({
    prompt: z.string().trim().min(1).max(4000),
    size: z.enum(['512x512', '1024x1024', '1024x768']).optional(),
    quality: z.enum(['standard', 'high', 'ultra']).optional(),
  }).strict(),
  video: z.object({
    prompt: z.string().trim().min(1).max(4000),
    duration: z.number().int().min(1).max(120).optional(),
    fps: z.number().int().min(1).max(60).optional(),
  }).strict(),
  audio: z.object({
    prompt: z.string().trim().min(1).max(4000),
    voice: z.string().trim().min(1).max(80).optional(),
    duration: z.number().int().min(1).max(300).optional(),
  }).strict(),
  speech: z.object({
    text: z.string().trim().min(1).max(5000),
    voice: z.string().trim().min(1).max(80).optional(),
    language: z.enum(['fa', 'en']).optional(),
  }).strict(),
};

const jobTypes: Record<keyof typeof generationSchemas, string> = {
  image: 'image_generation',
  video: 'video_generation',
  audio: 'audio_generation',
  speech: 'text_to_speech',
};

router.post('/:kind', async (req: AuthenticatedRequest, res, next) => {
  try {
    const kind = req.params.kind as keyof typeof generationSchemas;
    const schema = generationSchemas[kind];
    if (!schema) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Unsupported generation type' },
      });
      return;
    }

    // Validate and whitelist generation fields before storing a job or forwarding
    // user-controlled data to a provider. Zod rejects accidental extra keys.
    const input = validateWithSchema<Record<string, unknown>>(
      req.body,
      schema,
      `Invalid ${kind} generation input`,
    );
    const job = await orchestrator.createJob({
      userId: req.user!.userId,
      jobType: jobTypes[kind] as any,
      input,
    });
    res.status(202).json({ success: true, data: job });
  } catch (e) {
    next(e);
  }
});

export default router;
