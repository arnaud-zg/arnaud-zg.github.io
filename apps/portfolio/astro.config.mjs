import design from "@arnaud-zg/design/starlight";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import config from "./portfolio.config.ts";

export default defineConfig({
  site: config.site.url,
  // Set by Shiplane: the folder a preview lives in.
  base: process.env.BASE_PATH ?? "/",
  // Everything the bundler writes is minified. Astro compresses the pages by default.
  vite: { build: { minify: "oxc", cssMinify: "lightningcss", sourcemap: false } },
  integrations: [
    // The workshop is not for search engines.
    sitemap({ filter: (page) => !new URL(page).pathname.includes("/design/") }),
    // Only for the workshop: the pages in src/content/docs/design/starlight, as a sub-site shows them.
    starlight({
      title: config.site.brand,
      disable404Route: true,
      head: [{ tag: "meta", attrs: { name: "robots", content: "noindex" } }],
      sidebar: [{ label: "Packages", items: ["design/starlight/page"] }],
      plugins: [
        design({ site: { id: "js-packages", brand: config.site.brand, sites: config.sites } }),
      ],
    }),
  ],
});
