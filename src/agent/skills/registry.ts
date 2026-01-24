import { TaskType, type SkillResult } from "../../types/agent"

export { TaskType }
export type { SkillResult }

export interface Skill {
  name: string
  description: string
  type: TaskType
  execute(payload: Record<string, any>): Promise<SkillResult>
}

export class SkillRegistry {
  private skills = new Map<TaskType, Skill>()

  register(skill: Skill): void {
    this.skills.set(skill.type, skill)
  }

  getSkill(type: TaskType): Skill | undefined {
    return this.skills.get(type)
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values())
  }

  getSkillTypes(): TaskType[] {
    return Array.from(this.skills.keys())
  }
}
