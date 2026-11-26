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
- A component's styles live in its own `<style is:global>` and style only what it renders; a class
  two components share goes in `components/parts/`. Never hashed scoped `<style>`: it costs bytes.
- Run `pnpm check` after a UI change. It checks isolation, restyling and the workshop.

## Releases: changesets, not commits

Shiplane versions from `.changeset/*.md` only. Commit types (`feat`, `fix`) release nothing.

- A pull request that changes the app's final build adds a changeset in the same pull request:
  refactors and saved data included, even when the code is in `packages/`.
- No changeset for what stays out of that build: tests, repository docs, CI, tooling, scripts.
- Name `portfolio` in it: it is the app that ships. Write one sentence, for a visitor; it becomes
  the changelog line.
- When visitors see no difference, the sentence says so.
- Never edit a `CHANGELOG.md` or a version by hand: the release pull request does it.
