// What this sub-site says. Everything else comes from @arnaud-zg/design.
export const base = "/js-packages/";
export const repo = "https://github.com/arnaud-zg/js-packages";
export const site = {
  id: "js-packages",
  title: "js-packages",
  description: "Small, focused TypeScript tools for monorepos: release automation, Expo, Vite and AI agents.",
  nav: [
    { href: `${base}#packages`, label: "Packages" },
    { href: `${base}#contact`, label: "Contact" },
  ],
};
// Which pages open on the photo. The rest start on a plain page head.
export const hero = { home: true, page: false };
export const ending = { site: site.id, title: "Let's catch up", line: "A question, an idea, or a bug: I'd love to hear from you." };
export const links = [
  { label: "GitHub", href: repo, icon: "github" as const },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/arnaudzheng", icon: "linkedin" as const },
  { label: "Substack", href: "https://arnaudzg.substack.com", icon: "substack" as const },
];
// From js-packages/docs/README.md.
export const packages = [
  { name: "shiplane", line: "Versions, tags and ships each app through plugins (npm, Fly.io, EAS, Cloudflare Pages)", problem: "Releasing several apps from one repo is a pile of scripts." },
  { name: "expo-native-guard", line: "Swaps in a visible fallback component instead of crashing", problem: "Expo Go crashes on a native-only import: a Nitro module, a TurboModule or a custom Expo module." },
  { name: "expo-pnpm-catalog", line: "Runs expo-doctor and expo install --fix against resolved catalog versions, syncs drift back", problem: "Expo SDK dependency versions drift out of sync across a pnpm catalog." },
  { name: "vite-workspace-resolver", line: "Vite plugin that resolves workspace exports maps and deep src/ imports", problem: "Vitest fails to resolve another workspace package's subpath export or src/ file." },
  { name: "agent-context-budget", line: "Scores context files against token budgets, shows which sections to cut", problem: "CLAUDE.md or AGENTS.md grows past what an agent session should load." },
];
