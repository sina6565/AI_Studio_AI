import { AgentSkill, SkillRegistry } from '../contracts';

/**
 * Process-local registry. Skills are metadata only at this stage:
 * this class does not execute code or publish skills to other users.
 */
export class InMemorySkillRegistry implements SkillRegistry {
  private readonly skills = new Map<string, AgentSkill>();

  async register(skill: AgentSkill): Promise<void> {
    const id = skill.id.trim().toLowerCase();
    if (!id || !skill.ownerId.trim() || !skill.name.trim()) {
      throw new Error('Skill id, ownerId and name are required');
    }
    const key = this.skillKey(skill.ownerId, id);
    if (this.skills.has(key)) throw new Error('Skill already exists for this owner: ' + id);
    this.skills.set(key, { ...skill, id, enabled: Boolean(skill.enabled) });
  }

  async get(skillId: string): Promise<AgentSkill | undefined> {
    const normalizedId = skillId.trim().toLowerCase();
    const matches = Array.from(this.skills.values()).filter((skill) => skill.id === normalizedId);
    return matches.length === 1 ? { ...matches[0] } : undefined;
  }

  async list(ownerId: string): Promise<AgentSkill[]> {
    return Array.from(this.skills.values())
      .filter((skill) => skill.ownerId === ownerId)
      .map((skill) => ({ ...skill }));
  }

  async setEnabled(ownerId: string, skillId: string, enabled: boolean): Promise<boolean> {
    const key = this.skillKey(ownerId, skillId);
    const skill = this.skills.get(key);
    if (!skill) return false;
    this.skills.set(key, { ...skill, enabled });
    return true;
  }

  private skillKey(ownerId: string, skillId: string): string {
    return ownerId + ':' + skillId.trim().toLowerCase();
  }
}

export default InMemorySkillRegistry;
