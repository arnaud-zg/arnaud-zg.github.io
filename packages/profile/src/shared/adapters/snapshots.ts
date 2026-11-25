import { z } from "zod";

const text = z.string();

// The saved data of every source. A snapshot that does not match stops the build.
export const Snapshots = z.object({
  github: z.object({
    prs: z.array(z.object({ repo: text, title: text, url: text, date: text })),
    repos: z.record(text, z.object({ stars: z.number(), about: text })),
    lines: z.record(text, z.tuple([z.number(), z.number()])),
  }),
  npm: z.array(
    z.object({
      name: text,
      downloads: z.number().optional(),
      downloadsMonth: text.optional(),
      line: text,
      href: text,
      keywords: z.array(text),
      updated: text,
      members: z.number(),
      releases: z.number(),
      version: text.optional(),
      created: text.optional(),
    }),
  ),
  skills: z.array(z.object({ name: text, use: text, href: text })),
  substack: z.array(z.object({ title: text, subtitle: text, url: text, date: text, image: text })),
});
