// Rewrites the saved data from the live sources, with the same code as the build.
// All four or none: one source down, or one figure missing, and nothing is written.
import { writeFileSync } from "node:fs";
import { runnerImport } from "vite";

process.env.STRICT_DATA = "1";
const load = async (name) => (await runnerImport(`./src/data/${name}.ts`, { configFile: false, logLevel: "error" })).module;

try {
  const [oss, npm, skills, substack] = await Promise.all(["oss", "npm", "skills", "substack"].map(load));
  const data = Object.entries({
    github: oss.fetchGithub({ fresh: true }),
    npm: npm.fetchQuests(),
    skills: skills.fetchSkills(),
    substack: substack.fetchArticles(),
  });
  const fresh = await Promise.all(data.map(async ([name, live]) => [name, await live]));
  for (const [name, value] of fresh) {
    writeFileSync(new URL(`../src/data/snapshots/${name}.json`, import.meta.url), `${JSON.stringify(value, null, 2)}\n`);
  }
  console.log("✓ saved data refreshed: review it with git diff, then commit it");
} catch (error) {
  console.error(`✗ nothing written: ${error.message}`);
  process.exit(1);
}
