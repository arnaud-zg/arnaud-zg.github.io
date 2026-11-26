# @arnaud-zg/design

A shared design for a site and its sub-sites, for Astro: tokens, styles, page shell, components and
page transitions. See every part live at `/design/`.

## Start a sub-site

Documentation sites use [Starlight](https://starlight.astro.build), dressed by a plugin of this
package:

```js
import design from "@arnaud-zg/design/starlight";
import starlight from "@astrojs/starlight";

starlight({ title: "my-site", plugins: [design({ site: info })] });
```

1. Copy `templates/sub-site` into the other repository, for example as `site/`.
2. Point its dependency at this package. No npm release needed:
   `"@arnaud-zg/design": "github:arnaud-zg/arnaud-zg.github.io#main&path:/packages/design"`
3. Set `base` in `astro.config.mjs` to the repository name, and edit `site.config.mjs`.
4. Write pages in `src/content/docs`. Sub-sites have no hero: pages start with their title.
5. Add the site to `sites` in `apps/portfolio/portfolio.config.ts` and in the sub-site. Set
   `live: true` once it is deployed.

A site's own `components` overrides win over the plugin's. Search works in a build, not in
`astro dev`.

## Version

Give the site info a `version`, and optionally a `source` address. It never shows on the page: it is
in `<meta name="version">`, and in the console with a few birds.

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

`Page` starts with its title. A page with a photo, on the portfolio only, composes `Site`, `Hero`
and `Content` instead.

## Rules that keep it one design

- Sites must share the origin `arnaud-zg.github.io`. Transitions and the theme choice do not cross
  origins, so a custom domain or a Vercel URL loses both.
- Links between sites open in the same tab; links that leave the origin open a new one.
- Use tokens, never raw colours. Text on the photo uses `--on-photo-*`.
- Morph one element into another by giving both the same `transitionName`, unique on each page.
- A site has no styles of its own: a component brings its styles, loaded only on pages that render
  it.
- A component's styles sit in its own `<style is:global>` and style only the classes it renders. A
  class two components share lives in `components/parts/`, imported by both. What stays global is
  `styles/`: tokens, fonts, the reset, text primitives (`.label`, `.inline`), view transitions.
- Unhashed on purpose: hashed scoped styles added about 9% to the CSS and 9% to the HTML of the home
  page. Isolation is checked instead.

## Variants

A component's variants are written once, beside it (`Hero.variants.ts`), with `defineVariants` from
`@arnaud-zg/design/variants`. The component takes them as typed props and puts them on its root as
data attributes; its styles select them (`.hero[data-size="banner"]`). In `/design/`, a story given
the spec shows a control per axis, every combination in a grid, the matching code, and a link that
keeps the choice (`/design/#pill?look=quiet`). `pnpm check` fails if a spec has no story.

## Preview every site together

`pnpm preview:sites` builds the portfolio and the starter under one origin, on port 4330. Firefox
and older browsers navigate without the transition.

`pnpm check` fails when this package reaches outside itself, when a site restyles its classes or has
a `<style>`, when a component styles a class it does not render or one another component styles, or
when a component is missing from `/design/`. `pnpm build` then fails if a page ships more CSS than
`css-budget.json` allows.
