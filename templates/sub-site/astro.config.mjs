import { defineConfig } from "astro/config";

// Served at arnaud-zg.github.io/js-packages: the same origin as the portfolio.
export default defineConfig({
  site: "https://arnaud-zg.github.io",
  base: "/js-packages",
  trailingSlash: "always",
});
