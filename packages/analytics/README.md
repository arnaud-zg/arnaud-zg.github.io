# @arnaud-zg/analytics

Consent-first analytics. The core decides what may be sent and when; a provider receives it.

## Turn on

1. In PostHog, copy the project key (Settings, Project). It starts with `phc_`.
2. Copy `apps/portfolio/.env.example` to `apps/portfolio/.env` and paste it there. Git ignores
   `.env`; variables set in the shell win over it. `POSTHOG_REGION` is `eu` unless you say `us`.
3. In PostHog, keep IP data capture off (Settings, Project), and no card on the account.

Read when the site is built, never written in the code. The key is public by nature: it ends up in
the built page. A wrong value stops the build and says what to write.

## Run locally

| Run                     | What happens                                                    |
| ----------------------- | --------------------------------------------------------------- |
| `pnpm dev`              | A mock: events print in the console, PostHog never loads        |
| `ANALYTICS=on pnpm dev` | PostHog, after a yes. Events are tagged `environment: local`    |
| `ANALYTICS=off`         | No analytics code and no question, in `dev` or `build`          |
| `pnpm build`            | PostHog when `POSTHOG_KEY` is set, else nothing, and it says so |

Events are `environment: production` only on the live address, so a build served locally never
counts.

## Shipped

On by default: a build has analytics when `POSTHOG_KEY` is set, unless `ANALYTICS` is `off`.

| Where      | `ANALYTICS` | What happens                                   |
| ---------- | ----------- | ---------------------------------------------- |
| Preview    | `off`       | No analytics code and no question              |
| Production | empty       | PostHog when `POSTHOG_KEY` is set, after a yes |

Empty is the same as unset. The preview is off because it shares production's address: its visits
would count as production. `ANALYTICS` is set per environment in
[`shiplane.unit.yml`](../../apps/portfolio/shiplane.unit.yml); the key and region are the
repository's variables on GitHub.

## Read

In PostHog, filter every insight on `environment = production`. A visit is one page opened by
someone who said yes: read rates and rankings, not totals.

| KPI              | Insight                                               | If low, check                             |
| ---------------- | ----------------------------------------------------- | ----------------------------------------- |
| Engaged          | Funnel: `page_viewed`, `section_read`, `section_read` | Is there a reason to scroll?              |
| Explored         | Funnel: `page_viewed`, `content_explored`             | Do tiles and folded parts look clickable? |
| Followed through | Funnel: `page_viewed`, `link_followed`. **The goal.** | Links beside the sections they read       |
| Interest         | Trend: `section_read`, sum of `seconds`, by `section` | What to move up or cut                    |

Split a funnel by `source` or `device` to see who follows through. Engaged can count one section
read twice, when a visitor leaves the tab and comes back.

## Change

- **What is collected**: [`src/domain/plan.ts`](./src/domain/plan.ts), the only list. Events are
  checked against it, and the privacy dialog prints it. Raise `PLAN_VERSION` when it collects more:
  everyone is asked again.
- **Another provider**: one adapter, one case in [`src/providers.ts`](./src/providers.ts), its
  settings in [`src/domain/settings.ts`](./src/domain/settings.ts).
- **Off for a visitor**: Privacy, at the end of the page.

## Why it asks

Counting visits can be exempt from consent in France, under strict conditions. This goes further
(interest, per section and link) and uses a third party, so it asks: nothing is downloaded or sent
before a yes. A careful reading, not legal advice.

## Parts

`adapters → application → ports → domain`. Driven ports: `AnalyticsProvider` (`posthog`, `mock`),
`ConsentStore`, `PrivacySignal`. Driving adapters: `dom.visitor` (what visitors do), `dom.ask` (what
they answer).
