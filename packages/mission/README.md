# @arnaud-zg/mission

The secret mission: an arcade run-and-gun behind the Konami code, whose crates hold a site's career.
The rules know no screen; the arcade plays them in a browser. A site reaches it through
`Mission.astro` in `@arnaud-zg/design`, and gives it its chapters and words.

| Context     | Decides                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| `combat`    | the weapons, the score chain, the review after each map, the rank        |
| `challenge` | the technical debt the run carries from map to map                       |
| `director`  | how hard the game is: the heat that follows the player, help when stuck  |
| `moves`     | how the hero moves: forgiving jumps, special moves, hit-stop, the magnet |
| `input`     | the keys, the Konami code and its swipes, where the touch deck sits      |
| `campaign`  | the maps, which one the clock brings, the loadout a career gives         |
| `arcade`    | the cabinet: canvas, pixel font, sprites, sound, sharing, the listener   |

`adapters → domain`, checked by `pnpm check`, and contexts look only where the map says: `moves`
reads `input`, `campaign` reads `combat` and `challenge`, the `arcade` reads them all, and nothing
reads the `arcade`. Every domain is pure and tested with `node --test`; the arcade is played, not
unit-tested.

Until the code is in, a page carries only `./trigger`: the listener, and the Konami code it waits
for. The game, its art and its sound load after.

Every level, and what levels share (foes, points, lore), lives in one folder:
[`src/campaign/domain/levels/`](src/campaign/domain/levels/README.md) says how to add one.
