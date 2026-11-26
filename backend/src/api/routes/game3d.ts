import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { GroqBrowserSceneAgent } from '../../game3d/GroqBrowserSceneAgent';

const router = Router();
router.use(authenticateToken);

const designRequestSchema = z.object({
  projectId: z.string().min(1).max(100),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(4000),
  genre: z.string().min(1).max(80).default('adventure'),
  target: z.enum(['web_desktop', 'web_mobile', 'web_responsive']).default('web_responsive'),
}).strict();

router.post('/design', async (req: AuthenticatedRequest, res, next) => {
  try {
    if (process.env.GROQ_ENABLED !== 'true') {
      res.status(503).json({
        success: false,
        error: { code: 'GROQ_3D_AGENT_DISABLED', message: 'Enable GROQ_ENABLED and configure GROQ_API_KEY to use the 3D design agent.' },
      });
      return;
    }
    const parsed = designRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: { code: 'INVALID_3D_DESIGN_REQUEST', message: parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ') } });
      return;
    }
    const input = parsed.data;
    const agent = new GroqBrowserSceneAgent();
    await agent.initialize();
    const manifest = await agent.designScene(input);
    res.json({ success: true, data: { manifest, provider: 'groq', runtime: 'threejs_r3f' } });
  } catch (error) { next(error); }
});

export default router;
