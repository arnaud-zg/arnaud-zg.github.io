// Rewrites the saved data, all a build reads, from the live sources. Each release runs it.
// All four or none: one source down, or one figure missing, and nothing is written.
// With --check, only asks whether GitHub would answer, which does not count against its limit.
import { writeFileSync } from "node:fs";
import { runnerImport } from "vite";

const checkGitHub = async () => {
  const response = await fetch("https://api.github.com/rate_limit", {
    headers: { "User-Agent": "portfolio-build" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.url}`);
  const { core, search } = (await response.json()).resources;
  const spent = [core, search].filter(({ remaining }) => remaining === 0);
  if (spent.length === 0) return;
  const { limit, reset } = spent.reduce((a, b) => (a.reset > b.reset ? a : b));
  const time = new Date(reset * 1000).toLocaleTimeString();
  throw new Error(
    `the rate limit of api.github.com is reached (${limit} requests), try again after ${time}`,
  );
};

try {
  await checkGitHub();
  if (process.argv.includes("--check")) {
    console.info("✓ GitHub can be read");
    process.exit(0);
  }
  const { module } = await runnerImport("./src/profile.ts", {
    configFile: false,
    logLevel: "error",
  });
  const sources = Object.entries(module.profile.live);
  const fresh = await Promise.all(sources.map(async ([name, read]) => [name, await read()]));
  for (const [name, value] of fresh) {
    writeFileSync(
      new URL(`../src/data/snapshots/${name}.json`, import.meta.url),
      `${JSON.stringify(value, null, 2)}\n`,
    );
  }
  console.info("✓ saved data refreshed: review it with git diff");
} catch (error) {
  console.error(`✗ couldn't be released right now because ${error.message}`);
  console.error("  Nothing was written.");
  process.exit(1);
}
