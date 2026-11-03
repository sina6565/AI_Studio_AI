/** Vertical-slice ports. These contracts are intentionally independent of
 * the production Orchestrator and can be adapted behind dependency injection.
 */
export interface Budget {
  maxTokens?: number;
  maxMs?: number;
}

export interface Artifact {
  id: string;
  name: string;
  kind: 'file' | 'text' | 'json';
  content: string;
}

export interface Task {
  id: string;
  type: string;
  goal: string;
  input?: unknown;
  budget?: Budget;
}

export interface AgentResult {
  ok: boolean;
  output: unknown;
  artifacts?: Artifact[];
  logs?: string[];
  usage?: { tokens: number };
}

export interface MemoryPort {
  put(runId: string, key: string, value: unknown): Promise<void>;
  get<T = unknown>(runId: string, key: string): Promise<T | undefined>;
}

export interface Provider {
  id: string;
  complete(
    prompt: string,
    opts?: { system?: string; maxTokens?: number },
  ): Promise<{ text: string; tokens: number }>;
}

export interface ProviderRegistry {
  pick(req?: { needs?: string[]; localOnly?: boolean }): Provider;
}

export interface Tool {
  name: string;
  run(input: unknown): Promise<unknown>;
}

export interface ToolRegistry {
  get(name: string): Tool | undefined;
  register(tool: Tool): void;
  list(): string[];
}

export interface Span {
  end(result: { ok: boolean; ms: number; tokens?: number; error?: string }): void;
}

export interface ExecutionMonitor {
  start(runId: string, agentId: string, taskId: string): Span;
}

export interface ApprovalManager {
  require(action: string, payload: unknown): Promise<boolean>;
}

export interface AgentContext {
  runId: string;
  memory: MemoryPort;
  tools: ToolRegistry;
  providers: ProviderRegistry;
  monitor: ExecutionMonitor;
  approval: ApprovalManager;
  log(message: string): void;
}

export interface Agent {
  id: string;
  capabilities: string[];
  handle(task: Task, context: AgentContext): Promise<AgentResult>;
}
