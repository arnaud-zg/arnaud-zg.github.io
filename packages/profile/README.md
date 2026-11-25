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
`src/composition.ts` wires them. Where the saved data replaces a source that is down is decided in
one place: `SavedData`.

No event sourcing here: nothing is written, everything is read again at each build. The visitor's
consent, in `packages/analytics`, is the only thing decided over time.
