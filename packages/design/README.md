# @arnaud-zg/design

The shared design of arnaud-zg.github.io and its sub-sites, for Astro: tokens, styles, page shell,
components and page transitions. See every part live at `/design/`.

## Start a sub-site

1. Copy `templates/sub-site` into the other repository, for example as `site/`.
2. Point its dependency at this package. No npm release needed:
   `"@arnaud-zg/design": "github:arnaud-zg/arnaud-zg.github.io#main&path:/packages/design"`
3. Set `base` in `astro.config.mjs` to the repository name, and edit `src/site.ts`.
4. Add the site to `src/sites.ts` here. Set `live: true` once it is deployed.

## Use it

```astro
---
import Page from "@arnaud-zg/design/Page.astro";
---
<Page site="js-packages" title="…" description="…" nav={[]} heading="js-packages" tagline="…" hero={false}>
  <section class="section section--first">…</section>
</Page>
```

`hero` (default `true`) opens the page on the photo banner; `hero={false}` opens it on a plain page
head. Both can be mixed on one site: the starter picks per page type in `src/site.ts`. For anything
else, compose `Site`, `Hero`, `PageHead` and `Content` yourself, with `solid` on a `Site` that has no
hero.

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
