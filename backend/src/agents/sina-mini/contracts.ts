/**
 * SINA Mini — small, provider-agnostic personal-agent foundation.
 *
 * Personal memories are private by default. Shared skills are a separate
 * artifact type and must pass an explicit publication/consent flow.
 */

export type MemoryVisibility = 'private' | 'shareable';
export type MemoryKind = 'preference' | 'fact' | 'procedure' | 'conversation';

export interface PersonalMemory {
  id: string;
  ownerId: string;
  kind: MemoryKind;
  key: string;
  content: string;
  visibility: MemoryVisibility;
  createdAt: string;
  updatedAt: string;
  source?: string;
  tags: string[];
}

export interface MemoryQuery {
  ownerId: string;
  text?: string;
  kind?: MemoryKind;
  tags?: string[];
  limit?: number;
}

export interface MemoryStore {
  put(memory: PersonalMemory): Promise<void>;
  get(ownerId: string, memoryId: string): Promise<PersonalMemory | undefined>;
  search(query: MemoryQuery): Promise<PersonalMemory[]>;
  delete(ownerId: string, memoryId: string): Promise<boolean>;
}

export type SkillTrust = 'local' | 'reviewed' | 'published';

export interface AgentSkill {
  id: string;
  version: string;
  name: string;
  description: string;
  ownerId: string;
  trust: SkillTrust;
  enabled: boolean;
  requiresApproval: boolean;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  createdAt: string;
}

export interface SkillRegistry {
  register(skill: AgentSkill): Promise<void>;
  get(skillId: string): Promise<AgentSkill | undefined>;
  list(ownerId: string): Promise<AgentSkill[]>;
  setEnabled(ownerId: string, skillId: string, enabled: boolean): Promise<boolean>;
}

export interface MiniAgentRequest {
  ownerId: string;
  message: string;
  conversationId?: string;
}

export interface MiniAgentResponse {
  message: string;
  memoryIdsUsed: string[];
  skillIdsSuggested: string[];
}

export interface MiniAgentModel {
  generate(input: {
    message: string;
    memories: PersonalMemory[];
    skills: AgentSkill[];
    signal?: AbortSignal;
  }): Promise<string>;
}
