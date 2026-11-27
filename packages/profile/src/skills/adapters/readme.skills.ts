import type { Web } from "../../shared/ports/Web.ts";
import type { Explanation, Skill } from "../domain/Skill.ts";
import type { SkillList } from "../ports/SkillList.ts";

// | Write an Agent Skill and lint it | [`hexagonal-skill-builder`](./plugins/...) |
const ROW = /^\|\s*(.+?)\s*\|\s*\[`([^`]+)`\]\(([^)]+)\)/;
// A skill's docs live next to its README: its explanation is explanation.md there.
const README = /\/README\.md$/;

// The page's own title, without its "💡 Explanation:" lead; the links-only line under it (the
// docs' breadcrumb) is the site's to draw, so it goes.
export const explanationOf = (markdown: string): Explanation | undefined => {
  const [head, ...rest] = markdown.trim().split(/\n\s*\n/);
  if (!head.startsWith("# ")) return undefined;
  const linksOnly = (part: string) =>
    /^[\s›·|]*$/.test(part.replace(/\[[^\]]*\]\([^)]*\)/g, "").replace(/\*\*[^*]*\*\*/g, ""));
  const body = (rest[0] && linksOnly(rest[0]) ? rest.slice(1) : rest).join("\n\n").trim();
  const title = head
    .slice(2)
    .replace(/^[^\p{L}]*Explanation:\s*/u, "")
    .trim();
  if (!body || !title) return undefined;
  return { title: title[0].toUpperCase() + title.slice(1), body };
};

export const readmeSkills = ({ web, repo }: { web: Web; repo: string }): SkillList => {
  const own = `https://github.com/${repo}/blob/HEAD/`;
  const addressOf = (path: string) => {
    if (path.startsWith("http")) return path;
    return `${own}${path.replace(/^\.\//, "")}`;
  };
  const skillIn = (line: string): Skill[] => {
    const row = ROW.exec(line);
    return row ? [{ name: row[2], use: row[1], href: addressOf(row[3]) }] : [];
  };
  // A skill without an explanation page is shown without one.
  const explained = async (skill: Skill): Promise<Skill> => {
    if (!skill.href.startsWith(own) || !README.test(skill.href)) return skill;
    const path = skill.href.slice(own.length).replace(README, "/explanation.md");
    const page = await web
      .text(`https://raw.githubusercontent.com/${repo}/HEAD/${path}`)
      .catch(() => undefined);
    const explanation = page === undefined ? undefined : explanationOf(page);
    return explanation ? { ...skill, explanation } : skill;
  };
  return {
    async skills() {
      const readme = await web.text(`https://raw.githubusercontent.com/${repo}/HEAD/README.md`);
      const skills = readme.split("\n").flatMap(skillIn);
      if (!skills.length) throw new Error("no skills table");
      return Promise.all(skills.map(explained));
    },
  };
};
