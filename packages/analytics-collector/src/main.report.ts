// What visitors do, and what to check next. Run with `pnpm analytics:report [days]`.
// Needs CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_API_TOKEN with Account Analytics: Read.
import { analyticsEngineSource } from "./adapters/analytics-engine.source.ts";
import { report } from "./application/report.ts";
import { TARGETS, type Row } from "./domain/kpis.ts";

const { CLOUDFLARE_ACCOUNT_ID: account, CLOUDFLARE_API_TOKEN: token } = process.env;
const stop = (why: string): never => { console.error(`✗ ${why}`); process.exit(1); };
if (!account || !token) stop("Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.");
const days = Number(process.argv[2] ?? 30);
if (!Number.isInteger(days) || days < 1 || days > 90) stop("Days: 1 to 90, the data is kept three months.");

const { kpis, signals } = await report(analyticsEngineSource(account!, token!), days).catch((e: Error) => stop(e.message));
const pct = (n: number) => `${Math.round(n * 100)}%`;
console.log(`\n${kpis.visits} visits that said yes, in ${days} days\n`);
console.table({
  "Engaged: read 2+ sections": { now: pct(kpis.engaged), target: pct(TARGETS.engaged) },
  "Explored: opened or copied something": { now: pct(kpis.explored), target: pct(TARGETS.explored) },
  "Followed through: went to a link": { now: pct(kpis.followed), target: pct(TARGETS.followed) },
});
const table = (title: string, rows: Row[]) => {
  console.log(`\n${title}`);
  if (rows.length) console.table(rows.slice(0, 10).map((r) => ({ ...r, ...(r.rate === undefined ? {} : { rate: pct(r.rate) }) })));
  else console.log("  nothing yet");
};
table("Interest: sections read", kpis.sections);
table("Explored", kpis.explorations);
table("Links followed", kpis.links);
table("Sources, and how many followed through", kpis.sources);
table("Devices, and how many followed through", kpis.devices);
console.log(`\nCheck next\n${signals.map((s) => `  → ${s}`).join("\n")}`);
