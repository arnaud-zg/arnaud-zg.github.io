// Deploys the site by hand: builds it with live data, then publishes it to the gh-pages branch.
// Run with `pnpm site:deploy`. Nothing runs it automatically.
import { execFileSync } from "node:child_process";
import { mkdtempSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const read = (cmd, args) => execFileSync(cmd, args, { encoding: "utf8" }).trim();
const run = (cmd, args, options = {}) => execFileSync(cmd, args, { stdio: "inherit", ...options });
const stop = (message) => { console.error(`✗ ${message}`); process.exit(1); };

if (read("git", ["status", "--porcelain"])) stop("Commit your changes first, so the site matches a commit.");
const commit = read("git", ["rev-parse", "--short", "HEAD"]);
const remote = process.env.DEPLOY_REMOTE ?? read("git", ["remote", "get-url", "origin"]);

// GitHub needs a token to answer reliably: the environment's, or the one `gh` holds.
let token = process.env.GITHUB_TOKEN;
try { token ??= read("gh", ["auth", "token"]); } catch { stop("No GitHub token. Run `gh auth login`, or set GITHUB_TOKEN."); }
// STRICT_DATA: a source that is down stops here, and the site online stays as it is.
run("pnpm", ["build"], { env: { ...process.env, GITHUB_TOKEN: token, STRICT_DATA: "1" } });

const dir = mkdtempSync(join(tmpdir(), "site-"));
try {
  cpSync("apps/portfolio/dist", dir, { recursive: true });
  // Without this file GitHub Pages hides folders that start with an underscore.
  writeFileSync(join(dir, ".nojekyll"), "");
  const git = (...args) => run("git", args, { cwd: dir });
  git("init", "-q", "-b", "gh-pages");
  git("add", "-A");
  git("-c", `user.name=${read("git", ["config", "user.name"])}`, "-c", `user.email=${read("git", ["config", "user.email"])}`, "commit", "-q", "-m", `deploy: ${commit}`);
  // gh-pages holds only the built site, one commit at a time.
  git("push", "-f", remote, "gh-pages");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
console.log(`✓ ${commit} published to gh-pages`);
