// What the site configures, and what that means for this run.
export type Config = { readonly posthogKey: string; readonly posthogRegion: string };
// `host` is where the site is live: events sent from anywhere else are tagged as local.
export type Settings =
  | { readonly provider: "mock" }
  | { readonly provider: "posthog"; readonly key: string; readonly region: "eu" | "us"; readonly host: string };

// `mode` is the ANALYTICS variable: "on" or "off". Unset, development is mocked, and a build uses
// PostHog when its key is filled. Nothing returned is no analytics at all.
export const settingsFor = (config: Config, run: { dev: boolean; host: string; mode?: string }): Settings | undefined => {
  const { posthogKey: key, posthogRegion: region } = config;
  if (run.mode !== undefined && run.mode !== "on" && run.mode !== "off") throw new Error(`ANALYTICS is "${run.mode}". Use "on" or "off", or leave it out.`);
  if (key.startsWith("phx_")) throw new Error("posthogKey is a personal key, which must stay secret: revoke it in PostHog. Use the project key, which starts with phc_.");
  if (key && !/^phc_\w+$/.test(key)) throw new Error("posthogKey is not a project key. It starts with phc_, in PostHog under Settings, Project.");
  if (region !== "eu" && region !== "us") throw new Error(`posthogRegion is "${region}". Use "eu" or "us", as in your PostHog address.`);
  if (run.mode === "off") return;
  if (run.mode === "on" && !key) throw new Error("ANALYTICS=on needs posthogKey. Without it, run without ANALYTICS to use the mock.");
  if (run.mode === undefined && run.dev) return { provider: "mock" };
  return key ? { provider: "posthog", key, region, host: run.host } : undefined;
};
