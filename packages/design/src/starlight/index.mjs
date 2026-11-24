// Starlight, in this design. Plain JavaScript: Astro reads it from astro.config, before anything
// is compiled. Use it as `starlight({ plugins: [design({ site })] })`.

const VIRTUAL = "virtual:design/site";
const RESOLVED = `\0${VIRTUAL}`;
const part = (name) => `@arnaud-zg/design/starlight/${name}.astro`;

/**
 * @param {{ site: { id: string, brand: string, sites: readonly { id: string, label: string, path: string, line: string, live: boolean }[] } }} options
 *   Who the site is. No photo: sub-sites have no hero.
 * @returns {import("@astrojs/starlight/types").StarlightPlugin}
 */
export default function design({ site }) {
  return {
    name: "design",
    hooks: {
      "config:setup"({ config, updateConfig, addIntegration, addRouteMiddleware }) {
        addRouteMiddleware({ entrypoint: "@arnaud-zg/design/starlight/head.ts" });
        // Sub-sites have no hero: pages start with their title.
        updateConfig({
          customCss: ["@arnaud-zg/design/styles/starlight.css", ...(config.customCss ?? [])],
          // A site's own overrides win.
          components: {
            ThemeProvider: part("ThemeProvider"),
            ThemeSelect: part("ThemeSelect"),
            SiteTitle: part("SiteTitle"),
            Footer: part("Footer"),
            ...config.components,
          },
          // Code blocks sit on the page in both themes.
          expressiveCode:
            config.expressiveCode === false
              ? false
              : {
                  themes: ["github-dark", "github-light"],
                  // A command is a command, not a picture of a terminal.
                  defaultProps: {
                    overridesByLang: { "sh,bash,shell,console,powershell": { frame: "none" } },
                  },
                  ...(typeof config.expressiveCode === "object" ? config.expressiveCode : {}),
                  styleOverrides: {
                    borderRadius: "16px",
                    borderColor: "var(--line)",
                    codeBackground: "var(--surface)",
                    codeFontFamily: "var(--mono)",
                    uiFontFamily: "var(--mono)",
                    frames: {
                      shadowColor: "transparent",
                      editorTabBarBackground: "transparent",
                      terminalTitlebarBackground: "transparent",
                      terminalBackground: "var(--surface)",
                      editorActiveTabBackground: "transparent",
                      editorActiveTabIndicatorTopColor: "transparent",
                      editorActiveTabIndicatorBottomColor: "var(--accent)",
                      terminalTitlebarBorderBottomColor: "var(--line)",
                      editorTabBarBorderBottomColor: "var(--line)",
                    },
                  },
                },
        });
        addIntegration({
          name: "design",
          hooks: {
            "astro:config:setup"({ updateConfig: update }) {
              update({
                vite: {
                  plugins: [
                    {
                      name: "design-site",
                      resolveId: (id) => (id === VIRTUAL ? RESOLVED : undefined),
                      load: (id) =>
                        id === RESOLVED
                          ? `export const site = ${JSON.stringify(site)};`
                          : undefined,
                    },
                  ],
                },
              });
            },
          },
        });
      },
    },
  };
}
