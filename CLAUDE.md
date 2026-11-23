# arnaud-zg.github.io

## UI: always use the design system

The design system is `packages/design` (`@arnaud-zg/design`), isolated so every site can reuse it.

- Build every page, here and in sub-sites, from its components, layouts and tokens. Do not create
  custom UI: no one-off components, no new styles in `src/`, no raw colours or sizes.
- Look in `/design/` (the workshop) first for a part that fits.
- If no part fits, add or extend it in `packages/design`, show it in `/design/`, then use it.
- Never restyle the package's classes from a site, and never import anything from outside the
  package into it.
- The treemap, career cards and diff rows in `src/styles/global.css` came before this rule. Do not
  add to them: when one needs real changes, move it into `packages/design`.
- Run `pnpm check` after a UI change. It checks isolation, restyling and the workshop.
