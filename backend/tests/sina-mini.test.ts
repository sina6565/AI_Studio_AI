import { AgentSkill, PersonalMemory } from '../src/agents/sina-mini/contracts';
import { InMemoryMemoryStore } from '../src/agents/sina-mini/memory/InMemoryMemoryStore';
import { InMemorySkillRegistry } from '../src/agents/sina-mini/skills/InMemorySkillRegistry';

const memory = (overrides: Partial<PersonalMemory> = {}): PersonalMemory => ({
  id: 'm-1',
  ownerId: 'user-a',
  kind: 'preference',
  key: 'response-style',
  content: 'Prefer concise Persian answers',
  visibility: 'private',
  createdAt: '2026-11-12T00:00:00.000Z',
  updatedAt: '2026-11-12T00:00:00.000Z',
  tags: ['language', 'style'],
  ...overrides,
});

const skill = (overrides: Partial<AgentSkill> = {}): AgentSkill => ({
  id: 'summarize',
  version: '1.0.0',
  name: 'Summarize',
  description: 'Summarize supplied text',
  ownerId: 'user-a',
  trust: 'local',
  enabled: true,
  requiresApproval: false,
  createdAt: '2026-11-12T00:00:00.000Z',
  ...overrides,
});

describe('SINA Mini memory store', () => {
  it('keeps memories isolated by owner', async () => {
    const store = new InMemoryMemoryStore();
    await store.put(memory());
    expect(await store.search({ ownerId: 'user-b' })).toEqual([]);
    expect(await store.get('user-b', 'm-1')).toBeUndefined();
  });

  it('supports deterministic text and tag retrieval', async () => {
    const store = new InMemoryMemoryStore();
    await store.put(memory());
    expect((await store.search({ ownerId: 'user-a', text: 'Persian' })).map((m) => m.id)).toEqual(['m-1']);
    expect((await store.search({ ownerId: 'user-a', tags: ['STYLE'] })).map((m) => m.id)).toEqual(['m-1']);
  });

  it('enforces result limits and supports deletion', async () => {
    const store = new InMemoryMemoryStore();
    await store.put(memory());
    await store.put(memory({ id: 'm-2', key: 'timezone', content: 'UTC' }));
    expect(await store.search({ ownerId: 'user-a', limit: 1 })).toHaveLength(1);
    expect(await store.delete('user-b', 'm-1')).toBe(false);
    expect(await store.delete('user-a', 'm-1')).toBe(true);
    expect(await store.get('user-a', 'm-1')).toBeUndefined();
  });

  it('rejects empty ownership identifiers', async () => {
    const store = new InMemoryMemoryStore();
    await expect(store.search({ ownerId: ' ' })).rejects.toThrow('ownerId');
  });
});

describe('SINA Mini skill registry', () => {
  it('scopes skill lookup and listing to the owner', async () => {
    const registry = new InMemorySkillRegistry();
    await registry.register(skill());
    await registry.register(skill({ ownerId: 'user-b', description: 'Other user skill' }));
    expect(await registry.get('user-a', 'summarize')).toMatchObject({ ownerId: 'user-a' });
    expect(await registry.get('user-b', 'summarize')).toMatchObject({ ownerId: 'user-b' });
    expect(await registry.get('user-c', 'summarize')).toBeUndefined();
    expect(await registry.list('user-b')).toHaveLength(1);
  });

  it('rejects duplicate skill ids for the same owner', async () => {
    const registry = new InMemorySkillRegistry();
    await registry.register(skill());
    await expect(registry.register(skill())).rejects.toThrow('already exists');
  });

  it('allows an owner to enable and disable their skill only', async () => {
    const registry = new InMemorySkillRegistry();
    await registry.register(skill());
    expect(await registry.setEnabled('user-b', 'summarize', false)).toBe(false);
    expect(await registry.setEnabled('user-a', 'summarize', false)).toBe(true);
    expect(await registry.get('user-a', 'summarize')).toMatchObject({ enabled: false });
  });
});
