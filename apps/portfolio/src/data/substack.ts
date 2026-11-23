// Published Substack articles, read from the RSS feed at build time.
// The saved copy in snapshots/ is used when the feed is unreachable.

export type Article = { title: string; subtitle: string; url: string; date: string; image: string };

import config from "../../portfolio.config";
import { fallback } from "../lib/fallback";
import saved from "./snapshots/substack.json";

const FEED = config.substack.feed;

// Ask the image CDNs for a small cover instead of the multi-megabyte original.
const small = (url: string) =>
  url
    .replace(/&amp;/g, "&")
    .replace(/(substackcdn\.com\/image\/fetch\/(?:\$s_![^/]*?!,)?)/, "$1w_720,h_480,c_fill,")
    .replace(/([?&])w=\d+/, "$1w=720&h=480&fit=crop");


const decode = (s: string) =>
  s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).trim();
const tag = (xml: string, name: string) => decode(xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1] ?? "");
const clean = (s: string) => s.replace(/\s+\?$/, "").replace(/\s+([?!:;])/g, "$1");

export async function getArticles(): Promise<Article[]> {
  let items: Article[];
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
    if (!parsed.length) throw new Error("no articles");
    items = parsed;
  } catch (error) {
    items = fallback<Article[]>("substack", error, saved);
  }
  return items.map((a) => ({ ...a, subtitle: clean(a.subtitle), image: a.image && small(a.image) }));
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
