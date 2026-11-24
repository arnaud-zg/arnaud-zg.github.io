import type { APIRoute } from "astro";

import config from "../../portfolio.config";

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap-index.xml", config.site.url)}\n`,
  );
