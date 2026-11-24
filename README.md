# arnaud-zg.github.io

Personal site of Arnaud Zheng: who I am, my journey, the open-source tools I publish, what I write
and what I contribute to other projects. Live at [arnaud-zg.github.io](https://arnaud-zg.github.io).

Built with [Astro](https://astro.build) as a static site. Light and dark themes, over a photo of
Shanghai from Suzhou Creek.

## Data

Everything on the page that can change is fetched when the site is built. Each deploy
refreshes it:

| Section     | Source                                                              |
| ----------- | ------------------------------------------------------------------- |
| Side quests | npm registry, packages I maintain, grouped with their plugins       |
| Open source | GitHub, merged pull requests in repositories I do not own           |
| Writing     | Substack RSS feed                                                   |

If a source cannot be reached, a local build falls back to the saved data in `apps/portfolio/src/data/snapshots`.
The deploy sets `STRICT_DATA=1` and fails instead, so the site online never goes back to old numbers.
What to fetch, and which organisations count as mine, is set in
[`portfolio.config.ts`](./apps/portfolio/portfolio.config.ts).

## Develop

```sh
nvm use        # Node 24
pnpm install
pnpm dev       # http://localhost:4321
pnpm build     # static site in apps/portfolio/dist/
```

Set `GITHUB_TOKEN` when building locally to avoid GitHub's anonymous rate limit.

## Credits

Hero photo by [Jiawei Wen](https://www.pexels.com/photo/the-lujiazui-skyline-across-the-huangpu-river-4118772/) on Pexels.
