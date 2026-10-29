import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import orchestrator from '../../orchestrator/Orchestrator';
import { AppError } from '../../types/errors';
import { JobPriority } from '../../types';

const router = Router();
router.use(authenticateToken);

const map: Record<string, string> = {
  image: 'image_generation',
  video: 'video_generation',
  audio: 'audio_generation',
  speech: 'text_to_speech',
};

const normalizeText = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

router.post('/:kind', async (req: AuthenticatedRequest, res, next) => {
  try {
    const kind = map[req.params.kind];
    if (!kind) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Unsupported generation type' },
      });
    }

    const body = req.body || {};
    const prompt = normalizeText(body.prompt);
    const text = normalizeText(body.text);

    if (kind === 'text_to_speech' && !text) {
      throw new AppError('INVALID_INPUT', 'Text is required for speech generation', 400);
    }

    if (kind !== 'text_to_speech' && !prompt) {
      throw new AppError('INVALID_INPUT', 'Prompt is required for generation', 400);
    }

    const input: Record<string, any> = { ...body };
    if (kind !== 'text_to_speech') {
      input.prompt = prompt;
    } else {
      input.text = text;
    }

    if (typeof body.size !== 'undefined') input.size = body.size;
    if (typeof body.duration !== 'undefined') input.duration = body.duration;
    if (typeof body.fps !== 'undefined') input.fps = body.fps;
    if (typeof body.language !== 'undefined') input.language = body.language;
    if (typeof body.quality !== 'undefined') input.quality = body.quality;

    const job = await orchestrator.createJob({
      userId: req.user!.userId,
      jobType: kind as any,
      input,
      priority: (body.priority as JobPriority) || JobPriority.NORMAL,
      projectId: body.projectId,
      webhookUrl: body.webhookUrl,
    });

    return res.status(201).json({ success: true, data: job });
  } catch (error) {
    return next(error);
  }
});

export default router;
