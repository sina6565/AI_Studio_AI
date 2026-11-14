import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AgentContext } from './contracts';
import { InMemoryMemory } from './infra/memory';
import { SimpleProviderRegistry, OllamaProvider, FakeProvider } from './infra/providers';
import { SimpleToolRegistry, FileWriteTool } from './infra/tools';
import { ConsoleMonitor } from './infra/monitor';
import { PolicyApproval } from './infra/approval';
import { CodingAgent } from './agents/coding.agent';
import { QAAgent } from './agents/qa.agent';
import { Orchestrator } from './agents/orchestrator';

async function main(): Promise<void> {
  const workspace = await mkdtemp(join(tmpdir(), 'sina-ws-'));
  console.log('workspace:', workspace);

  // FakeProvider is the deterministic, network-free default for CI.
  // Ollama is selected only when explicitly requested by the operator.
  const provider = process.env.SINA_PROVIDER === 'ollama'
    ? new OllamaProvider(
        process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
        process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      )
    : new FakeProvider();

  const providers = new SimpleProviderRegistry([provider]);
  const tools = new SimpleToolRegistry();
  tools.register(new FileWriteTool(workspace));

  const ctx: AgentContext = {
    runId: `run-${Date.now()}`,
    memory: new InMemoryMemory(),
    tools,
    providers,
    monitor: new ConsoleMonitor(),
    approval: new PolicyApproval(),
    log: (message: string) => console.log('[orch]', message),
  };

  const orchestrator = new Orchestrator(
    new CodingAgent(),
    new QAAgent(),
    1,
  );
  const result = await orchestrator.run(
    'Create a function add(a, b) that returns their sum',
    ctx,
  );

  console.log('\n=== RESULT ===');
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nArtifacts workspace: ${workspace}`);

  if (!result.ok) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error('[vertical-slice] fatal error:', error);
  process.exitCode = 1;
});
