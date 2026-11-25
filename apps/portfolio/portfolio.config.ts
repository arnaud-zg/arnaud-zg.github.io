// The whole portfolio, configured in one place.
//
// Data is fetched when the site builds, from four sources, each with a saved snapshot if it is
// down: GitHub (merged pull requests), npm (tools, releases, downloads), the skills repo README
// (agent skills) and Substack (articles). This file holds everything else: who I am, the words
// on the page, which sections show, and how fetched data is filtered and grouped.
//
// Sections:  site · hero · sections (page order) · labels · career · data sources
// Edit, rebuild, done. Fetched numbers are as fresh as the last deploy.

// `highlights` are what a recruiter reads first: two or three things shipped, plain and specific.
// A milestone can carry a new title (a promotion), shown as the title progression.
export type Station = {
  name: string;
  industry?: string;
  role: string;
  start: string;
  end?: string;
  fullTime: boolean;
  note?: string;
  highlights?: string[];
  stack: string;
  milestones?: { at: string; label: string; title?: string }[];
};

export default {
  // ─── Site ──────────────────────────────────────────────────────────────────────────────────
  site: {
    id: "home",
    url: "https://arnaud-zg.github.io",
    // Where the code lives, printed in the console with the version.
    source: "https://github.com/arnaud-zg/arnaud-zg.github.io",
    // Shown top left on every page.
    brand: "arnaud-zg",
    // One of the photos of @arnaud-zg/design, with its credit.
    photo: "bund",
    title: "Arnaud Zheng · Software engineer",
    description:
      "Arnaud Zheng, software engineer working on platform at Doctolib, previously senior engineer at PayFit. Open-source tools for monorepos, Expo and Vite, agent skills, and contributions to rspack and Module Federation.",
  },

  // Sites under the same address. Home follows BASE_PATH, which a preview ship sets, linked from the header and the footer. Turn `live` on once a
  // site is deployed: until then nothing links to it. Sub-sites keep the same list.
  sites: [
    {
      id: "home",
      label: "arnaud-zg",
      path: process.env.BASE_PATH ?? "/",
      line: "Portfolio",
      live: true,
    },
    {
      id: "js-packages",
      label: "js-packages",
      path: "/js-packages/",
      line: "TypeScript tools for monorepos",
      live: false,
    },
  ],

  // ─── Hero ──────────────────────────────────────────────────────────────────────────────────
  name: "Arnaud Zheng",
  // Describes src/assets/profile.jpeg, shown in About.
  portraitAlt: "Arnaud Zheng, smiling, with headphones around the neck",
  // Words between ** are shown in bold. Under the name: what I do, then where.
  tagline: "I build **features** people use, and the **tooling** that helps engineers ship them.",
  role: { text: "Software Engineer at", company: "Doctolib" },
  links: [
    { label: "GitHub", href: "https://github.com/arnaud-zg", icon: "github" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/arnaudzheng", icon: "linkedin" },
    { label: "Substack", href: "https://arnaudzg.substack.com", icon: "substack" },
  ],

  // ─── Sections, in page order ───────────────────────────────────────────────────────────────
  // `show: false` hides a section and its nav link. `nav` is the label in the header.
  sections: {
    // Figures under the hero, computed from the career and npm; only the words live here.
    glance: {
      show: true,
      years: "full-time, across startups and large companies",
      stay: "in one company, promoted to Senior",
      releases: "of open-source tools I build and maintain",
    },
    about: {
      show: true,
      nav: "About",
      title: "Hi, I'm Arnaud.",
      // Words between ** are shown in bold: two or three at most.
      lede: "Full-stack engineer. I shipped **product features**, then designed **event-sourced systems** with DDD. Now I build the **tools other engineers rely on**: release pipelines, database migration checks, bundler fixes.",
    },
    journey: {
      show: true,
      nav: "Journey",
      title: "Journey",
      lede: "From agency and startup to scale-up and large company.",
      educationTitle: "Education",
    },
    quests: {
      show: true,
      nav: "Side quests",
      title: "Side quests",
      lede: "Open-source tools that take the toil out of shipping: releases, migrations, tech debt, mobile.",
    },
    skills: {
      show: true,
      nav: "Skills",
      title: "Agent skills",
      lede: "Reusable workflows for AI coding agents, published and maintained: linted, tested and versioned, so they install cleanly instead of being copy-pasted.",
    },
    writing: { show: true, nav: "Writing", title: "Writing", lede: "Notes on code design." },
    openSource: {
      show: true,
      nav: "Open source",
      title: "Open source",
      moreTitle: "More projects",
      lede: "Fixes and features merged upstream, in tools other teams rely on. Largest first.",
    },
    // The last words on the page, above the profile links.
    ending: {
      show: true,
      title: "Let's catch up 👋",
      line: "A question, an idea, or just to say hi: I'd love to hear from you.",
    },
  },

  // ─── Labels ────────────────────────────────────────────────────────────────────────────────
  // The small words around fetched data.
  labels: {
    glance: "At a glance",
    years: "years",
    tools: "tools",
    now: "Now",
    at: "at",
    experience: "Full-time experience",
    education: "Education",
    stack: "Stack",
    skillsTaught: "Skills",
    then: "then",
    releases: "releases",
    plugins: "plugins",
    monthlyDownloads: "monthly downloads",
    downloadsIn: (month: string) => `npm downloads in ${month}`,
    monthlyReleases: "monthly releases",
    releasesIn: (month: string) => `releases in ${month}`,
    releasesTitle: (month: string) => `npm releases, ${month}`,
    downloadsTitle: (month: string) => `npm downloads, ${month}`,
    viewOnNpm: "View on npm",
    onNpm: (name: string) => `${name} on npm`,
    showDetails: (name: string) => `${name}: show details`,
    more: (n: number) => `+${n} more`,
    earlier: (n: number, from: string, to: string) => `See ${n} earlier libraries · ${from}–${to}`,
    skills: "skills",
    install: "Install, any agent",
    readArticles: "Read them on Substack",
    linesAdded: "lines added",
    linesRemoved: "lines removed",
    added: "added",
    removed: "removed",
    total: "Across every project",
    moreProjects: (n: number) => `${n} more ${n === 1 ? "project" : "projects"}`,
  },

  // ─── Analytics ─────────────────────────────────────────────────────────────────────────────
  // PostHog, set when building by POSTHOG_KEY and POSTHOG_REGION: see .env.example. Here, the words.
  // `pnpm dev` uses a mock. ANALYTICS=on uses PostHog there, ANALYTICS=off removes it anywhere.
  analytics: {
    words: {
      link: "Privacy",
      ask: "Can I learn from your visit?",
      askText:
        "I'd like to know which parts people read. No cookies, and I won't know who you are.",
      yes: "Yes",
      no: "No",
      more: "Details",
      title: "Privacy",
      state:
        "Nothing is sent unless you say yes. Change your mind here anytime. Do Not Track counts as a no, and so does Global Privacy Control.",
      listTitle: "If you say yes, I see",
      limits:
        "No cookies, name, location or profile. Your IP address reaches PostHog, but stays out of what it records.",
      who: (region: string) =>
        `I'm Arnaud Zheng. I ask for your consent, only to improve this site. PostHog keeps visits in ${region === "eu" ? "Germany" : "the United States"} for a year. I ask again after six months.`,
      rights:
        "I can't tell which visits are yours, so I can't look them up. You can complain to your data protection authority. Questions?",
      contact: "Write to me on LinkedIn",
    },
  },

  // ─── Career ────────────────────────────────────────────────────────────────────────────────
  // Career, oldest first. Months are "YYYY-MM"; leave `end` out for the current role.
  // `fullTime: false` stints fold into one school row and are not counted in tenure.
  career: {
    school: { name: "Early career", role: "Six-month internships alongside Epitech" },
    // Education, newest first. `short` is what the summary strip shows.
    education: [
      {
        school: "Epitech",
        degree: "Master-level, Computer Software Engineering",
        start: "2012",
        end: "2017",
        short: "Master-level, Epitech",
        highlights: [
          "Project-based learning, in teams",
          "3-year product built from scratch: team of 6, 3 time zones",
        ],
        skills: ["C", "C++", "C#", ".NET", "SQL", "Angular", "Project management"],
      },
      {
        school: "Tongji University",
        degree: "Master's programme, Software Engineering",
        start: "2015",
        end: "2017",
        highlights: ["International exchange", "Software engineering and project leadership"],
        skills: ["C++", "SQL", "Software engineering", "Leadership"],
      },
    ] as {
      school: string;
      degree: string;
      start: string;
      end: string;
      short?: string;
      highlights: string[];
      skills?: string[];
    }[],
    stations: [
      {
        name: "Adveris",
        role: "Full-stack developer",
        start: "2013-07",
        end: "2013-12",
        fullTime: false,
        note: "Eight projects: showcase sites, portals, e-commerce",
        stack: "PHP, WordPress, PrestaShop",
      },
      {
        name: "Testapic",
        role: "Full-stack developer",
        start: "2014-09",
        end: "2015-02",
        fullTime: false,
        note: "Back office to manage remote user tests",
        stack: "PHP, Zend, SQL",
      },
      {
        name: "Valeo",
        role: "R&D project developer",
        start: "2015-03",
        end: "2015-08",
        fullTime: false,
        note: "Internal tools for the lighting R&D teams, to track project progress",
        stack: "Go",
      },
      {
        name: "ASC",
        role: "Full-stack developer",
        start: "2016-01",
        end: "2016-06",
        fullTime: false,
        note: "In Shanghai: e-commerce email automation, abandoned cart and post-purchase",
        stack: "Shopify, Liquid",
      },
      {
        name: "Solive",
        role: "Full-stack developer",
        start: "2016-09",
        end: "2017-02",
        fullTime: false,
        note: "Real-time branded visuals for sports teams, published automatically on social media",
        stack: "Node.js, MongoDB",
      },
      {
        name: "Veepee",
        industry: "E-commerce, ticketing",
        role: "Front-end Developer",
        start: "2017-03",
        end: "2019-05",
        fullTime: true,
        highlights: [
          "Ticket sales for shows, museums and concerts: SEO with structured data, faster time to first byte",
          "Components shared with the mobile app through the design system",
        ],
        stack: "React, SSR, Design systems",
      },
      {
        name: "Onepark",
        industry: "Mobility",
        role: "Mobile Software Engineer",
        start: "2019-06",
        end: "2020-01",
        fullTime: true,
        highlights: [
          "Parking booking app on iOS and Android: better user experience and shopping funnel",
          "Maps on Google Maps, Mapbox and OpenStreetMap, payments with Stripe",
        ],
        stack: "React Native, TypeScript",
      },
      {
        name: "PayFit",
        industry: "HR & payroll SaaS",
        role: "Software Engineer",
        start: "2020-01",
        end: "2025-12",
        fullTime: true,
        highlights: [
          "Designed and built the event-sourced company lifecycle (CQRS, DDD), for data integrity and resilience",
          "Worked on the migration from a monolith to microservices, split by business domain, with SDKs and packages",
          "Monitored latency and error SLOs on the services",
        ],
        stack: "TypeScript, Microservices, Event sourcing, CQRS, DDD",
        milestones: [{ at: "2023-01", label: "Senior", title: "Senior Software Engineer" }],
      },
      {
        name: "Doctolib",
        industry: "Health tech",
        role: "Software Engineer, Platform",
        start: "2026-01",
        fullTime: true,
        highlights: ["Platform products that help engineers ship faster"],
        stack: "Monorepos, Module Federation, TypeScript",
      },
    ] as Station[],
  },

  // ─── Data sources ──────────────────────────────────────────────────────────────────────────
  // Open source: merged pull requests in other people's public repos.
  github: {
    user: "arnaud-zg",
    // Organisations I run. Work on their repos never counts as an open-source contribution.
    // Add an organisation here when you join or start one.
    ownOrgs: [
      "airmelon-studio",
      "contraband-corp",
      "crispy-best",
      "semaphore-corporation",
      "Solfanto",
      "hangry-community",
      "imagette",
    ],
    // Organisations to keep even though I am a member (my employer's open source counts).
    keepOrgs: ["doctolib"],
    // Repos that are not contributions: school group projects, data-file edits, sandboxes.
    excludeRepos: ["Orlands/snake-tj", "pqvst/cafeandcowork", "muan/hello-world"],
    // How many repos (largest total change first) show on the page; the rest open in a dialog.
    top: 5,
    // Projects with fewer stars than this are left out.
    minStars: 50,
    // Only changes that say something about the work: no chores, docs or bare "Update X".
    shownKinds: ["Feature", "Fix", "Performance", "Types", "Refactor", "Test"],
    trivial:
      /typo|console log|optimi[sz]e images|readme|faq|^docs\b|hello-world|update \S+\.json|add ".*" on/i,
    // How much each kind of change counts when projects are ranked.
    weights: {
      Feature: 3,
      Fix: 3,
      Performance: 3,
      Types: 2.5,
      Refactor: 2,
      Change: 1.5,
      Test: 1.5,
      Docs: 0.5,
    },
  },

  // Side quests: packages I maintain on npm, with last month's stable releases and downloads.
  npm: {
    maintainer: "arnaud-zg",
    // Versions that only reserve a name (0.0.0, 0.0.0-x): not a release. A package whose latest
    // version is one of these is parked and stays off the page.
    parkedVersion: /^0\.0\.0(-|$)/,
    // A tool with no release in this many months folds into "Earlier".
    activeMonths: 24,
    // Treemap groups, drawn in this order. A tool joins the first group with a matching keyword
    // or name part.
    groups: [
      { name: "Shipping", emoji: "🚢", match: ["release", "deploy", "migration", "database"] },
      {
        name: "Code health",
        emoji: "🩺",
        match: ["technical-debt", "code-quality", "eslint", "feature-flags"],
      },
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
    install: "npx skills add arnaud-zg/skills",
  },

  // Writing: the latest articles from the RSS feed.
  substack: {
    feed: "https://arnaudzg.substack.com/feed",
  },
} as const;
