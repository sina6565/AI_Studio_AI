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

/**
 * Bridges the existing vertical-slice agents into the native SINA registry.
 * It deliberately requires the caller to provide a scoped context factory;
 * this adapter does not create tools, grant permissions, or expose provider keys.
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
    if (context.signal?.aborted) throw new Error('Agent task was cancelled');

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

    const result = await this.agent.handle(task, this.createContext(context));
    if (context.signal?.aborted) throw new Error('Agent task was cancelled');
    if (!result.ok) throw new Error(errorFromResult(result));

    return {
      // Preserve source artifact contents as data; never execute returned code.
      content: { result: result.output, artifacts: result.artifacts || [] },
      metadata: {
        ...(result.logs ? { logs: [...result.logs] } : {}),
        ...(result.usage ? { usage: { ...result.usage } } : {}),
        adapter: 'vertical-slice',
      },
    };
  }
}

/** Register a selected set of existing vertical-slice agents in the native registry. */
export function registerVerticalSliceAgents(
  registry: AgentRegistry,
  agents: readonly VerticalSliceAgent[],
  createContext: VerticalSliceContextFactory,
): void {
  for (const agent of agents) {
    registry.register(new VerticalSliceAgentAdapter(agent, createContext));
  }
}
