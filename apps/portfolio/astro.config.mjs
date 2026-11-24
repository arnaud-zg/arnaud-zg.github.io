import sitemap from "@astrojs/sitemap";
import { defineConfig } from "astro/config";
import config from "./portfolio.config.ts";

export default defineConfig({
  site: config.site.url,
  integrations: [sitemap()],
});
