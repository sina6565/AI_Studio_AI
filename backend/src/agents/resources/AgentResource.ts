/**
 * SINA-native, provider-agnostic resources used to enrich specialist agents.
 * Resource text is untrusted guidance; it never grants permissions or executes.
 */
export type AgentResourceKind = 'skill' | 'rule' | 'expert' | 'connector';

export type AgentResourceScope =
  | { type: 'global' }
  | { type: 'tenant'; tenantId: string }
  | { type: 'project'; projectId: string; tenantId?: string };

interface AgentResourceBase {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  scope: AgentResourceScope;
  enabled: boolean;
  tags?: string[];
}

export interface SkillResource extends AgentResourceBase {
  kind: 'skill';
  instructions: string;
}

export interface RuleResource extends AgentResourceBase {
  kind: 'rule';
  instructions: string;
  priority?: number;
}

export interface ExpertResource extends AgentResourceBase {
  kind: 'expert';
  guidance: string;
}

export interface ConnectorResource extends AgentResourceBase {
  kind: 'connector';
  connectionId: string;
  toolNames: string[];
}

export type AgentResource = SkillResource | RuleResource | ExpertResource | ConnectorResource;

export interface AgentResourceQuery {
  capability: string;
  tenantId?: string;
  projectId?: string;
  allowedConnectorIds?: string[];
}

export interface ResolvedAgentResources {
  instructions: string;
  resourceIds: string[];
  connectorRefs: Array<{ resourceId: string; connectionId: string; toolNames: string[] }>;
}

export interface AgentResourceRepository {
  list(): Promise<AgentResource[]>;
  get(id: string): Promise<AgentResource | undefined>;
  save(resource: AgentResource): Promise<void>;
  delete(id: string): Promise<boolean>;
}
