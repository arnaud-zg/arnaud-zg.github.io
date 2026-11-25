import { z } from "zod";

import type { Web } from "../../shared/ports/Web.ts";
import type { PackageRegistry } from "../ports/PackageRegistry.ts";

const Found = z.object({
  objects: z.array(
    z.object({
      package: z.object({
        name: z.string(),
        version: z.string().default(""),
        date: z.string().default(""),
        description: z.string().default(""),
        keywords: z.array(z.string()).default([]),
        links: z.object({ npm: z.string().optional() }).optional(),
      }),
    }),
  ),
});
const PackageDocument = z.object({
  versions: z.record(z.string(), z.unknown()).default({}),
  time: z.record(z.string(), z.string().optional()).default({}),
});
const Point = z.object({ downloads: z.number() });
const Points = z.record(z.string(), Point.nullable());

const RETRY_AFTER_MS = 600;
const pause = () => new Promise((resume) => setTimeout(resume, RETRY_AFTER_MS));

export const npmRegistry = (web: Web): PackageRegistry => ({
  async publishedBy(maintainer) {
    const url = `https://registry.npmjs.org/-/v1/search?text=maintainer:${maintainer}&size=250`;
    const { objects } = Found.parse(await web.json(url));
    return objects.map(({ package: { links, date, ...found } }) => ({
      ...found,
      date: date.slice(0, 10),
      href: links?.npm ?? `https://www.npmjs.com/package/${found.name}`,
    }));
  },

  async versionsOf(name) {
    const found = PackageDocument.parse(await web.json(`https://registry.npmjs.org/${name}`));
    const versions = Object.keys(found.versions);
    return Object.fromEntries(versions.map((one) => [one, (found.time[one] ?? "").slice(0, 10)]));
  },

  // One call for every name, and one retry: npm rate-limits, which left some figures out.
  async downloadsIn({ month, names }) {
    const range = `${month.firstDay()}:${month.lastDay()}`;
    const ask = () => web.json(`https://api.npmjs.org/downloads/point/${range}/${names.join(",")}`);
    const body = await ask().catch(() => pause().then(ask));
    const points = names.length === 1 ? { [names[0]]: Point.parse(body) } : Points.parse(body);
    const figures = Object.entries(points).flatMap(([name, point]) =>
      point ? [[name, point.downloads] as const] : [],
    );
    return new Map(figures);
  },
});
