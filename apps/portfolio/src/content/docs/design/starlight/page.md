---
title: shiplane
---

Releasing several apps from one repo is a pile of scripts.

## Install

```sh
pnpm add -D shiplane
```

## Configure

Each app declares how it ships, in `shiplane.config.ts`:

```ts title="shiplane.config.ts"
export default { flow: "changesets" };
```

:::note[Good to know]
Finds what changed, versions it, then ships it through plugins.
:::

:::caution
A test release never touches the latest tag.
:::

| Plugin     | Ships to           |
| ---------- | ------------------ |
| `npm`      | The npm registry   |
| `fly`      | Fly.io             |

1. Find what changed.
2. Version and tag it.
3. Ship each app.
