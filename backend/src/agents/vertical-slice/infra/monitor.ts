import { ExecutionMonitor, Span } from '../contracts';

/**
 * Console-backed execution monitor for the vertical-slice MVP.
 * Span completion is idempotent so duplicate finally/catch calls cannot
 * produce misleading duplicate completion records.
 */
export class ConsoleMonitor implements ExecutionMonitor {
  start(runId: string, agentId: string, taskId: string): Span {
    const startedAt = Date.now();
    let ended = false;

    console.log(
      `[start] run=${runId} agent=${agentId} task=${taskId} at=${new Date(startedAt).toISOString()}`,
    );

    return {
      end: ({ ok, ms, tokens, error }) => {
        if (ended) return;
        ended = true;

        const durationMs = Number.isFinite(ms) && ms >= 0
          ? ms
          : Date.now() - startedAt;
        const safeError = error
          ? error.replace(/[\\r\\n\\t]/g, ' ').slice(0, 300)
          : undefined;

        console.log(
          `[end] run=${runId} agent=${agentId} task=${taskId} ok=${ok} ms=${durationMs} tokens=${tokens ?? 0}${safeError ? ` err=${safeError}` : ''}`,
        );
      },
    };
  }
}
