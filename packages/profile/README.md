# @arnaud-zg/profile

What a profile says, and how it is worked out. It knows no framework and no design; a site gives it
its settings and saved data.

| Context         | Decides                                                          |
| --------------- | ---------------------------------------------------------------- |
| `career`        | experience, roles, promotions, early jobs                        |
| `quests`        | which packages are tools, how they group and how large they show |
| `contributions` | what counts as a contribution, how projects rank                 |
| `articles`      | what was written                                                 |
| `skills`        | which agent skills exist                                         |

`adapters → application → ports → domain`, checked by `pnpm check`. Contexts share only `shared`;
`src/profile.ts` joins them through their ports, and `src/composition.ts` wires the live adapters.
Each port has an in-memory adapter, held to the same contract as the live one. A build reads the
saved data alone; `live` reads the sources, to renew it.

No event sourcing here: nothing is written, everything is read again at each refresh. The visitor's
consent, in `packages/analytics`, is the only thing decided over time.
