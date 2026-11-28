# Levels

Everything a level is, as data: one file per level, and `catalog/` for what levels share. Nothing
here runs; the engine reads it.

| File                | Holds                                                                |
| ------------------- | -------------------------------------------------------------------- |
| `<level>.ts`        | one level: its map, events, palette, turret and boss (`MissionMap`)  |
| `index.ts`          | the levels in the story's order, and how often the clock brings each |
| `catalog/foes.ts`   | every kind of foe: size, health, points                              |
| `catalog/points.ts` | what crates, weapons, teammates, the turret and the boss are worth   |
| `catalog/lore.ts`   | one fun fact per skill, told when a crate unlocks it                 |

## Add a level

1. Copy a level file, rename it, and change its `id`, title, briefing, events and palette.
2. List it in `index.ts`, with a rarity.
3. Run `pnpm test`: `test/mission-levels.test.ts` checks every word can be drawn, the events run in
   order and end on the boss, and every foe is in the catalog.
