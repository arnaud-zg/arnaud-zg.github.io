// What the workshop shows. Organisms and templates open in frames, at /design/preview/<id>/.
export const frames = [
  { id: "masthead", level: "Organisms", name: "Masthead", use: "Transparent over a Hero, frosted once past it. Below 960px the links move into a menu.", height: 420, code: '<Masthead site={site} nav={nav} />' },
  { id: "hero-full", level: "Organisms", name: "Hero, full", use: "The front door of the portfolio. One per origin.", height: 700, code: '<Hero site={site} size="full" title="…" tagline="…" next="#glance" />' },
  { id: "hero-banner", level: "Organisms", name: "Hero, banner", use: "The top of every sub-site page. The full hero morphs into it during navigation.", height: 380, code: '<Hero site={site} title="js-packages" tagline="…" />' },
  { id: "page-head", level: "Organisms", name: "Page head", use: "The top of a page without the photo. The header starts frosted.", height: 320, code: '<PageHead title="shiplane" tagline="…" />' },
  { id: "ending", level: "Organisms", name: "Ending", use: "Closes every page: last words, profiles, then the other live sites.", height: 450, code: '<Ending site={site} title="…" line="…" links={links} />' },
  { id: "home-hero", level: "Templates", name: "Sub-site home, with hero", use: "For a front door: the photo carries over from the portfolio.", height: 760, code: '<Page site={site} heading="js-packages" hero>' },
  { id: "home-plain", level: "Templates", name: "Sub-site home, without hero", use: "For a site people come back to: content first.", height: 760, code: '<Page site={site} heading="js-packages" hero={false}>' },
  { id: "page-hero", level: "Templates", name: "Sub-site page, with hero", use: "For a page that introduces something.", height: 760, code: '<Page site={site} heading="shiplane" hero>' },
  { id: "page-plain", level: "Templates", name: "Sub-site page, without hero", use: "For reading: guides, references, Markdown.", height: 760, code: '<Page site={site} heading="shiplane" hero={false}>' },
] as const;
export type Frame = (typeof frames)[number];
