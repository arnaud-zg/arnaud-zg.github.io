import design from "@arnaud-zg/design/starlight";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import { info, repo, sidebar } from "./site.config.mjs";

// Served at arnaud-zg.github.io/js-packages: the same origin as the portfolio.
export default defineConfig({
  site: "https://arnaud-zg.github.io",
  base: "/js-packages",
  integrations: [
    starlight({
      title: "js-packages",
      description:
        "Small, focused TypeScript tools for monorepos: release automation, Expo, Vite and AI agents.",
      social: [{ icon: "github", label: "GitHub", href: repo }],
      sidebar,
      plugins: [design({ site: info })],
    }),
  ],
});
