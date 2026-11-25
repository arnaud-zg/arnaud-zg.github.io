import type { Web } from "../../shared/ports/Web.ts";
import type { Article } from "../domain/Article.ts";
import type { Feed } from "../ports/Feed.ts";

const decode = (text: string) =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .trim();
const tagIn = ({ item, name }: { item: string; name: string }) =>
  decode(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(item)?.[1] ?? "");
const tidy = (text: string) => text.replace(/\s+\?$/, "").replace(/\s+([?!:;])/g, "$1");

const articleFrom = (item: string): Article => ({
  title: tagIn({ item, name: "title" }),
  subtitle: tidy(tagIn({ item, name: "description" })),
  url: tagIn({ item, name: "link" }),
  date: new Date(tagIn({ item, name: "pubDate" })).toISOString().slice(0, 10),
  image: /<enclosure url="([^"]+)"/.exec(item)?.[1] ?? "",
});

// The image hosts make a small cover of a multi-megabyte original.
const smallCover = (url: string) =>
  url
    .replace(/&amp;/g, "&")
    .replace(/(substackcdn\.com\/image\/fetch\/(?:\$s_![^/]*?!,)?)/, "$1w_720,h_480,c_fill,")
    .replace(/([?&])w=\d+/, "$1w=720&h=480&fit=crop");

export const substackFeed = ({ web, url }: { web: Web; url: string }): Feed => ({
  coverOf: smallCover,

  async articles() {
    const xml = await web.text(url);
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
    if (!items.length) throw new Error("no articles");
    return items.map(([, item]) => articleFrom(item));
  },
});
