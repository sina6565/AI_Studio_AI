import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import cloudModelService from '../../providers/cloud/CloudModelService';

const router = Router();
router.use(authenticateToken);

router.get('/', (_req, res) => {
  res.json({ success: true, data: cloudModelService.listModels() });
});

router.post('/chat', async (req, res, next) => {
  try {
    const { provider, model, messages, temperature, maxTokens } = req.body || {};
    if (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_TEMPERATURE', message: 'temperature must be between 0 and 2' } });
      return;
    }
    if (maxTokens !== undefined && (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 32768)) {
      res.status(400).json({ success: false, error: { code: 'INVALID_MAX_TOKENS', message: 'maxTokens must be an integer between 1 and 32768' } });
      return;
    }
    const result = await cloudModelService.chat({ provider, model, messages, temperature, maxTokens });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
