import { z } from "zod";

const text = z.string();
const pullRequests = z.array(z.object({ repo: text, title: text, url: text, date: text }));

// The saved data of every source. A snapshot that does not match stops the build.
export const Snapshots = z.object({
  github: z.object({
    prs: pullRequests,
    open: pullRequests,
    closes: z.record(text, z.array(text)),
    repos: z.record(text, z.object({ about: text })),
    lines: z.record(text, z.tuple([z.number(), z.number()])),
    // `asOf` and `yearlyReleases` are missing from data saved before they were read: the release's
    // refresh fills them in, and until then the figure is not shown.
    contributions: z.object({ total: z.number(), asOf: text.optional() }),
  }),
  npm: z.array(
    z.object({
      name: text,
      month: text,
      downloads: z.number().optional(),
      line: text,
      href: text,
      keywords: z.array(text),
      updated: text,
      members: z.number(),
      releases: z.number(),
      monthlyReleases: z.number(),
      yearlyReleases: z.number().optional(),
    }),
  ),
  skills: z.array(
    z.object({
      name: text,
      use: text,
      href: text,
      explanation: z.object({ title: text, body: text }).optional(),
    }),
  ),
  substack: z.array(z.object({ title: text, subtitle: text, url: text, date: text, image: text })),
});
