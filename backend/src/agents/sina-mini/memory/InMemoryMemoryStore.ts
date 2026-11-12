import { MemoryQuery, MemoryStore, PersonalMemory } from '../contracts';

/**
 * Deterministic adapter for tests and early local development.
 * This adapter is process-local: it is not durable and is not a cloud sync layer.
 */
export class InMemoryMemoryStore implements MemoryStore {
  private readonly records = new Map<string, PersonalMemory>();

  async put(memory: PersonalMemory): Promise<void> {
    if (!memory.id.trim() || !memory.ownerId.trim() || !memory.key.trim()) {
      throw new Error('Memory id, ownerId and key are required');
    }
    if (!memory.content.trim()) {
      throw new Error('Memory content must not be empty');
    }
    const normalized = { ...memory, tags: [...new Set(memory.tags)] };
    this.records.set(this.recordKey(memory.ownerId, memory.id), normalized);
  }

  async get(ownerId: string, memoryId: string): Promise<PersonalMemory | undefined> {
    const memory = this.records.get(this.recordKey(ownerId, memoryId));
    return memory ? this.copy(memory) : undefined;
  }

  async search(query: MemoryQuery): Promise<PersonalMemory[]> {
    const ownerId = query.ownerId.trim();
    if (!ownerId) throw new Error('Memory search requires ownerId');

    const terms = (query.text || '')
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean);
    const requestedTags = (query.tags || []).map((tag) => tag.toLowerCase());
    const limit = Math.max(1, Math.min(query.limit ?? 10, 100));

    return Array.from(this.records.values())
      .filter((memory) => memory.ownerId === ownerId)
      .filter((memory) => !query.kind || memory.kind === query.kind)
      .filter((memory) => requestedTags.length === 0
        || requestedTags.every((tag) => memory.tags.some((item) => item.toLowerCase() === tag)))
      .map((memory) => ({
        memory,
        score: terms.reduce((score, term) => {
          const haystack = [memory.key, memory.content, ...memory.tags].join(' ').toLowerCase();
          return score + (haystack.includes(term) ? 1 : 0);
        }, 0),
      }))
      .filter((item) => terms.length === 0 || item.score > 0)
      .sort((a, b) => b.score - a.score || b.memory.updatedAt.localeCompare(a.memory.updatedAt))
      .slice(0, limit)
      .map((item) => this.copy(item.memory));
  }

  async delete(ownerId: string, memoryId: string): Promise<boolean> {
    return this.records.delete(this.recordKey(ownerId, memoryId));
  }

  private recordKey(ownerId: string, memoryId: string): string {
    return ownerId + ':' + memoryId;
  }

  private copy(memory: PersonalMemory): PersonalMemory {
    return { ...memory, tags: [...memory.tags] };
  }
}

export default InMemoryMemoryStore;
