// What the workshop shows. Organisms and templates open in frames, at /design/preview/<id>/.
export const frames = [
  {
    id: "masthead",
    level: "Organisms",
    name: "Masthead",
    use: "Transparent over a Hero, frosted once past it. Below 960px the links move into a menu.",
    height: 420,
    code: "<Masthead site={site} nav={nav} />",
  },
  {
    id: "hero-full",
    level: "Organisms",
    name: "Hero, full",
    use: "The front door of the portfolio. One per origin.",
    height: 700,
    code: '<Hero site={site} size="full" title="…" tagline="…" next="#glance" />',
  },
  {
    id: "hero-banner",
    level: "Organisms",
    name: "Hero, banner",
    use: "A short photo, for the portfolio's own inner pages. Sub-sites have no hero.",
    height: 380,
    code: '<Hero site={site} title="js-packages" tagline="…" />',
  },
  {
    id: "page-head",
    level: "Organisms",
    name: "Page head",
    use: "The top of a page without the photo. The header starts frosted.",
    height: 320,
    code: '<PageHead title="shiplane" tagline="…" />',
  },
  {
    id: "ending",
    level: "Organisms",
    name: "Ending",
    use: "Closes every page: last words, profiles, then the other live sites.",
    height: 450,
    code: '<Ending site={site} title="…" line="…" links={links} />',
  },
  {
    id: "home",
    level: "Templates",
    name: "Custom home",
    use: "For a home that is not documentation: content first.",
    height: 760,
    code: '<Page site={site} heading="js-packages">',
  },
  {
    id: "page",
    level: "Templates",
    name: "Custom page",
    use: "For reading: guides, references, Markdown.",
    height: 760,
    code: '<Page site={site} heading="shiplane">',
  },
] as const;
// Real Starlight pages, from src/content/docs/design/starlight.
export const starlightFrames = [
  {
    id: "home",
    name: "Docs home",
    use: "A title, then cards, with no sidebar.",
    height: 620,
    code: "template: splash",
  },
  {
    id: "page",
    name: "Docs page",
    use: "Sidebar, title, contents. Everything Markdown can hold.",
    height: 820,
    code: "title: shiplane",
  },
] as const;
export type Frame = (typeof frames)[number];
