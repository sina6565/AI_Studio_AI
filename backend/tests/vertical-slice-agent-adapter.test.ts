import { AgentContext as VerticalSliceContext, Agent as VerticalSliceAgent } from '../src/agents/vertical-slice/contracts';
import { AgentRegistry } from '../src/agents/AgentRegistry';
import { VerticalSliceAgentAdapter, registerVerticalSliceAgents } from '../src/agents/VerticalSliceAgentAdapter';
import { SINAAgent } from '../src/agents/contracts/AgentContract';

function makeContext(): VerticalSliceContext {
  return {
    runId: 'test-run',
    memory: { put: jest.fn(), get: jest.fn() },
    tools: { get: jest.fn(), register: jest.fn(), list: jest.fn(() => []) },
    providers: { pick: jest.fn() },
    monitor: { start: jest.fn(() => ({ end: jest.fn() })) },
    approval: { require: jest.fn(async () => true) },
    log: jest.fn(),
  };
}

function makeLegacyAgent(overrides: Partial<VerticalSliceAgent> = {}): VerticalSliceAgent {
  return {
    id: 'legacy-coder',
    capabilities: ['code.write'],
    handle: jest.fn(async () => ({
      ok: true,
      output: { file: 'src/example.ts' },
      artifacts: [{ id: 'example', name: 'src/example.ts', kind: 'file', content: 'export const value = 1;\n' }],
      usage: { tokens: 10 },
    })),
    ...overrides,
  };
}

const executionContext = {
  taskId: 'task-1',
  userId: 'user-1',
  projectId: 'project-1',
  correlationId: 'correlation-1',
};

describe('VerticalSliceAgentAdapter', () => {
  it('maps native tasks to an existing agent and keeps artifacts as data', async () => {
    const agent = makeLegacyAgent();
    const context = makeContext();
    const adapter = new VerticalSliceAgentAdapter(agent, () => context);

    const output = await adapter.execute({ goal: 'Create a module', taskInput: { retry: 1 } }, executionContext);

    expect(agent.handle).toHaveBeenCalledWith({
      id: 'task-1', type: 'code.write', goal: 'Create a module', input: { retry: 1 },
    }, context);
    expect(output.content).toEqual({
      result: { file: 'src/example.ts' },
      artifacts: [{ id: 'example', name: 'src/example.ts', kind: 'file', content: 'export const value = 1;\n' }],
    });
    expect(output.metadata).toEqual({ usage: { tokens: 10 }, adapter: 'vertical-slice' });
  });

  it('rejects invalid input and unsuccessful legacy results', async () => {
    const adapter = new VerticalSliceAgentAdapter(makeLegacyAgent(), () => makeContext());
    await expect(adapter.execute({}, executionContext)).rejects.toThrow('non-empty goal');

    const failing = new VerticalSliceAgentAdapter(makeLegacyAgent({
      handle: jest.fn(async () => ({ ok: false, output: { error: 'validation failed' } })),
    }), () => makeContext());
    await expect(failing.execute({ goal: 'Try' }, executionContext)).rejects.toThrow('validation failed');
  });

  it('registers existing adapters in the native registry', () => {
    const registry = new AgentRegistry();
    registerVerticalSliceAgents(registry, [makeLegacyAgent()], makeContext);

    const registered: SINAAgent | undefined = registry.get('LEGACY-CODER');
    expect(registered).toBeDefined();
    expect(registry.findByCapability('CODE.WRITE')).toHaveLength(1);
  });

  it('does not start an already cancelled task', async () => {
    const agent = makeLegacyAgent();
    const adapter = new VerticalSliceAgentAdapter(agent, makeContext);
    const controller = new AbortController();
    controller.abort();

    await expect(adapter.execute({ goal: 'Do not run' }, { ...executionContext, signal: controller.signal }))
      .rejects.toThrow('cancelled');
    expect(agent.handle).not.toHaveBeenCalled();
  });
});
