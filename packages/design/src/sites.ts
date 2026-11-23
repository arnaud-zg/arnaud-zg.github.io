// Every site that shares this design. All live under one origin, which is what lets the theme
// choice and the page transitions carry from one to the next.
export type SiteEntry = { id: string; label: string; path: string; line: string; live: boolean };

const all: SiteEntry[] = [
  { id: "home", label: "arnaud-zg", path: "/", line: "Portfolio", live: true },
  // Turn `live` on once the site is deployed: until then nothing links to it.
  { id: "js-packages", label: "js-packages", path: "/js-packages/", line: "TypeScript tools for monorepos", live: false },
];

// PREVIEW_SITES=1 links sites that are not deployed yet, for `pnpm preview:sites`.
const preview = process.env.PREVIEW_SITES === "1";
export const sites = all.filter((s) => s.live || preview);
export const siteById = (id: string) => all.find((s) => s.id === id);
export const otherSites = (id: string) => sites.filter((s) => s.id !== id);
