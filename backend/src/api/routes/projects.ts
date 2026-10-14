import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { Project } from '../../database/models';
import { AppError } from '../../types/errors';
import { validateWithSchema, schemas } from '../../utils/validation';

const router = Router();
router.use(authenticateToken);

router.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user!.userId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: projects });
  } catch (e) { next(e); }
});

router.post('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const body = validateWithSchema<{ name: string; type: string; description?: string; settings?: Record<string, any> }>(
      req.body,
      schemas.createProject,
      'Invalid project data',
    );
    const project = await Project.create({
      userId: req.user!.userId,
      name: body.name,
      type: body.type,
      description: body.description,
      assets: [],
      jobs: [],
      settings: {
        isPublic: false,
        allowComments: true,
        allowSharing: true,
        ...(body.settings || {}),
      },
    });
    res.status(201).json({ success: true, data: project });
  } catch (e) { next(e); }
});

router.get('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.userId });
    if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
    res.json({ success: true, data: project });
  } catch (e) { next(e); }
});

router.patch('/:id', async (req: AuthenticatedRequest, res, next) => {
  try {
    // Whitelisted update: prevents mass-assignment of userId/assets/jobs.
    const body = validateWithSchema<Record<string, any>>(req.body, schemas.updateProject, 'Invalid project update');
    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.settings !== undefined) {
      for (const [key, value] of Object.entries(body.settings)) {
        update[`settings.${key}`] = value;
      }
    }
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      Object.keys(update).length ? { $set: update } : {},
      { new: true, runValidators: true },
    );
    if (!project) throw new AppError('NOT_FOUND', 'Project not found', 404);
    res.json({ success: true, data: project });
  } catch (e) { next(e); }
});

export default router;
