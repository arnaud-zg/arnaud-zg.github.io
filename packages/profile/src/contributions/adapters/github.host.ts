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
      created_at: z.string(),
      closed_at: z.string().nullable(),
    }),
  ),
});
const Repository = z.object({ description: z.string().nullable() });
const Pull = z.object({ additions: z.number(), deletions: z.number() });
const Closing = z.object({
  data: z.record(
    z.string(),
    z
      .object({
        closingIssuesReferences: z.object({
          nodes: z.array(
            z.object({ url: z.string(), author: z.object({ login: z.string() }).nullable() }),
          ),
        }),
      })
      .nullable(),
  ),
});

const Calendar = z.object({
  data: z.object({
    user: z.object({
      contributionsCollection: z.object({
        contributionCalendar: z.object({ totalContributions: z.number() }),
      }),
    }),
  }),
});

type State = "merged" | "open";

export const githubHost = (web: Web): CodeHost => {
  const pullRequests = async (
    state: State,
    { author, outside }: { author: string; outside: string[] },
  ) => {
    const excluded = outside.map((owner) => `-user:${owner}`).join(" ");
    const query = encodeURIComponent(`author:${author} type:pr is:${state} is:public ${excluded}`);
    const found = await web.json(`${API}/search/issues?q=${query}&per_page=100`);
    return Found.parse(found).items.map((item) => ({
      repo: item.repository_url.replace(`${API}/repos/`, ""),
      title: item.title,
      url: item.html_url,
      date: (state === "merged" ? item.closed_at : null) ?? item.created_at,
    }));
  };

  return {
    mergedPullRequests: (asked) => pullRequests("merged", asked),
    openPullRequests: (asked) => pullRequests("open", asked),

    // REST does not say which issues a pull request closes: GraphQL does, all in one query.
    async issuesClosedBy(urls) {
      if (!urls.length) return {};
      const asked = urls.map(
        (url, at) =>
          `p${at}: resource(url: ${JSON.stringify(url)}) { ... on PullRequest {
            closingIssuesReferences(first: 10) { nodes { url author { login } } } } }`,
      );
      const { data } = Closing.parse(
        await web.json(`${API}/graphql`, { query: `query { ${asked.join("\n")} }` }),
      );
      const issuesOf = (at: number) =>
        (data[`p${at}`]?.closingIssuesReferences.nodes ?? []).map(({ url, author }) => ({
          url,
          author: author?.login ?? "",
        }));
      return Object.fromEntries(urls.map((url, at) => [url, issuesOf(at)]));
    },

    async repository(name) {
      const found = Repository.parse(await web.json(`${API}/repos/${name}`));
      return { description: found.description ?? "" };
    },

    async linesOf(url) {
      const path = url.replace("https://github.com/", "").replace("/pull/", "/pulls/");
      const { additions, deletions } = Pull.parse(await web.json(`${API}/repos/${path}`));
      return [additions, deletions];
    },

    // What the profile's calendar shows for the year: public, and private if the profile says so.
    async contributionsIn({ user, year }) {
      const span = `from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z"`;
      const query = `query { user(login: ${JSON.stringify(user)}) { contributionsCollection(${span}) {
        contributionCalendar { totalContributions } } } }`;
      const { data } = Calendar.parse(await web.json(`${API}/graphql`, { query }));
      return data.user.contributionsCollection.contributionCalendar.totalContributions;
    },
  };
};
