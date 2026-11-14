/**
 * A skill is declarative guidance, not executable code.
 * Skills must never be evaluated as JavaScript or shell commands.
 */
export interface AgentSkill {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  instructions: string;
  enabled: boolean;
}

export type AgentSkillSummary = Omit<AgentSkill, 'instructions'>;

const ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/;
const MAX_INSTRUCTIONS_LENGTH = 32_000;

function normalizeId(value: string, label: string): string {
  const normalized = value.trim().toLowerCase();
  if (!ID_PATTERN.test(normalized)) {
    throw new Error(`${label} must be 1-64 lowercase letters, numbers, dots, underscores, or hyphens`);
  }
  return normalized;
}

/**
 * In-memory, metadata-only skill registry.
 *
 * This deliberately does not load packages, access the filesystem, fetch URLs,
 * or execute skill content. A persistent loader can be added behind this API
 * after package-signature, provenance, and approval controls are implemented.
 */
export class SkillRegistry {
  private readonly skills = new Map<string, AgentSkill>();

  register(skill: AgentSkill): void {
    const id = normalizeId(skill.id, 'Skill id');
    if (!skill.name.trim()) throw new Error(`Skill name is required: ${id}`);
    if (!skill.version.trim()) throw new Error(`Skill version is required: ${id}`);
    if (!skill.description.trim()) throw new Error(`Skill description is required: ${id}`);
    if (!Array.isArray(skill.capabilities) || skill.capabilities.length === 0) {
      throw new Error(`Skill must declare at least one capability: ${id}`);
    }
    if (typeof skill.instructions !== 'string' || !skill.instructions.trim()) {
      throw new Error(`Skill instructions are required: ${id}`);
    }
    if (skill.instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      throw new Error(`Skill instructions exceed ${MAX_INSTRUCTIONS_LENGTH} characters`);
    }

    const capabilities = Array.from(new Set(
      skill.capabilities.map((capability) => normalizeId(capability, 'Capability')),
    ));
    if (this.skills.has(id)) throw new Error(`Skill already registered: ${id}`);

    this.skills.set(id, {
      ...skill,
      id,
      name: skill.name.trim(),
      version: skill.version.trim(),
      description: skill.description.trim(),
      capabilities,
      instructions: skill.instructions,
      enabled: Boolean(skill.enabled),
    });
  }

  get(skillId: string): AgentSkill | undefined {
    const skill = this.skills.get(skillId.trim().toLowerCase());
    return skill ? { ...skill, capabilities: [...skill.capabilities] } : undefined;
  }

  list(options: { enabledOnly?: boolean } = {}): AgentSkillSummary[] {
    return Array.from(this.skills.values())
      .filter((skill) => !options.enabledOnly || skill.enabled)
      .map(({ instructions: _instructions, ...summary }) => ({
        ...summary,
        capabilities: [...summary.capabilities],
      }));
  }

  findByCapability(capability: string): AgentSkillSummary[] {
    const normalized = normalizeId(capability, 'Capability');
    return this.list({ enabledOnly: true }).filter((skill) =>
      skill.capabilities.includes(normalized),
    );
  }

  setEnabled(skillId: string, enabled: boolean): boolean {
    const id = skillId.trim().toLowerCase();
    const skill = this.skills.get(id);
    if (!skill) return false;
    skill.enabled = enabled;
    return true;
  }

  unregister(skillId: string): boolean {
    return this.skills.delete(skillId.trim().toLowerCase());
  }
}

export default SkillRegistry;
