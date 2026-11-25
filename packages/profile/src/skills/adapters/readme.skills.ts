import type { Web } from "../../shared/ports/Web.ts";
import type { Skill } from "../domain/Skill.ts";
import type { SkillList } from "../ports/SkillList.ts";

// | Write an Agent Skill and lint it | [`hexagonal-skill-builder`](./plugins/...) |
const ROW = /^\|\s*(.+?)\s*\|\s*\[`([^`]+)`\]\(([^)]+)\)/;

export const readmeSkills = ({ web, repo }: { web: Web; repo: string }): SkillList => {
  const addressOf = (path: string) => {
    if (path.startsWith("http")) return path;
    return `https://github.com/${repo}/blob/HEAD/${path.replace(/^\.\//, "")}`;
  };
  const skillIn = (line: string): Skill[] => {
    const row = ROW.exec(line);
    return row ? [{ name: row[2], use: row[1], href: addressOf(row[3]) }] : [];
  };
  return {
    async skills() {
      const readme = await web.text(`https://raw.githubusercontent.com/${repo}/HEAD/README.md`);
      const skills = readme.split("\n").flatMap(skillIn);
      if (!skills.length) throw new Error("no skills table");
      return skills;
    },
  };
};
