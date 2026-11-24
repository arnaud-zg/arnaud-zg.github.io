// Keeps packages/design isolated, and the sites on it. Run by `pnpm check` and by every build.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const walk = (dir) =>
  readdirSync(dir)
    .filter((f) => f !== "node_modules" && !f.startsWith("."))
    .flatMap((f) => {
      const p = join(dir, f);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });
const pkg = resolve("packages/design"),
  src = join(pkg, "src");
const problems = [];

// 1. The package never reaches outside itself, and declares what it imports.
const { dependencies, peerDependencies } = JSON.parse(
  readFileSync(join(pkg, "package.json"), "utf8"),
);
const declared = Object.keys({ ...dependencies, ...peerDependencies });
for (const file of walk(src).filter((f) => /\.(astro|ts|css)$/.test(f))) {
  for (const [, , from] of readFileSync(file, "utf8").matchAll(
    /(^|\s)(?:import|from)\s+["']([^"']+)["']/g,
  )) {
    const at = `${relative(".", file)} imports ${from}`;
    if (from === "virtual:design/site") continue; // made by the Starlight plugin
    if (from.startsWith(".")) {
      if (!resolve(dirname(file), from).startsWith(src))
        problems.push(`${at}: outside the package`);
    } else if (!declared.some((d) => from === d || from.startsWith(`${d}/`)))
      problems.push(`${at}: not a declared dependency`);
  }
}

// The package knows nothing about who uses it: no owner name, no site id.
const { default: config } = await import("../apps/portfolio/portfolio.config.ts");
const own = [
  config.name,
  config.site.brand,
  ...config.sites.map((s) => s.id).filter((id) => id !== "home"),
];
for (const file of walk(src).filter((f) => /\.(astro|ts|css)$/.test(f))) {
  const text = readFileSync(file, "utf8").replaceAll("@arnaud-zg/design", "");
  for (const word of own)
    if (text.includes(word))
      problems.push(`${relative(".", file)} names "${word}": take it from the site`);
}

// 2. Sites reach the package by name, and use its classes without restyling them.
const classes = (css) =>
  new Set(
    [
      ...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(?:^|[},])\s*\.([a-z][\w-]*)\s*(?=[{,])/gm),
    ].map((m) => m[1]),
  );
const shared = new Set(
  walk(join(src, "styles")).flatMap((f) => [...classes(readFileSync(f, "utf8"))]),
);
for (const root of ["apps/portfolio/src", "templates/sub-site/src"])
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    if (/packages\/design\/src/.test(text))
      problems.push(`${file}: use @arnaud-zg/design, not its path`);
    if (file.endsWith(".css"))
      for (const c of classes(text))
        if (shared.has(c)) problems.push(`${file}: restyles .${c}, which the package owns`);
  }

// 3. Every component is on show in the workshop, directly or inside another one.
const shown = walk("apps/portfolio/src/pages/design")
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");
// Starlight overrides are shown by the Starlight pages instead.
for (const file of walk(src).filter((f) => f.endsWith(".astro") && !f.includes("/starlight/"))) {
  const name = file.split("/").pop().replace(".astro", "");
  const nested = walk(src).some(
    (f) =>
      f !== file &&
      f.endsWith(".astro") &&
      new RegExp(`<${name}[\\s/>]`).test(readFileSync(f, "utf8")),
  );
  if (!nested && !new RegExp(`<${name}[\\s/>]`).test(shown))
    problems.push(`${name} is not shown in /design/`);
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.info("✓ design package isolated, reused and on show");
