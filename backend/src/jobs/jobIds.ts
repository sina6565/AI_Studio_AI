/**
 * Bull job-id rules.
 *
 * Kept in its own side-effect-free module so the rule can be unit tested
 * without constructing a Queue (which would open a Redis connection).
 */

/**
 * Bull id for a job attempt.
 *
 * Bull silently ignores `add()` when the given jobId already exists, and the
 * original entry is kept because `removeOnComplete` is false. A retry therefore
 * has to use a distinct id, or the re-enqueue is a no-op and the job is
 * stranded in `queued` forever.
 */
export function bullJobId(jobId: string, attempt = 0): string {
  return attempt > 0 ? `${jobId}:retry-${attempt}` : jobId;
}

/** Every Bull id a single application job can occupy, base id first. */
export function bullJobIds(jobId: string, maxAttempts: number): string[] {
  const ids = [bullJobId(jobId, 0)];
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    ids.push(bullJobId(jobId, attempt));
  }
  return ids;
}
