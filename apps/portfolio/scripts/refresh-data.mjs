// Rewrites the saved data from the live sources, with the same code as the build.
// All four or none: one source down, or one figure missing, and nothing is written.
import { writeFileSync } from "node:fs";
import { runnerImport } from "vite";

process.env.STRICT_DATA = "1";

try {
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
  console.info("✓ saved data refreshed: review it with git diff, then commit it");
} catch (error) {
  console.error(`✗ nothing written: ${error.message}`);
  process.exit(1);
}
