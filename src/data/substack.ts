// Published Substack articles, read from the RSS feed at build time.
// The snapshot below is used when the feed is unreachable.

export type Article = { title: string; subtitle: string; url: string; date: string; image: string };

import config from "../../portfolio.config";

const FEED = config.substack.feed;

// Ask the image CDNs for a small cover instead of the multi-megabyte original.
const small = (url: string) =>
  url
    .replace(/&amp;/g, "&")
    .replace(/(substackcdn\.com\/image\/fetch\/(?:\$s_![^/]*?!,)?)/, "$1w_720,h_480,c_fill,")
    .replace(/([?&])w=\d+/, "$1w=720&h=480&fit=crop");

const snapshot: Article[] = [
  { title: "Applying Object Calisthenics Principles to Front-End Applications", subtitle: "How object calisthenics make your user interface code cleaner", url: "https://arnaudzg.substack.com/p/applying-object-calisthenics-principles", date: "2025-11-05", image: "https://images.unsplash.com/photo-1502904550040-7534597429ae?ixlib=rb-4.1.0&fm=jpg&q=60&w=3000" },
  { title: "Effective feature flag management", subtitle: "The cost of neglecting feature flags: risks and best practices", url: "https://arnaudzg.substack.com/p/effective-feature-flag-management", date: "2025-05-26", image: "https://substackcdn.com/image/fetch/$s_!zkP7!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fbcf9f1c1-6653-401e-90d1-69ed32aa418b_2992x2992.jpeg" },
  { title: "Simplicity Meets Power: The Role of Variants in Software Development", subtitle: "Insights from Coffee Machine Comparisons to Software Design", url: "https://arnaudzg.substack.com/p/simplicity-power-variants-software-development", date: "2024-10-18", image: "https://substackcdn.com/image/fetch/$s_!BxbW!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F5e3fce66-5c6f-429e-bec4-945dd1000c8b_640x640.jpeg" },
  { title: "Why I'm Starting a Tech Blog Now", subtitle: "Plant your tree today; it’s never too late", url: "https://arnaudzg.substack.com/p/why-im-starting-a-tech-blog-now", date: "2024-09-24", image: "https://substackcdn.com/image/fetch/$s_!a6Ff!,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F0bc871ea-c1d1-4722-b40f-742de5e72476_7952x5304.jpeg" },
];

const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).trim();
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "");
const clean = (s: string) => s.replace(/\s+\?$/, "").replace(/\s+([?!:;])/g, "$1");

export async function getArticles(): Promise<Article[]> {
  let items: Article[] = snapshot;
  try {
    const res = await fetch(FEED, { headers: { "User-Agent": "portfolio-build" }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(String(res.status));
    const xml = await res.text();
    const parsed = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => ({
      title: tag(it, "title"),
      subtitle: clean(tag(it, "description")),
      url: tag(it, "link"),
      date: new Date(tag(it, "pubDate")).toISOString().slice(0, 10),
      image: it.match(/<enclosure url="([^"]+)"/)?.[1] ?? "",
    }));
    if (parsed.length) items = parsed;
  } catch (error) {
    console.warn(`[substack] using snapshot: ${(error as Error).message}`);
  }
  return items.map((a) => ({ ...a, subtitle: clean(a.subtitle), image: a.image && small(a.image) }));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
