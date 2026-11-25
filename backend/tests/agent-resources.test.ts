import { AgentResourceEngine } from '../src/agents/resources/AgentResourceEngine';
import { InMemoryAgentResourceRepository } from '../src/agents/resources/InMemoryAgentResourceRepository';
import { AgentResource } from '../src/agents/resources/AgentResource';

const skill: AgentResource = {
  id: 'web-builder',
  kind: 'skill',
  name: 'Website Builder',
  version: '1.0.0',
  description: 'Guidance for building websites',
  capabilities: ['website.create'],
  scope: { type: 'global' },
  instructions: 'Build accessible, responsive pages.',
  enabled: true,
};

describe('AgentResourceEngine', () => {
  let engine: AgentResourceEngine;

  beforeEach(() => {
    engine = new AgentResourceEngine(new InMemoryAgentResourceRepository());
  });

  it('registers and resolves capability-matched resources', async () => {
    await engine.register(skill);
    const result = await engine.resolve({ capability: 'website.create' });
    expect(result.instructions).toContain('Build accessible, responsive pages.');
    expect(result.resourceIds).toEqual(['web-builder']);
  });

  it('isolates tenant and project resources by scope', async () => {
    await engine.register({
      ...skill,
      id: 'tenant-skill',
      scope: { type: 'tenant', tenantId: 'tenant-a' },
    });
    await engine.register({
      ...skill,
      id: 'project-skill',
      scope: { type: 'project', tenantId: 'tenant-a', projectId: 'project-a' },
    });
    expect((await engine.resolve({ capability: 'website.create', tenantId: 'tenant-b' })).resourceIds).toEqual([]);
    expect((await engine.resolve({
      capability: 'website.create',
      tenantId: 'tenant-a',
      projectId: 'project-a',
    })).resourceIds).toEqual(['project-skill', 'tenant-skill']);
  });

  it('does not expose connector resources unless explicitly allowlisted', async () => {
    await engine.register({
      id: 'docs-connector',
      kind: 'connector',
      name: 'Documentation Tools',
      version: '1.0.0',
      description: 'Scoped documentation tools',
      capabilities: ['docs.search'],
      scope: { type: 'global' },
      connectionId: 'connection-ref-1',
      toolNames: ['search_docs'],
      enabled: true,
    });
    expect((await engine.resolve({ capability: 'docs.search' })).connectorRefs).toEqual([]);
    expect((await engine.resolve({
      capability: 'docs.search',
      allowedConnectorIds: ['docs-connector'],
    })).connectorRefs).toEqual([{
      resourceId: 'docs-connector',
      connectionId: 'connection-ref-1',
      toolNames: ['search_docs'],
    }]);
  });

  it('redacts instruction bodies from summaries and returns defensive copies', async () => {
    await engine.register(skill);
    const summaries = await engine.list();
    expect(JSON.stringify(summaries)).not.toContain(skill.instructions);
    const stored = await engine.get('web-builder');
    stored?.capabilities.push('admin.root');
    expect((await engine.get('web-builder'))?.capabilities).toEqual(['website.create']);
  });

  it('rejects duplicate ids, including concurrent registrations, and oversized instructions', async () => {
    const registrations = await Promise.allSettled([engine.register(skill), engine.register(skill)]);
    expect(registrations.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(registrations.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await expect(engine.register(skill)).rejects.toThrow('already registered');
    await expect(engine.register({
      ...skill,
      id: 'oversized',
      instructions: 'x'.repeat(32_001),
    })).rejects.toThrow('exceeds');
  });

  it('supports enable, disable and removal lifecycle', async () => {
    await engine.register(skill);
    expect(await engine.setEnabled('web-builder', false)).toBe(true);
    expect((await engine.resolve({ capability: 'website.create' })).resourceIds).toEqual([]);
    expect(await engine.remove('web-builder')).toBe(true);
    expect(await engine.get('web-builder')).toBeUndefined();
  });
});
