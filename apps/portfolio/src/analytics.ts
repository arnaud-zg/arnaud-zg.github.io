// This site's analytics for this run, or nothing: then the page carries no analytics code and asks
// nothing. Read from the environment while building, or from .env: nothing is written in the code.
import { settingsFor } from "@arnaud-zg/analytics/settings";
import config from "../portfolio.config";

const posthogKey = process.env.POSTHOG_KEY || import.meta.env.POSTHOG_KEY || "";
export const posthogRegion: string = process.env.POSTHOG_REGION || import.meta.env.POSTHOG_REGION || "eu";

export const analytics = settingsFor({ posthogKey, posthogRegion }, {
  dev: import.meta.env.DEV,
  host: new URL(config.site.url).hostname,
  // Empty is unset, so a ship can leave it to the settings.
  mode: process.env.ANALYTICS || undefined,
});

if (!analytics && process.env.ANALYTICS !== "off") console.warn("[analytics] off: POSTHOG_KEY is not set");
