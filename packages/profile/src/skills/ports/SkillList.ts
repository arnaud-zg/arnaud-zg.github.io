import type { Skill } from "../domain/Skill.ts";

export interface SkillList {
  skills(): Promise<Skill[]>;
}
