// This site's analytics for this run, or nothing: then the page carries no analytics code and asks nothing.
import { settingsFor } from "@arnaud-zg/analytics/settings";
import config from "../portfolio.config";

export const analytics = settingsFor(config.analytics, {
  dev: import.meta.env.DEV,
  host: new URL(config.site.url).hostname,
  mode: process.env.ANALYTICS,
});
