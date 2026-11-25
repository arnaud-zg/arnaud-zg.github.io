import type { Skill } from "../domain/Skill.ts";
import type { SkillList } from "../ports/SkillList.ts";

export const memorySkills = (skills: readonly Skill[]): SkillList => ({
  skills: () => Promise.resolve([...skills]),
});
