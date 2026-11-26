// The CSS each built page ships may not grow: run after a build, by `pnpm build`.
//
//   node scripts/css-budget.mjs            compare every page with css-budget.json
//   node scripts/css-budget.mjs --update   record the current sizes as the new budget
//   node scripts/css-budget.mjs --coverage also print the share of CSS each page uses (Playwright)
//
// A page's CSS is its inlined <style> blocks plus the local stylesheets it links. Pages are
// compared by gzipped size, the bytes a visitor downloads; a page may grow by at most 1%.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const SITES = { portfolio: "apps/portfolio/dist", "sub-site": "templates/sub-site/dist" };
const BUDGET = "css-budget.json";
const SLACK = 1.01;
const args = new Set(process.argv.slice(2));

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? (f === "pagefind" ? [] : walk(p)) : [p];
  });

const cssOf = (dist, file) => {
  const html = readFileSync(file, "utf8");
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
  const linked = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*>/g)]
    .map((m) => m[0].match(/href="([^"]+)"/)?.[1])
    .filter((href) => href && !/^(https?:)?\/\//.test(href))
    .map((href) => {
      // Hrefs may carry the preview base path: find the file by its name under _astro.
      const name = href.split("/").pop();
      const path = walk(dist).find((p) => p.endsWith(`/${name}`));
      return path ? readFileSync(path, "utf8") : "";
    });
  const css = [...inline, ...linked].join("\n");
  return { raw: Buffer.byteLength(css), gzip: gzipSync(css, { level: 9 }).length };
};

const measure = () => {
  const pages = {};
  for (const [site, dist] of Object.entries(SITES)) {
    if (!existsSync(dist)) continue;
    for (const file of walk(dist).filter((f) => f.endsWith(".html")))
      pages[`${site}:/${relative(dist, file).replace(/index\.html$/, "")}`] = cssOf(dist, file);
  }
  return pages;
};

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
const pages = measure();
if (!Object.keys(pages).length) {
  console.error("✗ css budget: nothing built yet, run the build first");
  process.exit(1);
}

if (args.has("--update")) {
  writeFileSync(BUDGET, `${JSON.stringify(pages, null, 2)}\n`);
  console.info(`✓ css budget recorded for ${Object.keys(pages).length} pages`);
  process.exit(0);
}

const budget = existsSync(BUDGET) ? JSON.parse(readFileSync(BUDGET, "utf8")) : {};
const problems = [];
const rows = Object.entries(pages).map(([page, now]) => {
  const was = budget[page];
  if (!was) return `  ${page.padEnd(48)} ${kb(now.gzip).padStart(9)}  new page`;
  const change = ((now.gzip - was.gzip) / was.gzip) * 100;
  if (now.gzip > was.gzip * SLACK)
    problems.push(`${page} ships ${kb(now.gzip)} of CSS, over its ${kb(was.gzip)} budget`);
  const sign = change > 0 ? "+" : "";
  return `  ${page.padEnd(48)} ${kb(now.gzip).padStart(9)}  ${`${sign}${change.toFixed(1)}%`.padStart(7)} (was ${kb(was.gzip)})`;
});
console.info(`CSS per page, gzipped:\n${rows.join("\n")}`);

if (args.has("--coverage")) {
  const { chromium } = await import("playwright-core").catch(() => {
    console.error("✗ --coverage needs playwright-core and its Chromium installed");
    process.exit(1);
  });
  const browser = await chromium.launch();
  for (const [site, dist] of Object.entries(SITES)) {
    if (!existsSync(join(dist, "index.html"))) continue;
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.coverage.startCSSCoverage();
    await page.goto(`file://${join(process.cwd(), dist, "index.html")}`);
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 30));
      }
    });
    const entries = await page.coverage.stopCSSCoverage();
    const total = entries.reduce((n, e) => n + e.text.length, 0);
    const used = entries.reduce((n, e) => n + e.ranges.reduce((s, r) => s + r.end - r.start, 0), 0);
    console.info(`  ${site}:/ uses ${Math.round((100 * used) / total)}% of its CSS`);
    await page.close();
  }
  await browser.close();
}

if (problems.length) {
  console.error(problems.map((p) => `✗ ${p}`).join("\n"));
  process.exit(1);
}
console.info("✓ css within budget");
