import { Router } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { User } from '../../database/models';
import { validateWithSchema, schemas } from '../../utils/validation';

const router = Router();
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash -apiKey');
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});
router.patch('/me/preferences', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const preferences = validateWithSchema<Record<string, unknown>>(req.body, schemas.userPreferences, 'Invalid preferences');
    // Merge into existing preferences so a partial update does not wipe
    // unrelated settings; only whitelisted keys are accepted.
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(preferences)) {
      update[`preferences.${key}`] = value;
    }
    const user = await User.findByIdAndUpdate(
      req.user!.userId,
      Object.keys(update).length ? { $set: update } : {},
      { new: true, runValidators: true },
    ).select('-passwordHash -apiKey');
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});
export default router;
