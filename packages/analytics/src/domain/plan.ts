// The tracking plan: four events, each a step from arriving to following through. Nothing outside it can be sent: the browser and the collector both check it,
// and the privacy dialog prints it.

type Rule = (value: unknown) => boolean;
const oneOf = (...values: string[]): Rule => (v) => typeof v === "string" && values.includes(v);
const slug: Rule = (v) => typeof v === "string" && /^[\w@./~-]{1,80}$/.test(v);
const seconds: Rule = (v) => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 3600;

// `question` is what the event answers; `shown` is what the visitor reads in the privacy dialog.
export const plan = {
  page_viewed: {
    question: "Where do visitors come from, and on what device?",
    shown: "The page, the kind of site you came from, and whether you use a phone, tablet or desktop",
    props: { source: oneOf("direct", "search", "linkedin", "github", "substack", "npm", "internal", "other"), device: oneOf("phone", "tablet", "desktop") },
  },
  section_read: {
    question: "Which parts hold attention, and for how long?",
    shown: "The sections you read, and for how many seconds",
    props: { section: slug, seconds },
  },
  content_explored: {
    question: "What makes visitors curious enough to act?",
    shown: "The tools and folded parts you open, and the commands you copy (never your clipboard)",
    props: { section: slug, action: oneOf("open-tool", "open-details", "copy-command"), item: slug },
  },
  link_followed: {
    question: "Do visitors go on to GitHub, LinkedIn, npm or Substack, and from where?",
    shown: "The links you follow out of this site",
    props: { section: slug, destination: oneOf("github", "linkedin", "substack", "npm", "other"), item: slug },
  },
} as const satisfies Record<string, { question: string; shown: string; props: Record<string, Rule> }>;

// Raise it when the plan collects something new: everyone is asked again.
export const PLAN_VERSION = 1;

export type EventName = keyof typeof plan;
export type Props = Record<string, string | number>;
export type AnalyticsEvent = { readonly name: EventName; readonly props: Props };

// Exactly the planned properties, each with a planned value; anything else is no event at all.
export const toEvent = (name: unknown, props: unknown): AnalyticsEvent | undefined => {
  if (typeof name !== "string" || !Object.hasOwn(plan, name)) return;
  if (typeof props !== "object" || props === null) return;
  const rules: Record<string, Rule> = plan[name as EventName].props;
  const given = props as Props;
  if (Object.keys(given).length !== Object.keys(rules).length) return;
  for (const [key, ok] of Object.entries(rules)) if (!Object.hasOwn(given, key) || !ok(given[key])) return;
  return { name: name as EventName, props: { ...given } };
};

const within = (host: string, domain: string) => host === domain || host.endsWith(`.${domain}`);
const known = (host: string) => (["github", "linkedin", "substack", "npm"] as const).find((k) => within(host, k === "npm" ? "npmjs.com" : `${k}.com`));

// Referrers are reduced to a kind of site before anything is sent.
export const sourceOf = (referrerHost: string, ownHost: string) => {
  if (!referrerHost) return "direct";
  if (referrerHost === ownHost) return "internal";
  if (/(^|\.)(google|bing|duckduckgo|ecosia|qwant|baidu|yahoo|brave)\./.test(referrerHost)) return "search";
  return known(referrerHost) ?? "other";
};

// Where a link goes: the site, and its path without query or fragment.
export const destinationOf = (host: string, path: string) => ({
  destination: known(host) ?? "other",
  item: path.replace(/^\/+|\/+$/g, "").replace(/[^\w@./~-]/g, "-").slice(0, 80) || host.slice(0, 80),
});

export const deviceOf = (width: number) => (width < 641 ? "phone" : width < 961 ? "tablet" : "desktop");
