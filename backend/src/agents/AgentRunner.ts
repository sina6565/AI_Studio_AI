import {
  AgentExecutionResult,
  AgentTask,
  SINAAgent,
} from './contracts/AgentContract';
import { AgentRegistry } from './AgentRegistry';

/**
 * Executes one registered agent. Scheduling, retries, persistence, permissions,
 * and model selection deliberately remain outside the runner.
 */
export class AgentRunner {
  constructor(private readonly registry: AgentRegistry) {}

  async run(task: AgentTask): Promise<AgentExecutionResult> {
    const startedAt = Date.now();
    const agent = this.registry.get(task.agentId);

    if (!agent) {
      return this.failure(task, 'AGENT_NOT_FOUND', 'Requested agent is not registered', startedAt);
    }
    if (!agent.enabled) {
      return this.failure(task, 'AGENT_DISABLED', 'Requested agent is disabled', startedAt);
    }
    if (!this.supports(agent, task.capability)) {
      return this.failure(task, 'CAPABILITY_NOT_SUPPORTED', 'Agent does not support the requested capability', startedAt);
    }

    try {
      const output = await agent.execute(task.input, {
        taskId: task.id,
        userId: task.userId,
        projectId: task.projectId,
        correlationId: task.correlationId,
      });
      return {
        ok: true,
        taskId: task.id,
        agentId: agent.id,
        output,
        durationMs: Date.now() - startedAt,
      };
    } catch (error) {
      return this.failure(
        task,
        'AGENT_EXECUTION_FAILED',
        error instanceof Error ? error.message : 'Unknown agent execution error',
        startedAt,
        agent,
      );
    }
  }

  private supports(agent: SINAAgent, capability: string): boolean {
    const requested = capability.trim().toLowerCase();
    return agent.capabilities.some((item) => item.toLowerCase() === requested);
  }

  private failure(
    task: AgentTask,
    code: string,
    message: string,
    startedAt: number,
    agent?: SINAAgent,
  ): AgentExecutionResult {
    return {
      ok: false,
      taskId: task.id,
      agentId: agent?.id || task.agentId,
      error: { code, message },
      durationMs: Date.now() - startedAt,
    };
  }
}

export default AgentRunner;
