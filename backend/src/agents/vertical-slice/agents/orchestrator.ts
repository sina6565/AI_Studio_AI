import { Agent, AgentContext, AgentResult, Task } from '../contracts';

export interface OrchestratorResult {
  ok: boolean;
  phase?: 'coding' | 'qa';
  attempt: number;
  coderResult?: AgentResult;
  qaResult?: AgentResult;
}

function normalizeRetries(value: number): number {
  if (!Number.isInteger(value) || value < 0 || value > 3) {
    throw new Error('maxRetries must be an integer between 0 and 3');
  }
  return value;
}

/**
 * Minimal vertical-slice coordinator:
 * plan -> coding -> QA -> bounded retry with QA feedback.
 *
 * It deliberately delegates execution and monitoring to the injected agents.
 */
export class Orchestrator {
  readonly id = 'orchestrator';
  readonly capabilities = ['plan', 'route', 'execute', 'reflect'];
  private readonly maxRetries: number;

  constructor(
    private readonly coding: Agent,
    private readonly qa: Agent,
    maxRetries = 1,
  ) {
    this.maxRetries = normalizeRetries(maxRetries);
  }

  async run(goal: string, ctx: AgentContext): Promise<OrchestratorResult> {
    if (typeof goal !== 'string' || !goal.trim()) {
      throw new Error('Orchestrator goal must be a non-empty string');
    }

    let lastCoderResult: AgentResult | undefined;
    let lastQaResult: AgentResult | undefined;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt += 1) {
      ctx.log(`Orchestrator: starting attempt ${attempt}/${this.maxRetries + 1}`);

      const codeTask: Task = {
        id: `code-${attempt}`,
        type: 'coding',
        goal,
        input: lastQaResult
          ? { previousFailure: lastQaResult.output, attempt }
          : undefined,
      };

      lastCoderResult = await this.coding.handle(codeTask, ctx);
      if (!lastCoderResult.ok) {
        ctx.log(`Orchestrator: coding failed on attempt ${attempt}`);
        return {
          ok: false,
          phase: 'coding',
          attempt,
          coderResult: lastCoderResult,
        };
      }

      const artifact = lastCoderResult.artifacts?.find(
        (item) => item.kind === 'file' && item.name === 'src/add.ts',
      );
      if (!artifact) {
        const missingArtifact: AgentResult = {
          ok: false,
          output: { error: 'CodingAgent did not return src/add.ts artifact' },
        };
        ctx.log('Orchestrator: expected src/add.ts artifact was not returned');
        return {
          ok: false,
          phase: 'coding',
          attempt,
          coderResult: missingArtifact,
        };
      }

      const qaTask: Task = {
        id: `qa-${attempt}`,
        type: 'qa',
        goal: 'Verify the generated src/add.ts artifact',
        input: { artifact },
      };

      lastQaResult = await this.qa.handle(qaTask, ctx);
      if (lastQaResult.ok) {
        ctx.log(`Orchestrator: QA passed on attempt ${attempt}`);
        return {
          ok: true,
          attempt,
          coderResult: lastCoderResult,
          qaResult: lastQaResult,
        };
      }

      ctx.log(
        `Orchestrator: QA failed on attempt ${attempt}; ${attempt <= this.maxRetries ? 'retrying with feedback' : 'retry limit reached'}`,
      );
    }

    return {
      ok: false,
      phase: 'qa',
      attempt: this.maxRetries + 1,
      coderResult: lastCoderResult,
      qaResult: lastQaResult,
    };
  }
}
