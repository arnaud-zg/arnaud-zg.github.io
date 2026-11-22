# arnaud-zg.github.io

Personal site of Arnaud Zheng: who I am, my journey, the open-source tools I publish, what I write
and what I contribute to other projects. Live at [arnaud-zg.github.io](https://arnaud-zg.github.io).

Built with [Astro](https://astro.build) as a static site. Light and dark themes, over a photo of
Shanghai from Suzhou Creek.

## Data

Everything on the page that can change is fetched when the site is built, and a daily scheduled
build keeps it current:

| Section     | Source                                                              |
| ----------- | ------------------------------------------------------------------- |
| Side quests | npm registry, packages I maintain, grouped with their plugins       |
| Open source | GitHub, merged pull requests in repositories I do not own           |
| Writing     | Substack RSS feed                                                   |

If a source cannot be reached, the build falls back to a saved snapshot instead of failing.
What to fetch, and which organisations count as mine, is set in
[`portfolio.config.ts`](./portfolio.config.ts).

## Develop

```sh
nvm use        # Node 24
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # static site in dist/
```

Set `GITHUB_TOKEN` when building locally to avoid GitHub's anonymous rate limit.

## Deploy

Every push to `main` builds the site and publishes it to the `gh-pages` branch, which
GitHub Pages serves. A scheduled build runs every day to refresh the data.

## Credits

Hero photo by [Jiawei Wen](https://www.pexels.com/photo/the-lujiazui-skyline-across-the-huangpu-river-4118772/) on Pexels.
