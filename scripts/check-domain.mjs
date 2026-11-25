// Dependencies point inward: domain, then ports, then application, then adapters. Run by `pnpm check`.
import { globSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const LAYERS = ["domain", "ports", "application", "adapters"];
const layerOf = (path) => LAYERS.findIndex((layer) => path.split("/").at(-2) === layer);
const contextOf = (path) => path.split("/src/")[1].split("/")[0];
const problems = [];

for (const file of globSync("packages/{analytics,profile}/src/**/*.ts")) {
  const layer = layerOf(file);
  if (layer < 0) continue; // the composition root may import anything
  const text = readFileSync(file, "utf8");
  for (const [, from] of text.matchAll(
    /(?:\bfrom\s+|\bimport\s+|\bimport\(\s*)["']([^"'\n]+)["']/g,
  )) {
    const say = (why) => problems.push(`${file} imports ${from}: ${why}`);
    if (!from.startsWith(".")) {
      if (LAYERS[layer] !== "adapters") say("only an adapter uses a library");
      continue;
    }
    const target = resolve(dirname(file), from);
    const inner = layerOf(target);
    if (inner < 0) say("reaches the composition root");
    // An adapter that drives the application may know it; no other layer looks outward.
    if (inner > layer) say(`${LAYERS[layer]} must not know ${LAYERS[inner]}`);
    const [own, other] = [contextOf(file), contextOf(target)];
    if (file.startsWith("packages/profile/") && other !== own && other !== "shared")
      say(`${own} must not know ${other}`);
  }
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.info("✓ domains isolated");
