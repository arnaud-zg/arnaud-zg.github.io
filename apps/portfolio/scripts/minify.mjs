// Run after the build. Astro minifies files but leaves inline scripts as written, a theme starter or
// Starlight's own: they are minified here, then everything published is checked.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { minifySync } from "vite";

const dist = "dist";
const files = readdirSync(dist, { recursive: true }).map(String);
// Minified code has long lines: one line per 500 characters, plus a licence or two.
const loose = (code) => code.trim().split("\n").length > 4 + code.length / 500;
const problems = [];
for (const file of files.filter((f) => f.endsWith(".html"))) {
  const path = join(dist, file);
  const html = readFileSync(path, "utf8").replace(
    /(<script\b([^>]*)>)([\s\S]*?)(<\/script>)/g,
    (all, open, attrs, code, close) => {
      // Data, such as settings, is not code.
      if (!code.trim() || /\btype="(?!module")/.test(attrs)) return all;
      const { code: small, errors } = minifySync("inline.js", code, {
        module: /type="module"/.test(attrs),
      });
      if (errors.length) problems.push(`${file}: ${errors[0].message}`);
      return open + small.trim().replaceAll("</script", "<\\/script") + close;
    },
  );
  writeFileSync(path, html);
  for (const [, , code] of html.matchAll(/<(script|style)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (loose(code)) problems.push(`${file}: inline ${code.trim().slice(0, 60)}`);
  }
}
for (const file of files.filter((f) => /^_astro.*\.(js|css)$/.test(f))) {
  if (loose(readFileSync(join(dist, file), "utf8"))) problems.push(file);
  if (files.includes(`${file}.map`)) problems.push(`${file}.map: a source map`);
}
if (problems.length) {
  console.error([...new Set(problems)].map((p) => `✗ not minified: ${p}`).join("\n"));
  process.exit(1);
}
console.info("✓ everything published is minified");
