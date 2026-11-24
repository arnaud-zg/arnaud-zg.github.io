// Who this sub-site is, and its pages. Everything visual comes from @arnaud-zg/design.
export const repo = "https://github.com/arnaud-zg/js-packages";

// Keep `sites` in step with the portfolio's portfolio.config.ts.
export const info = {
  id: "js-packages",
  brand: "arnaud-zg",
  sites: [
    { id: "home", label: "arnaud-zg", path: "/", line: "Portfolio", live: true },
    {
      id: "js-packages",
      label: "js-packages",
      path: "/js-packages/",
      line: "TypeScript tools for monorepos",
      live: false,
    },
  ],
};

export const sidebar = [
  {
    label: "Packages",
    items: [
      "shiplane",
      "expo-native-guard",
      "expo-pnpm-catalog",
      "vite-workspace-resolver",
      "agent-context-budget",
    ],
  },
];
