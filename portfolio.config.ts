// What the portfolio shows, in one place. Data is fetched at build time; this file decides
// what to keep, how to group it and what to call it. Edit it, rebuild, done.

export type CompanyType = "agency" | "startup" | "sme" | "large";
export type Station = { name: string; type: CompanyType; role: string; start: string; end?: string; fullTime: boolean; note: string; stack: string; milestones?: { at: string; label: string }[] };

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
  // `fullTime: false` stints fold into one school row and are not counted in tenure.
  career: {
    school: { name: "Epitech", role: "Six-month stints alongside school", note: "Agency sites, a user-testing back office, an R&D tool in Go, e-commerce automation, real-time sports visuals" },
    types: { agency: "Agency", startup: "Startup", sme: "SME", large: "Large company" } as Record<CompanyType, string>,
    stations: [
      { name: "Adveris", type: "agency", role: "Full-stack developer", start: "2013-07", end: "2013-12", fullTime: false, note: "Eight client sites: storefronts, portals, e-commerce", stack: "PHP, WordPress, PrestaShop" },
      { name: "Testapic", type: "startup", role: "Full-stack developer", start: "2014-09", end: "2015-02", fullTime: false, note: "Back office for remote user testing", stack: "PHP, Zend, SQL" },
      { name: "Valeo", type: "large", role: "R&D project developer", start: "2015-03", end: "2015-08", fullTime: false, note: "Project tracking tool for the lighting R&D teams", stack: "Go" },
      { name: "ASC", type: "sme", role: "Full-stack developer", start: "2016-01", end: "2016-06", fullTime: false, note: "E-commerce automation: abandoned cart and post-purchase emails", stack: "Shopify, Liquid" },
      { name: "Solive", type: "startup", role: "Full-stack developer", start: "2016-09", end: "2017-02", fullTime: false, note: "Real-time sports visuals for clubs like PSG and Manchester City", stack: "Node.js, MongoDB" },
      { name: "Veepee", type: "large", role: "Front-end developer", start: "2017-03", end: "2019-05", fullTime: true, note: "Ticketing: SEO, time to first byte, a design system shared with the app", stack: "React, SSR, design systems" },
      { name: "Onepark", type: "startup", role: "Mobile engineer", start: "2019-06", end: "2020-01", fullTime: true, note: "Parking app on iOS and Android: maps, Stripe payments", stack: "React Native, TypeScript" },
      { name: "PayFit", type: "startup", role: "Software engineer, then senior", start: "2020-01", end: "2025-12", fullTime: true, note: "Monolith to microservices, then an event-sourced company lifecycle", stack: "Microservices, event sourcing, CQRS, DDD", milestones: [{ at: "2023-01", label: "Senior" }] },
      { name: "Doctolib", type: "startup", role: "Software engineer, Platform", start: "2026-01", fullTime: true, note: "Platform products that help engineers ship faster", stack: "Monorepos, Module Federation" },
    ] as Station[],
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
    // How many repos (largest total change first) show on the page; the rest open in a dialog.
    top: 5,
  },

  npm: {
    maintainer: "arnaud-zg",
    // Versions that only reserve a name (0.0.0, 0.0.0-x): not a release. A package whose latest
    // version is one of these is parked and stays off the page.
    parkedVersion: /^0\.0\.0(-|$)/,
    // The value in one line, shown under the Side quests title before the live numbers.
    pitch: "Open-source tools that take the toil out of shipping: releases, migrations, tech debt, mobile.",
    // A tool with no release in this many months folds into "Earlier".
    activeMonths: 24,
    // Treemap groups, in order. A tool joins the first group with a matching keyword or name part.
    groups: [
      { name: "Shipping", emoji: "🚢", match: ["release", "deploy", "migration", "database"] },
      { name: "Code health", emoji: "🩺", match: ["technical-debt", "code-quality", "eslint", "feature-flags"] },
      { name: "Mobile", emoji: "📱", match: ["expo", "react-native"] },
      { name: "AI agents", emoji: "🤖", match: ["llm", "ai-agents", "claude-code"] },
      { name: "Web build", emoji: "⚡", match: ["vite", "react", "frontend"] },
    ],
    otherGroup: "Other",
    otherEmoji: "🧪",
    // Tools smaller than this share of the treemap merge into "+n more" in their group.
    minShare: 0.03,
    // Every tile is drawn at least this share of the treemap so its name always fits.
    // The release count printed on it stays exact.
    minTileShare: 0.045,
  },

  substack: {
    feed: "https://arnaudzg.substack.com/feed",
  },
} as const;
