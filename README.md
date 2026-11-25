# arnaud-zg.github.io

Personal site of Arnaud Zheng: who I am, my journey, the open-source tools I publish, what I write
and what I contribute to other projects. Live at [arnaud-zg.github.io](https://arnaud-zg.github.io).

Built with [Astro](https://astro.build) as a static site. Light and dark themes, over a photo of
Shanghai from Suzhou Creek.

## Data

Everything on the page that can change is saved in `apps/portfolio/src/data/snapshots`, and a build
reads only that. Each release refreshes it on this machine, from public sources, and the release PR
carries it. GitHub is read through `gh`, which must be signed in (`gh auth login`); a build needs no
sign-in:

| Section     | Source                                                        |
| ----------- | ------------------------------------------------------------- |
| Side quests | npm registry, packages I maintain, grouped with their plugins |
| Open source | GitHub, merged pull requests in repositories I do not own     |
| Writing     | Substack RSS feed                                             |

A source that cannot be reached stops the release before its PR opens. GitHub Actions fetches none
of them: Substack refuses its servers. New content alone, such as an article, needs a changeset to
be released.

```sh
pnpm data:refresh   # rewrites the saved data from the live sources; all of it, or nothing
```

What to fetch, and which organisations count as mine, is set in
[`portfolio.config.ts`](./apps/portfolio/portfolio.config.ts).

## Develop

```sh
nvm use        # Node 24
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # static site in apps/portfolio/dist/
```

```sh
pnpm verify    # types, lint, Markdown, format and tests
pnpm format    # fix the format; `pnpm lint:fix` for the rest
```

The rules come from [`@arnaud-zg/configs`](https://www.npmjs.com/package/@arnaud-zg/configs).
`pnpm install` adds its git hooks: no commit on `main`, staged files formatted, and commit messages
as `type(scope): subject`. Switching branch pulls it.

## Layout

| Folder               | Holds                                 |
| -------------------- | ------------------------------------- |
| `apps/portfolio`     | this site                             |
| `packages/design`    | the shared design                     |
| `packages/analytics` | consent, tracking plan, providers     |
| `packages/profile`   | career, tools, contributions, writing |
| `templates/sub-site` | starts a new sub-site                 |

## Shared design

[`packages/design`](./packages/design) holds what every site here shares; this portfolio is its
first user. [`templates/sub-site`](./templates/sub-site) starts a new one. `pnpm preview:sites` runs
both together.

## Analytics

Visitors opt in. Mocked in development, off on the preview, on in production when `POSTHOG_KEY` is
set: see [`packages/analytics`](./packages/analytics).

## Release

With [Shiplane](https://www.npmjs.com/package/shiplane), from this machine or from GitHub Actions
(`pnpm shiplane ship --via ci`, or Run workflow on Ship). This machine needs `gh auth login`, and
`apps/portfolio/.env` for analytics. GitHub Actions reads `POSTHOG_KEY` and `POSTHOG_REGION` from
the repository's variables.

```sh
pnpm changeset   # in your pull request: what changed
pnpm release     # on main: refreshes the data, opens the release PR; once merged, ships the preview
pnpm release promote   # ships the preview to production
```

The preview is at [/preview/](https://arnaud-zg.github.io/preview/), and production ships after it.
See what would run with `pnpm shiplane ship --dry-run`.

## Credits

Hero photo by
[Jiawei Wen](https://www.pexels.com/photo/the-lujiazui-skyline-across-the-huangpu-river-4118772/) on
Pexels.
