import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import huggingFaceCatalog from '../../models/HuggingFaceCatalogService';

const router = Router();

// Model discovery is authenticated and read-only. It never runs model code,
// downloads weights, activates an endpoint or spends inference credits.
router.use(authenticateToken);

router.get('/huggingface', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const task = typeof req.query.task === 'string' ? req.query.task : undefined;
    const sortValue = typeof req.query.sort === 'string' ? req.query.sort : 'downloads';
    const sort = ['downloads', 'likes', 'lastModified'].includes(sortValue)
      ? sortValue as 'downloads' | 'likes' | 'lastModified'
      : 'downloads';
    const parsedLimit = Number(req.query.limit || 30);
    const limit = Number.isFinite(parsedLimit) ? Math.min(100, Math.max(1, Math.floor(parsedLimit))) : 30;

    const models = await huggingFaceCatalog.searchModels({ search, task, sort, limit });
    res.json({
      success: true,
      data: models,
      meta: {
        source: 'Hugging Face Hub',
        count: models.length,
        executionReady: false,
        note: 'Catalog discovery only. Inference availability, licensing and pricing must be verified before routing or execution.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
