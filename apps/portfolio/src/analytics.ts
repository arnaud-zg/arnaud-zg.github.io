// This site's analytics settings, or nothing when no provider is set: then the page carries no
// analytics code and asks nothing.
import { providers } from "@arnaud-zg/analytics/providers";
import { activeProviders, type Settings } from "@arnaud-zg/analytics/settings";
import config from "../portfolio.config";

const active = activeProviders(config.analytics.providers, Object.keys(providers), process.env.ANALYTICS);
export const analytics: Settings | undefined = Object.keys(active).length ? active : undefined;
