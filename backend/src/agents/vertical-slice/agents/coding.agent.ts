import { Agent, AgentContext, AgentResult, Task } from '../contracts';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Generates a TypeScript add function through a local-only provider and saves
 * it as a workspace artifact. This agent does not execute generated code.
 */
export class CodingAgent implements Agent {
  readonly id = 'coding';
  readonly capabilities = ['code.write'];

  async handle(task: Task, ctx: AgentContext): Promise<AgentResult> {
    const span = ctx.monitor.start(ctx.runId, this.id, task.id);
    const startedAt = Date.now();

    try {
      const provider = ctx.providers.pick({ localOnly: true });
      const system =
        'You are a senior TypeScript engineer. Return only valid TypeScript source code. Do not use Markdown fences or explanations.';
      const prompt = [
        `Goal: ${task.goal}`,
        task.input !== undefined
          ? `Feedback from previous attempt:\n${JSON.stringify(task.input)}`
          : '',
        'Create a TypeScript function named add in the file src/add.ts.',
        'The function must accept two numbers and return their sum.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const completion = await provider.complete(prompt, {
        system,
        maxTokens: task.budget?.maxTokens ?? 800,
      });

      const source = completion.text.trim();
      if (!source) throw new Error('Provider returned empty source code');
      if (/```/.test(source)) {
        throw new Error('Provider returned Markdown fences; expected raw TypeScript');
      }

      const fileTool = ctx.tools.get('file.write');
      if (!fileTool) throw new Error('file.write tool is not registered');

      await fileTool.run({ path: 'src/add.ts', content: `${source}\n` });

      const artifact = {
        id: 'add.ts',
        name: 'src/add.ts',
        kind: 'file' as const,
        content: `${source}\n`,
      };
      await ctx.memory.put(ctx.runId, 'coding.artifact', artifact);

      span.end({
        ok: true,
        ms: Date.now() - startedAt,
        tokens: completion.tokens,
      });

      return {
        ok: true,
        output: { file: 'src/add.ts', provider: provider.id },
        artifacts: [artifact],
        usage: { tokens: completion.tokens },
      };
    } catch (error) {
      const message = errorMessage(error);
      span.end({ ok: false, ms: Date.now() - startedAt, error: message });
      ctx.log(`CodingAgent failed: ${message}`);
      return { ok: false, output: { error: message } };
    }
  }
}
