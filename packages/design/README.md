# @arnaud-zg/design

A shared design for a site and its sub-sites, for Astro: tokens, styles, page shell,
components and page transitions. See every part live at `/design/`.

## Start a sub-site

Documentation sites use [Starlight](https://starlight.astro.build), dressed by a plugin of this package:

```js
import starlight from "@astrojs/starlight";
import design from "@arnaud-zg/design/starlight";

starlight({ title: "my-site", plugins: [design({ site: info })] });
```

1. Copy `templates/sub-site` into the other repository, for example as `site/`.
2. Point its dependency at this package. No npm release needed:
   `"@arnaud-zg/design": "github:arnaud-zg/arnaud-zg.github.io#main&path:/packages/design"`
3. Set `base` in `astro.config.mjs` to the repository name, and edit `site.config.mjs`.
4. Write pages in `src/content/docs`. Sub-sites have no hero: pages start with their title.
5. Add the site to `sites` in `apps/portfolio/portfolio.config.ts` and in the sub-site. Set `live: true` once it is
   deployed.

A site's own `components` overrides win over the plugin's. Search works in a build, not in `astro dev`.

## Custom pages

For pages that are not documentation:

```astro
---
import Page from "@arnaud-zg/design/Page.astro";
import { info } from "../site"; // id, brand and sites: see src/site.ts in this package
---
<Page site={info} title="…" description="…" nav={[]} heading="js-packages" tagline="…">
  <section class="section section--first">…</section>
</Page>
```

`Page` starts with its title. A page with a photo, on the portfolio only, composes `Site`, `Hero` and
`Content` instead.

## Rules that keep it one design

- Sites must share the origin `arnaud-zg.github.io`. Transitions and the theme choice do not cross
  origins, so a custom domain or a Vercel URL loses both.
- Links between sites open in the same tab; links that leave the origin open a new one.
- Use tokens, never raw colours. Text on the photo uses `--on-photo-*`.
- Morph one element into another by giving both the same `transitionName`, unique on each page.
- Styles used by one site only stay in that site.

## Preview every site together

`pnpm preview:sites` builds the portfolio and the starter under one origin, on port 4330.
Firefox and older browsers navigate without the transition.

`pnpm check` fails when this package reaches outside itself, when a site restyles its classes, or
when a component is missing from `/design/`.
