import {
  Agent as VerticalSliceAgent,
  AgentContext as VerticalSliceContext,
  AgentResult,
  Task as VerticalSliceTask,
} from './vertical-slice/contracts';
import { AgentRegistry } from './AgentRegistry';
import {
  AgentExecutionContext,
  AgentInput,
  AgentOutput,
  SINAAgent,
} from './contracts/AgentContract';

export type VerticalSliceContextFactory = (
  context: AgentExecutionContext,
) => VerticalSliceContext;

function errorFromResult(result: AgentResult): string {
  const output = result.output;
  if (output && typeof output === 'object' && 'error' in output) {
    const error = (output as { error?: unknown }).error;
    if (typeof error === 'string') return error;
  }
  return 'Vertical-slice agent reported an unsuccessful result';
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error('Agent task was cancelled');
}

/**
 * Bridges the existing vertical-slice agents into the native SINA registry.
 * The context factory receives the native execution context and must return
 * scoped ports; the adapter never creates tools or exposes provider credentials.
 */
export class VerticalSliceAgentAdapter implements SINAAgent {
  readonly id: string;
  readonly name: string;
  readonly version = '1.0.0';
  readonly description: string;
  readonly capabilities: string[];
  readonly enabled = true;

  constructor(
    private readonly agent: VerticalSliceAgent,
    private readonly createContext: VerticalSliceContextFactory,
    options: { name?: string; description?: string } = {},
  ) {
    this.id = agent.id;
    this.name = options.name || agent.id;
    this.description = options.description || `Adapter for the ${agent.id} vertical-slice agent`;
    this.capabilities = [...agent.capabilities];
  }

  async execute(input: AgentInput, context: AgentExecutionContext): Promise<AgentOutput> {
    throwIfAborted(context.signal);

    const goal = input.goal;
    if (typeof goal !== 'string' || !goal.trim()) {
      throw new Error('A non-empty goal is required by the vertical-slice agent adapter');
    }

    const budget = input.budget;
    const task: VerticalSliceTask = {
      id: context.taskId,
      type: input.type === undefined ? this.capabilities[0] : String(input.type),
      goal,
      ...(input.taskInput !== undefined ? { input: input.taskInput } : {}),
      ...(budget && typeof budget === 'object' ? { budget: budget as VerticalSliceTask['budget'] } : {}),
    };

    const legacyContext = this.createContext(context);

    // Use a race with cancellation so a legacy agent that ignores cooperation
    // cannot return success after native cancellation. It cannot undo a side
    // effect already performed by an adapter-provided tool, so callers must
    // also wrap writable ports in a cancellation guard.
    const execution = this.agent.handle(task, legacyContext);
    const result = await (context.signal
      ? Promise.race([
          execution,
          new Promise<never>((_resolve, reject) => {
            if (context.signal!.aborted) {
              reject(new Error('Agent task was cancelled'));
              return;
            }
            context.signal!.addEventListener('abort', () => {
              reject(new Error('Agent task was cancelled'));
            }, { once: true });
          }),
        ])
      : execution);

    throwIfAborted(context.signal);
    if (!result.ok) throw new Error(errorFromResult(result));

    return {
      // Never execute generated source; return source and artifacts as data.
      content: { result: result.output, artifacts: result.artifacts || [] },
      metadata: {
        ...(result.logs ? { logs: [...result.logs] } : {}),
        ...(result.usage ? { usage: { ...result.usage } } : {}),
        adapter: 'vertical-slice',
      },
    };
  }
}

/** Register existing vertical-slice agents in the native registry. */
export function registerVerticalSliceAgents(
  registry: AgentRegistry,
  agents: readonly VerticalSliceAgent[],
  createContext: VerticalSliceContextFactory,
): void {
  for (const agent of agents) {
    registry.register(new VerticalSliceAgentAdapter(agent, createContext));
  }
}
