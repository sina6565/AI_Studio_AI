import { AgentRegistry } from '../src/agents/AgentRegistry';
import { AgentRunner } from '../src/agents/AgentRunner';
import { InMemoryMessageBus } from '../src/agents/messaging/MessageBus';
import { SINAAgent } from '../src/agents/contracts/AgentContract';

const makeAgent = (overrides: Partial<SINAAgent> = {}): SINAAgent => ({
  id: 'test-agent',
  name: 'Test Agent',
  version: '1.0.0',
  description: 'Agent used in unit tests',
  capabilities: ['test'],
  enabled: true,
  execute: jest.fn(async (input: Record<string, unknown>) => ({ content: input })),
  ...overrides,
});

describe('Native agent foundation', () => {
  it('registers agents and resolves capabilities case-insensitively', () => {
    const registry = new AgentRegistry();
    registry.register(makeAgent());

    expect(registry.get('TEST-AGENT')).toBeDefined();
    expect(registry.findByCapability('TEST')).toHaveLength(1);
    expect(() => registry.register(makeAgent())).toThrow('already registered');
  });

  it('runs an enabled agent and returns a structured result', async () => {
    const registry = new AgentRegistry();
    registry.register(makeAgent());
    const runner = new AgentRunner(registry);

    const result = await runner.run({
      id: 'task-1',
      agentId: 'test-agent',
      capability: 'test',
      input: { prompt: 'hello' },
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.output.content).toEqual({ prompt: 'hello' });
  });

  it('rejects disabled agents without executing them', async () => {
    const execute = jest.fn(async () => ({ content: 'should not run' }));
    const registry = new AgentRegistry();
    registry.register(makeAgent({ enabled: false, execute }));
    const runner = new AgentRunner(registry);

    const result = await runner.run({
      id: 'task-2',
      agentId: 'test-agent',
      capability: 'test',
      input: {},
    });

    expect(result.ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it('propagates cancellation signals and skips tasks already aborted', async () => {
    const controller = new AbortController();
    const execute = jest.fn(async (_input: Record<string, unknown>, context: { signal?: AbortSignal }) => ({
      content: { cancelled: context.signal?.aborted ?? false },
    }));
    const registry = new AgentRegistry();
    registry.register(makeAgent({ execute }));
    const runner = new AgentRunner(registry);

    const completed = await runner.run({
      id: 'task-cancel-propagation',
      agentId: 'test-agent',
      capability: 'test',
      input: {},
      signal: controller.signal,
    });
    expect(completed.ok).toBe(true);
    expect(execute).toHaveBeenCalledWith({}, expect.objectContaining({ signal: controller.signal }));

    controller.abort();
    const aborted = await runner.run({
      id: 'task-already-aborted',
      agentId: 'test-agent',
      capability: 'test',
      input: {},
      signal: controller.signal,
    });
    expect(aborted.ok).toBe(false);
    if (!aborted.ok) expect(aborted.error.code).toBe('AGENT_ABORTED');
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('publishes events to subscribers and supports unsubscribe', async () => {
    const bus = new InMemoryMessageBus();
    const handler = jest.fn();
    const unsubscribe = bus.subscribe('agent.completed', handler);
    const event = {
      id: 'event-1',
      type: 'agent.completed',
      source: 'test-agent',
      occurredAt: new Date().toISOString(),
      payload: { taskId: 'task-1' },
    };

    await bus.publish(event);
    unsubscribe();
    await bus.publish({ ...event, id: 'event-2' });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });
});
