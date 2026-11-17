import { MemoryPort } from '../contracts';

/** Per-process memory adapter for deterministic local/CI vertical-slice runs. */
export class InMemoryMemory implements MemoryPort {
  private readonly runs = new Map<string, Map<string, unknown>>();

  async put(runId: string, key: string, value: unknown): Promise<void> {
    if (!runId.trim() || !key.trim()) {
      throw new Error('Memory runId and key must be non-empty');
    }
    let run = this.runs.get(runId);
    if (!run) {
      run = new Map<string, unknown>();
      this.runs.set(runId, run);
    }
    run.set(key, value);
  }

  async get<T = unknown>(runId: string, key: string): Promise<T | undefined> {
    return this.runs.get(runId)?.get(key) as T | undefined;
  }
}
