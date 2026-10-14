/**
 * Job recovery.
 *
 * Jobs left in a non-terminal state (queued/processing) by a process restart
 * would otherwise remain "processing" forever. On startup we mark jobs that
 * have been processing for longer than the threshold as failed so the user
 * sees a clear terminal state instead of an eternal spinner.
 */

import { Job } from '../database/models';
import { JobStatus } from '../types';
import logger from '../utils/logger';

export const DEFAULT_STUCK_AFTER_MS = 30 * 60 * 1000; // 30 minutes

export async function recoverStuckJobs(
  stuckAfterMs: number = DEFAULT_STUCK_AFTER_MS,
): Promise<number> {
  const cutoff = new Date(Date.now() - stuckAfterMs);

  try {
    const result = await Job.updateMany(
      { status: JobStatus.PROCESSING, updatedAt: { $lt: cutoff } },
      {
        $set: {
          status: JobStatus.FAILED,
          error: {
            code: 'INTERRUPTED',
            message: 'Job was interrupted by a server restart and did not complete',
          },
        },
      },
    );

    const count = (result as { modifiedCount?: number }).modifiedCount ?? 0;
    if (count > 0) {
      logger.warn(`[Recovery] Marked ${count} interrupted job(s) as failed`);
    } else {
      logger.info('[Recovery] No stuck jobs found');
    }
    return count;
  } catch (error) {
    logger.error('[Recovery] Failed to recover stuck jobs', error);
    return 0;
  }
}
