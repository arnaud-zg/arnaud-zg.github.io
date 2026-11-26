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
  walk(src)
    .filter((f) => /\.(css|astro)$/.test(f))
    .flatMap((f) => {
      const text = readFileSync(f, "utf8");
      const css = f.endsWith(".css")
        ? text
        : [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
      return [...classes(css)];
    }),
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

// A component with variants shows them all: a story in /design/ takes its spec.
for (const file of walk(join(src, "components")).filter((f) => f.endsWith(".variants.ts"))) {
  const spec = readFileSync(file, "utf8").match(/export const (\w+)\s*=/)?.[1];
  if (spec && !new RegExp(`\\b${spec}\\b`).test(shown))
    problems.push(`${relative(".", file)}: no story in /design/ uses ${spec}`);
}

// 4. Styles are isolated by rule, not by hashes: each part styles what it renders, nothing else.
//    A component's <style is:global> and the parts it imports style only classes it renders; no
//    two components style the same class; the global sheets reach a component's class only under
//    a document-wide state (theme, transition, Starlight's page).
const DOCUMENT = /^(html|:root|\.theming|\.arrived[\w-]*|\.page|\[data-theme[^\]]*\])$/;
const bare = (s) => s.replace(/\([^()]*\)/g, "()").replace(/\([^()]*\)/g, "()");
const rulesOf = (css) =>
  [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{};]+)\{/g)]
    .map((m) => m[1].trim())
    .filter((s) => !s.startsWith("@") && !/^(from|to|[\d.]+%)(\s*,\s*(from|to|[\d.]+%))*$/.test(s))
    .flatMap((s) => bare(s).split(","))
    .map((s) =>
      s
        .trim()
        .split(/\s*[\s>+~]\s*/)
        .filter(Boolean),
    );
const classesIn = (compound) =>
  [...compound.matchAll(/\.([a-z][\w-]*)/g)].map((m) => m[1]).filter((c) => !c.startsWith("is-"));
const styleBlocks = (text) =>
  [...text.matchAll(/<style is:global>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const components = walk(join(src, "components")).filter((f) => f.endsWith(".astro"));
const owner = new Map(); // class → the component that styles it
for (const file of components) {
  const text = readFileSync(file, "utf8");
  const name = relative(".", file);
  const rendered = text.replace(/<style[\s\S]*?<\/style>/g, "");
  const partFiles = [...text.matchAll(/import "\.\/(parts\/[\w-]+\.css)";/g)].map((m) =>
    join(dirname(file), m[1]),
  );
  for (const [css, from] of [
    [styleBlocks(text), name],
    ...partFiles.map((p) => [readFileSync(p, "utf8"), relative(".", p)]),
  ])
    for (const sel of rulesOf(css))
      for (const c of classesIn(sel.at(-1))) {
        const shared = from !== name;
        const built = /-\d+$/.test(c) && rendered.includes(`${c.replace(/\d+$/, "")}\${`);
        if (!shared && !built && !new RegExp(`[^\\w-]${c}(?![\\w-])`).test(rendered))
          problems.push(`${name} styles .${c}, which it does not render`);
        // Only a plain selector claims a class; `.page-head .lede` styles it in its own context.
        if (sel.length > 1) continue;
        const key = shared ? from : name;
        if (owner.has(c) && owner.get(c) !== key && !(shared && owner.get(c) === from))
          problems.push(
            `.${c} is styled by both ${owner.get(c)} and ${key}: one part owns a class`,
          );
        else owner.set(c, key);
      }
}
for (const file of walk(join(src, "styles")).filter((f) => f.endsWith(".css")))
  for (const sel of rulesOf(readFileSync(file, "utf8")))
    for (const c of classesIn(sel.at(-1)))
      if (
        owner.has(c) &&
        !sel.slice(0, -1).some((a) => DOCUMENT.test(a.replace(/::?[\w-]+(\(\))?/g, "")))
      )
        problems.push(`${relative(".", file)} styles .${c}, which ${owner.get(c)} owns`);
// Sites bring no styles of their own, outside the workshop's stylesheet.
for (const root of ["apps/portfolio/src", "templates/sub-site/src"])
  for (const file of walk(root).filter((f) => f.endsWith(".astro")))
    if (/<style(?! is:inline)/.test(readFileSync(file, "utf8")))
      problems.push(`${file} has a <style>: style it in the package`);

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.info("✓ design package isolated, reused and on show");
