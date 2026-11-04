/**
 * Stable contract shared by every native SINA agent.
 * Keep this provider- and framework-agnostic.
 */
export type AgentInput = Record<string, unknown>;

export interface AgentTask {
  id: string;
  agentId: string;
  capability: string;
  input: AgentInput;
  userId?: string;
  projectId?: string;
  correlationId?: string;
}

export interface AgentExecutionContext {
  taskId: string;
  userId?: string;
  projectId?: string;
  correlationId?: string;
  signal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface AgentArtifact {
  id: string;
  kind: string;
  uri: string;
  mimeType?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentOutput {
  content: unknown;
  artifacts?: AgentArtifact[];
  metadata?: Record<string, unknown>;
}

export interface AgentDefinition {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  enabled: boolean;
}

export interface SINAAgent extends AgentDefinition {
  execute(input: AgentInput, context: AgentExecutionContext): Promise<AgentOutput>;
}

export type AgentExecutionResult =
  | {
      ok: true;
      taskId: string;
      agentId: string;
      output: AgentOutput;
      durationMs: number;
    }
  | {
      ok: false;
      taskId: string;
      agentId: string;
      error: { code: string; message: string };
      durationMs: number;
    };
