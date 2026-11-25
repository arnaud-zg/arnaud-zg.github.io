// Rewrites the saved data, all a build reads, from the live sources. Each release runs it.
// All four or none: one source down, or one figure missing, and nothing is written.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { runnerImport } from "vite";

// GitHub is read through gh: asked first, so a missing sign-in is named before anything is read.
const checkGh = () => {
  const { error, status, stderr } = spawnSync(
    "gh",
    ["auth", "status", "--active", "--hostname", "github.com"],
    { encoding: "utf8", timeout: 15_000 },
  );
  if (error?.code === "ENOENT") {
    throw new Error("gh is not installed. Install it from https://cli.github.com");
  }
  if (error) throw new Error(`gh could not check its sign-in: ${error.message}`);
  if (status !== 0) {
    throw new Error(
      `gh is not signed in to GitHub, or could not check it. Run: gh auth login\n${stderr.trim()}`,
    );
  }
};

try {
  checkGh();
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
