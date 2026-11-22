// What the portfolio shows, in one place. Data is fetched at build time; this file decides
// what to keep, how to group it and what to call it. Edit it, rebuild, done.

export type CompanyType = "agency" | "startup" | "sme" | "large";
// `level` indexes career.levels and sets the building height; a milestone can raise it mid-stay.
export type Station = { name: string; type: CompanyType; role: string; start: string; end?: string; fullTime: boolean; level: number; note: string; milestones?: { at: string; label: string; level?: number }[] };
export type StackRange = { label: string; start: string; end?: string };

export default {
  name: "Arnaud Zheng",
  role: { text: "Software engineer, Platform at", company: "Doctolib" },
  links: [
    { label: "GitHub", href: "https://github.com/arnaud-zg", icon: "github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/arnaudzheng", icon: "linkedin" },
    { label: "Substack", href: "https://arnaudzg.substack.com", icon: "substack" },
  ],

  about: {
    title: "Hi, I'm Arnaud.",
    lede: "I build the tools other engineers rely on: release pipelines, database migration checks, bundler fixes. Before that, full-stack engineer shipping product features, then designing event-sourced systems with DDD.",
  },

  // Numbers are computed from the career below and from npm; only the words live here.
  numbers: {
    years: "shipping software",
    stay: "longest stay",
    tools: "built off hours: dev tooling, automation, AI",
  },

  // Career, oldest first. Months are "YYYY-MM"; leave `end` out for the current role.
  // `fullTime: false` stints sit on the school band and are not counted in tenure.
  career: {
    school: { label: "Epitech, 6-month stints" },
    // Scope of the role, lowest first. Each station's building is as tall as its level.
    levels: ["Internship", "Engineer", "Senior", "Platform"],
    types: { agency: "Agency", startup: "Startup", sme: "SME", large: "Large company" } as Record<CompanyType, string>,
    stations: [
      { name: "Adveris", type: "agency", role: "Full-stack developer", start: "2013-07", end: "2013-12", fullTime: false, level: 0, note: "Eight client sites: storefronts, portals, e-commerce" },
      { name: "Testapic", type: "startup", role: "Full-stack developer", start: "2014-09", end: "2015-02", fullTime: false, level: 0, note: "Back office for remote user testing" },
      { name: "Valeo", type: "large", role: "R&D project developer", start: "2015-03", end: "2015-08", fullTime: false, level: 0, note: "Project tracking tool for the lighting R&D teams, in Go" },
      { name: "ASC", type: "sme", role: "Full-stack developer", start: "2016-01", end: "2016-06", fullTime: false, level: 0, note: "E-commerce automation: abandoned cart and post-purchase emails" },
      { name: "Solive", type: "startup", role: "Full-stack developer", start: "2016-09", end: "2017-02", fullTime: false, level: 0, note: "Real-time sports visuals for clubs like PSG and Manchester City" },
      { name: "Veepee", type: "large", role: "Front-end developer", start: "2017-03", end: "2019-05", fullTime: true, level: 1, note: "Ticketing: SEO, time to first byte, a design system shared with the app" },
      { name: "Onepark", type: "startup", role: "Mobile engineer", start: "2019-06", end: "2020-01", fullTime: true, level: 1, note: "Parking app on iOS and Android: maps, Stripe payments" },
      { name: "PayFit", type: "startup", role: "Software engineer, then senior", start: "2020-01", end: "2025-12", fullTime: true, level: 1, note: "Monolith to microservices, then an event-sourced company lifecycle", milestones: [{ at: "2023-01", label: "Senior", level: 2 }] },
      { name: "Doctolib", type: "startup", role: "Software engineer, Platform", start: "2026-01", fullTime: true, level: 3, note: "Platform products that help engineers ship faster" },
    ] as Station[],
    // What I worked with over time, drawn under the bar.
    stack: [
      { label: "Web, PHP, Go", start: "2013-07", end: "2017-02" },
      { label: "React, SSR, design systems", start: "2017-03", end: "2019-05" },
      { label: "React Native", start: "2019-06", end: "2020-01" },
      { label: "Microservices, then event sourcing, CQRS, DDD", start: "2020-01", end: "2025-12" },
      { label: "Platform, Module Federation", start: "2026-01" },
    ] as StackRange[],
  },

  github: {
    user: "arnaud-zg",
    // Organisations I run. Work on their repos never counts as an open-source contribution.
    // Public organisations are also read from GitHub at build time and excluded automatically.
    ownOrgs: ["airmelon-studio", "contraband-corp", "crispy-best", "semaphore-corporation", "Solfanto", "hangry-community", "imagette"],
    // Organisations to keep even though I am a member (my employer's open source counts).
    keepOrgs: ["doctolib"],
    // Repos that are not contributions: school group projects, data-file edits, sandboxes.
    excludeRepos: ["Orlands/snake-tj", "pqvst/cafeandcowork", "muan/hello-world"],
    // Changelog columns, in order. A repo joins the first theme whose pattern matches
    // ("owner/*" matches a whole organisation). Anything else lands in `otherTheme`.
    themes: [
      { name: "Module Federation", repos: ["web-infra-dev/rspack", "module-federation/*"] },
      { name: "Dev tooling", repos: ["ohmyzsh/ohmyzsh", "DefinitelyTyped/DefinitelyTyped", "gitlabhq/gitlabhq"] },
    ],
    otherTheme: "Libraries",
    changesPerProject: 2,
    projectsPerTheme: 4,
  },

  npm: {
    maintainer: "arnaud-zg",
    // A tool with no release in this many months folds into "Earlier".
    activeMonths: 24,
    // Treemap groups, in order. A tool joins the first group with a matching keyword or name part.
    groups: [
      { name: "Shipping", match: ["release", "deploy", "migration", "database"] },
      { name: "Code health", match: ["technical-debt", "code-quality", "eslint", "feature-flags"] },
      { name: "Mobile", match: ["expo", "react-native"] },
      { name: "AI agents", match: ["llm", "ai-agents", "claude-code"] },
      { name: "Web build", match: ["vite", "react", "frontend"] },
    ],
    otherGroup: "Other",
    // Tools smaller than this share of the treemap merge into "+n more" in their group.
    minShare: 0.03,
  },

  substack: {
    feed: "https://arnaudzg.substack.com/feed",
  },
} as const;
