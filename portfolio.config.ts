// What the portfolio shows, in one place. Data is fetched at build time; this file decides
// what to keep, how to group it and what to call it. Edit it, rebuild, done.

export type CompanyType = "agency" | "startup" | "sme" | "large";
// `highlights` are what a recruiter reads first: two or three things shipped, plain and specific.
// A milestone can carry a new title (a promotion), shown as the title progression.
export type Station = { name: string; type: CompanyType; industry?: string; role: string; start: string; end?: string; fullTime: boolean; note: string; highlights?: string[]; stack: string; milestones?: { at: string; label: string; title?: string }[] };

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

  // The last words on the page, above the profile links.
  ending: {
    title: "Let's catch up 👋",
    line: "A question, an idea, or just to say hi: I'd love to hear from you.",
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
    school: { name: "Early career", role: "Five six-month stints alongside Epitech", note: "Agency sites, a user-testing back office, an R&D tool in Go, e-commerce automation, real-time sports visuals" },
    // Education, newest first. `short` is what the summary strip shows.
    education: [
      { school: "Epitech", degree: "Master-level, Computer Software Engineering", start: "2012", end: "2017", short: "Master-level, Epitech",
        highlights: [
          "Five-year, project-based programme: learning by building, in teams, in C, C++ and C#",
          "Built a product from scratch over three years (Epitech Innovative Project), in an international team of six across three time zones",
          "Ran it like a real product: specifications, market study, architecture reviews, test strategy, planning and steering committees",
          "Shipped with C#, .NET, SQL, Angular and Apache Cordova",
        ] },
      { school: "Tongji University", degree: "Master's programme, Software Engineering", start: "2015", end: "2017",
        highlights: [
          "International university exchange, during the Epitech programme",
          "Trained for leadership roles in software development and project management",
          "Coursework in C++ and SQL",
        ] },
    ] as { school: string; degree: string; start: string; end: string; short?: string; highlights: string[] }[],
    types: { agency: "Agency", startup: "Startup", sme: "SME", large: "Large company" } as Record<CompanyType, string>,
    stations: [
      { name: "Adveris", type: "agency", role: "Full-stack developer", start: "2013-07", end: "2013-12", fullTime: false, note: "Eight client sites: storefronts, portals, e-commerce", stack: "PHP, WordPress, PrestaShop" },
      { name: "Testapic", type: "startup", role: "Full-stack developer", start: "2014-09", end: "2015-02", fullTime: false, note: "Back office for remote user testing", stack: "PHP, Zend, SQL" },
      { name: "Valeo", type: "large", role: "R&D project developer", start: "2015-03", end: "2015-08", fullTime: false, note: "Project tracking tool for the lighting R&D teams", stack: "Go" },
      { name: "ASC", type: "sme", role: "Full-stack developer", start: "2016-01", end: "2016-06", fullTime: false, note: "E-commerce automation: abandoned cart and post-purchase emails", stack: "Shopify, Liquid" },
      { name: "Solive", type: "startup", role: "Full-stack developer", start: "2016-09", end: "2017-02", fullTime: false, note: "Real-time sports visuals for clubs like PSG and Manchester City", stack: "Node.js, MongoDB" },
      { name: "Veepee", type: "large", industry: "E-commerce, ticketing", role: "Front-end Developer", start: "2017-03", end: "2019-05", fullTime: true, note: "Ticketing: SEO, time to first byte, a design system shared with the app", highlights: ["SEO with structured data and a faster time to first byte", "Components shared with the mobile app through the design system"], stack: "React, SSR, Design systems" },
      { name: "Onepark", type: "startup", industry: "Mobility", role: "Mobile Software Engineer", start: "2019-06", end: "2020-01", fullTime: true, note: "Parking app on iOS and Android: maps, Stripe payments", highlights: ["Parking booking app on iOS and Android, from one React Native codebase", "Maps across Google Maps, Mapbox and OpenStreetMap, with Stripe payments"], stack: "React Native, TypeScript" },
      { name: "PayFit", type: "startup", industry: "HR & payroll SaaS", role: "Software Engineer", start: "2020-01", end: "2025-12", fullTime: true, note: "Monolith to microservices, then an event-sourced company lifecycle", highlights: ["Moved a monolith to microservices, split by business domain with shared SDKs", "Designed the event-sourced company lifecycle with CQRS and DDD", "Owned latency and error SLOs for the services"], stack: "TypeScript, Microservices, Event sourcing, CQRS, DDD", milestones: [{ at: "2023-01", label: "Senior", title: "Senior Software Engineer" }] },
      { name: "Doctolib", type: "startup", industry: "Health tech", role: "Software Engineer, Platform", start: "2026-01", fullTime: true, note: "Platform products that help engineers ship faster", highlights: ["Platform products that help engineers ship faster"], stack: "Monorepos, Module Federation, TypeScript" },
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
    // Treemap groups, drawn in this order. A tool joins the first group with a matching keyword
    // or name part.
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
    minTileShare: 0.075,
    // Optional shorter descriptions, by package name, when the npm one is too long for a tile.
    lines: {
      "vite-workspace-resolver": "Resolves workspace package imports in Vite and Vitest",
    } as Record<string, string>,
  },

  // Agent skills, read from the "Available skills" table in this repo's README.
  skills: {
    repo: "arnaud-zg/skills",
    pitch: "Reusable workflows for AI coding agents, published and maintained: linted, tested and versioned, so they install cleanly instead of being copy-pasted.",
    // Named on the page as examples; the install command works with any agent that reads SKILL.md.
    agents: ["Claude Code", "Codex", "Cursor", "Copilot CLI", "Gemini CLI", "OpenCode"],
    install: "npx skills add arnaud-zg/skills",
  },

  substack: {
    feed: "https://arnaudzg.substack.com/feed",
  },
} as const;
