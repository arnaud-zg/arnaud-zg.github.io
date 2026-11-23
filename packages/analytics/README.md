# @arnaud-zg/analytics

Consent-first analytics. The core decides what may be sent and when; providers plug in.

## Turn on

Fill a value in `portfolio.config.ts`, under `analytics.providers`. Empty is off. Each works alone.

| Provider                   | Gives                 | Its value                                                              |
| -------------------------- | --------------------- | ---------------------------------------------------------------------- |
| `cloudflare-web-analytics` | page views, speed     | dashboard, Web Analytics, add the site, manual snippet: its token      |
| `cloudflare-events`        | the KPIs below        | the address printed by `pnpm analytics:deploy`                         |

Web Analytics takes no custom events, so a Worker (`packages/analytics-collector`) keeps ours in
Analytics Engine, for three months. Leave Web Analytics' automatic setup off: it would skip the question.

## Read

`pnpm analytics:report [days]` prints the KPIs and what to check next.

| KPI              | Share of visits that...       | Event              | If low, check                           |
| ---------------- | ----------------------------- | ------------------ | --------------------------------------- |
| Engaged          | read two sections or more     | `section_read`     | the hero: is there a reason to scroll?  |
| Explored         | opened or copied something    | `content_explored` | do tiles and folded parts look clickable? |
| Followed through | went to a link. **The goal.** | `link_followed`    | links beside the sections they read     |

`page_viewed` (source, device) counts visits and says who follows through most. Targets are in
`packages/analytics-collector/src/domain/kpis.ts`: starting points, to move after a first month.
Only people who said yes are counted: read rates and rankings, not totals.

## Change

- **What is collected**: [`src/domain/plan.ts`](./src/domain/plan.ts), the only list. The browser and
  the collector check events against it, and the privacy dialog prints it. Raise `PLAN_VERSION` when
  it collects more: everyone is asked again. Redeploy the Worker.
- **Another provider**: one adapter, one line in [`src/providers.ts`](./src/providers.ts).
- **Off for one build**: `ANALYTICS=none pnpm build`. Try it: `ANALYTICS=console pnpm dev`.
- **Off for a visitor**: Privacy, at the end of the page.

## Why it asks

Counting visits can be exempt from consent in France, under strict conditions. This goes further
(interest, per section and link) and uses a third party, so it asks: nothing is downloaded or sent
before a yes. A careful reading, not legal advice.

## Parts

`adapters → application → ports → domain`. Driven ports: `AnalyticsProvider`, `ConsentStore`,
`PrivacySignal`. Driving adapters: `dom.visitor` (what visitors do), `dom.ask` (what they answer).
