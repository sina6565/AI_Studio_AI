import { AgentResource, AgentResourceRepository } from './AgentResource';

/** Process-local adapter for tests and single-process development only. */
export class InMemoryAgentResourceRepository implements AgentResourceRepository {
  private readonly resources = new Map<string, AgentResource>();

  async list(): Promise<AgentResource[]> {
    return Array.from(this.resources.values(), (item) => this.copy(item));
  }

  async get(id: string): Promise<AgentResource | undefined> {
    const item = this.resources.get(id);
    return item ? this.copy(item) : undefined;
  }

  async save(resource: AgentResource): Promise<void> {
    this.resources.set(resource.id, this.copy(resource));
  }

  async delete(id: string): Promise<boolean> {
    return this.resources.delete(id);
  }

  private copy(resource: AgentResource): AgentResource {
    return {
      ...resource,
      scope: { ...resource.scope },
      capabilities: [...resource.capabilities],
      ...(resource.tags ? { tags: [...resource.tags] } : {}),
      ...(resource.kind === 'connector' ? { toolNames: [...resource.toolNames] } : {}),
    } as AgentResource;
  }
}
