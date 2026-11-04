import { AgentDefinition, SINAAgent } from './contracts/AgentContract';

/** In-memory registry for agent definitions; persistence can be added behind this API. */
export class AgentRegistry {
  private readonly agents = new Map<string, SINAAgent>();

  register(agent: SINAAgent): void {
    const id = agent.id.trim().toLowerCase();
    if (!id) throw new Error('Agent id is required');
    if (!agent.name.trim()) throw new Error('Agent name is required: ' + id);
    if (!agent.capabilities.length) {
      throw new Error('Agent must declare at least one capability: ' + id);
    }
    if (this.agents.has(id)) throw new Error('Agent already registered: ' + id);
    this.agents.set(id, agent);
  }

  get(agentId: string): SINAAgent | undefined {
    return this.agents.get(agentId.trim().toLowerCase());
  }

  list(options: { enabledOnly?: boolean } = {}): AgentDefinition[] {
    return Array.from(this.agents.values())
      .filter((agent) => !options.enabledOnly || agent.enabled)
      .map(({ id, name, version, description, capabilities, enabled }) => ({
        id, name, version, description, capabilities: [...capabilities], enabled,
      }));
  }

  findByCapability(capability: string): AgentDefinition[] {
    const normalized = capability.trim().toLowerCase();
    return this.list({ enabledOnly: true }).filter((agent) =>
      agent.capabilities.some((item) => item.toLowerCase() === normalized),
    );
  }

  unregister(agentId: string): boolean {
    return this.agents.delete(agentId.trim().toLowerCase());
  }
}

export default AgentRegistry;
