import {
  AgentResource,
  AgentResourceQuery,
  AgentResourceRepository,
  ResolvedAgentResources,
} from './AgentResource';

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const MAX_TEXT_LENGTH = 32_000;
const MAX_ITEMS = 100;

export interface AgentResourceSummary {
  id: string;
  kind: AgentResource['kind'];
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  scope: AgentResource['scope'];
  enabled: boolean;
  tags?: string[];
}

function normalizeId(value: string, label: string): string {
  const id = value.trim().toLowerCase();
  if (!ID_PATTERN.test(id)) {
    throw new Error(label + ' must be 1-64 lowercase letters, numbers, dots, underscores, or hyphens');
  }
  return id;
}

function resourceText(resource: AgentResource): string {
  switch (resource.kind) {
    case 'skill':
    case 'rule':
      return resource.instructions;
    case 'expert':
      return resource.guidance;
    case 'connector':
      return '';
  }
}

function matchesScope(resource: AgentResource, query: AgentResourceQuery): boolean {
  if (resource.scope.type === 'global') return true;
  if (resource.scope.type === 'tenant') {
    return Boolean(query.tenantId && resource.scope.tenantId === query.tenantId);
  }
  return Boolean(
    query.projectId &&
    resource.scope.projectId === query.projectId &&
    (!resource.scope.tenantId || resource.scope.tenantId === query.tenantId),
  );
}

/**
 * Resolves capability-matched guidance and explicitly permitted connector refs.
 * Connector credentials are owned by the connection service, never this engine.
 */
export class AgentResourceEngine {
  constructor(private readonly repository: AgentResourceRepository) {}

  private normalize(resource: AgentResource): AgentResource {
    const id = normalizeId(resource.id, 'Resource id');
    if (!resource.name.trim() || !resource.version.trim() || !resource.description.trim()) {
      throw new Error('Resource name, version and description are required: ' + id);
    }
    if (!Array.isArray(resource.capabilities) || resource.capabilities.length === 0) {
      throw new Error('Resource must declare at least one capability: ' + id);
    }
    if (resource.capabilities.length > MAX_ITEMS) throw new Error('Too many resource capabilities');
    const capabilities = Array.from(new Set(
      resource.capabilities.map((value) => normalizeId(value, 'Capability')),
    ));
    if (resource.scope.type === 'tenant' && !resource.scope.tenantId.trim()) {
      throw new Error('Tenant scope requires tenantId: ' + id);
    }
    if (resource.scope.type === 'project' && !resource.scope.projectId.trim()) {
      throw new Error('Project scope requires projectId: ' + id);
    }
    if (resource.kind === 'connector') {
      if (!resource.connectionId.trim() || resource.toolNames.length === 0) {
        throw new Error('Connector resource requires a connection reference and at least one tool: ' + id);
      }
      if (resource.toolNames.length > MAX_ITEMS) throw new Error('Too many connector tools');
    } else {
      const content = resourceText(resource);
      if (!content.trim()) throw new Error('Resource guidance is required: ' + id);
      if (content.length > MAX_TEXT_LENGTH) {
        throw new Error('Resource guidance exceeds ' + MAX_TEXT_LENGTH + ' characters');
      }
    }
    return {
      ...resource,
      id,
      name: resource.name.trim(),
      version: resource.version.trim(),
      description: resource.description.trim(),
      capabilities,
      scope: { ...resource.scope },
      enabled: Boolean(resource.enabled),
    } as AgentResource;
  }

  async register(resource: AgentResource): Promise<void> {
    const normalized = this.normalize(resource);
    if (await this.repository.get(normalized.id)) {
      throw new Error('Resource already registered: ' + normalized.id);
    }
    await this.repository.save(normalized);
  }

  async update(resource: AgentResource): Promise<boolean> {
    const normalized = this.normalize(resource);
    if (!(await this.repository.get(normalized.id))) return false;
    await this.repository.save(normalized);
    return true;
  }

  async get(id: string): Promise<AgentResource | undefined> {
    return this.repository.get(normalizeId(id, 'Resource id'));
  }

  async list(options: { enabledOnly?: boolean; kind?: AgentResource['kind'] } = {}): Promise<AgentResourceSummary[]> {
    const resources = await this.repository.list();
    return resources
      .filter((resource) => !options.enabledOnly || resource.enabled)
      .filter((resource) => !options.kind || resource.kind === options.kind)
      .map((resource) => ({
        id: resource.id,
        kind: resource.kind,
        name: resource.name,
        version: resource.version,
        description: resource.description,
        capabilities: [...resource.capabilities],
        scope: { ...resource.scope },
        enabled: resource.enabled,
        ...(resource.tags ? { tags: [...resource.tags] } : {}),
      }));
  }

  async resolve(query: AgentResourceQuery): Promise<ResolvedAgentResources> {
    const capability = normalizeId(query.capability, 'Capability');
    const resources = (await this.repository.list())
      .filter((resource) => resource.enabled)
      .filter((resource) => resource.capabilities.includes(capability))
      .filter((resource) => matchesScope(resource, query))
      .sort((a, b) => {
        const priorityA = a.kind === 'rule' ? (a.priority ?? 0) : 0;
        const priorityB = b.kind === 'rule' ? (b.priority ?? 0) : 0;
        return priorityB - priorityA || a.id.localeCompare(b.id);
      });

    const allowedConnectors = new Set((query.allowedConnectorIds ?? []).map((id) => id.trim().toLowerCase()));
    const selected = resources.filter((resource) =>
      resource.kind !== 'connector' || allowedConnectors.has(resource.id),
    );
    const sections = selected
      .filter((resource) => resource.kind !== 'connector')
      .map((resource) => {
        const body = resourceText(resource).trim();
        return '[SINA ' + resource.kind.toUpperCase() + ': ' + resource.name + ' v' + resource.version + ']\n' + body;
      });

    return {
      instructions: sections.join('\n\n'),
      resourceIds: selected.map((resource) => resource.id),
      connectorRefs: selected
        .filter((resource) => resource.kind === 'connector')
        .map((resource) => ({
          resourceId: resource.id,
          connectionId: resource.connectionId,
          toolNames: [...resource.toolNames],
        })),
    };
  }

  async setEnabled(id: string, enabled: boolean): Promise<boolean> {
    const resource = await this.repository.get(normalizeId(id, 'Resource id'));
    if (!resource) return false;
    await this.repository.save({ ...resource, enabled } as AgentResource);
    return true;
  }

  async remove(id: string): Promise<boolean> {
    return this.repository.delete(normalizeId(id, 'Resource id'));
  }
}
