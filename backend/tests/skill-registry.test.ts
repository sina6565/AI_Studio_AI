import { AgentSkill, SkillRegistry } from '../src/agents/skills/SkillRegistry';

const makeSkill = (overrides: Partial<AgentSkill> = {}): AgentSkill => ({
  id: 'typescript-review',
  name: 'TypeScript Review',
  version: '1.0.0',
  description: 'Review TypeScript changes for correctness and maintainability.',
  capabilities: ['code.review', 'typescript'],
  instructions: 'Inspect types, error handling, tests, and backward compatibility.',
  enabled: true,
  ...overrides,
});

describe('SkillRegistry', () => {
  it('registers skills and resolves enabled skills by capability', () => {
    const registry = new SkillRegistry();
    registry.register(makeSkill());

    expect(registry.get('TYPESCRIPT-REVIEW')?.name).toBe('TypeScript Review');
    expect(registry.findByCapability('CODE.REVIEW')).toHaveLength(1);
    expect(registry.list()).toHaveLength(1);
  });

  it('does not expose instructions in summary listings', () => {
    const registry = new SkillRegistry();
    registry.register(makeSkill());

    expect(registry.list()[0]).not.toHaveProperty('instructions');
    expect(registry.get('typescript-review')).toHaveProperty('instructions');
  });

  it('rejects duplicate or malformed skill identifiers', () => {
    const registry = new SkillRegistry();
    registry.register(makeSkill());

    expect(() => registry.register(makeSkill())).toThrow('already registered');
    expect(() => registry.register(makeSkill({ id: '../unsafe' }))).toThrow('Skill id');
  });

  it('rejects empty and oversized instruction payloads', () => {
    const registry = new SkillRegistry();
    expect(() => registry.register(makeSkill({ instructions: '  ' }))).toThrow('instructions are required');
    expect(() => registry.register(makeSkill({ instructions: 'x'.repeat(32_001) }))).toThrow('exceed');
  });

  it('copies capability arrays so callers cannot mutate registered state', () => {
    const registry = new SkillRegistry();
    registry.register(makeSkill());
    const skill = registry.get('typescript-review');
    skill?.capabilities.push('admin');

    expect(registry.findByCapability('admin')).toHaveLength(0);
  });

  it('supports explicit enable/disable and unregister operations', () => {
    const registry = new SkillRegistry();
    registry.register(makeSkill());

    expect(registry.setEnabled('typescript-review', false)).toBe(true);
    expect(registry.findByCapability('code.review')).toHaveLength(0);
    expect(registry.setEnabled('missing', true)).toBe(false);
    expect(registry.unregister('typescript-review')).toBe(true);
    expect(registry.get('typescript-review')).toBeUndefined();
  });
});
