import { z } from "zod";

import type { Web } from "../../shared/ports/Web.ts";
import type { CodeHost } from "../ports/CodeHost.ts";

const API = "https://api.github.com";
const Found = z.object({
  items: z.array(
    z.object({
      repository_url: z.string(),
      title: z.string(),
      html_url: z.string(),
      closed_at: z.string(),
    }),
  ),
});
const Repository = z.object({ stargazers_count: z.number(), description: z.string().nullish() });
const Pull = z.object({ additions: z.number(), deletions: z.number() });

export const githubHost = (web: Web): CodeHost => ({
  async mergedPullRequests({ author, outside }) {
    const excluded = outside.map((owner) => `-user:${owner}`).join(" ");
    const query = encodeURIComponent(`author:${author} type:pr is:merged is:public ${excluded}`);
    const found = await web.json(`${API}/search/issues?q=${query}&per_page=100`);
    return Found.parse(found).items.map((item) => ({
      repo: item.repository_url.replace(`${API}/repos/`, ""),
      title: item.title,
      url: item.html_url,
      date: item.closed_at,
    }));
  },

  async repository(name) {
    const found = Repository.parse(await web.json(`${API}/repos/${name}`));
    return { stars: found.stargazers_count, description: found.description ?? "" };
  },

  async linesOf(url) {
    const path = url.replace("https://github.com/", "").replace("/pull/", "/pulls/");
    const { additions, deletions } = Pull.parse(await web.json(`${API}/repos/${path}`));
    return [additions, deletions];
  },
});
