# arnaud-zg.github.io

## Layout

- `apps/`: what runs. `portfolio` is the site.
- `packages/`: what apps share. `templates/`: the sub-site starter. Run scripts from the root.

## UI: always use the design system

The design system is `packages/design` (`@arnaud-zg/design`), isolated so every site can reuse it.

- Build every page, here and in sub-sites, from its components, layouts and tokens. Do not create
  custom UI: no one-off components, no new styles in a site's `src/`, no raw colours or sizes.
- Documentation sites use Astro Starlight with the package's plugin (`@arnaud-zg/design/starlight`).
  Change its look in the package, never in a site. Sub-sites have no hero.
- Look in `/design/` (the workshop) first for a part that fits.
- If no part fits, add or extend it in `packages/design`, show it in `/design/`, then use it.
- Never restyle the package's classes from a site, and never import anything from outside the
  package into it.
- The portfolio has no styles of its own; only the workshop does (`workshop.css`). Pages pass data
  to components.
- Run `pnpm check` after a UI change. It checks isolation, restyling and the workshop.
