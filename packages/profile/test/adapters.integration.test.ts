// One contract per port: the in-memory adapter and the live one, on a web in memory, must agree.
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import type { TestContext } from "node:test";

import { memoryFeed } from "../src/articles/adapters/memory.feed.ts";
import { substackFeed } from "../src/articles/adapters/substack.feed.ts";
import { githubHost } from "../src/contributions/adapters/github.host.ts";
import { memoryHost } from "../src/contributions/adapters/memory.host.ts";
import { memoryRegistry } from "../src/quests/adapters/memory.registry.ts";
import { npmRegistry } from "../src/quests/adapters/npm.registry.ts";
import { ghWeb } from "../src/shared/adapters/gh.web.ts";
import { memoryWeb } from "../src/shared/adapters/memory.web.ts";
import { Month } from "../src/shared/domain/Month.ts";
import { memorySkills } from "../src/skills/adapters/memory.skills.ts";
import { readmeSkills } from "../src/skills/adapters/readme.skills.ts";

const kit = {
  name: "kit",
  version: "1.0.0",
  date: "2025-12-01",
  description: "A kit",
  keywords: ["k"],
  href: "https://www.npmjs.com/package/kit",
};
const other = { ...kit, name: "other", href: "https://www.npmjs.com/package/other" };
const month = Month.of("2025-12");
const POINT = "https://api.npmjs.org/downloads/point/2025-12-01:2025-12-31";
const npmAnswers = {
  "https://registry.npmjs.org/-/v1/search": {
    objects: [
      { package: { ...kit, date: "2025-12-01T10:00:00Z", href: undefined } },
      { package: { ...other, links: { npm: other.href } } },
    ],
  },
  "https://registry.npmjs.org/kit": {
    versions: { "0.9.0": {}, "1.0.0": {} },
    time: { "0.9.0": "2025-11-01T10:00:00Z", "1.0.0": "2025-12-01T10:00:00Z" },
  },
  [`${POINT}/kit,other`]: { kit: { downloads: 7 }, other: null },
  [`${POINT}/kit`]: { downloads: 7 },
};
const versions = { "0.9.0": "2025-11-01", "1.0.0": "2025-12-01" };
const registries = {
  memory: memoryRegistry({
    maintainer: "me",
    packages: [
      { ...kit, versions, downloads: 7 },
      { ...other, versions },
    ],
  }),
  npm: npmRegistry(memoryWeb(npmAnswers)),
};
for (const [name, registry] of Object.entries(registries))
  test(`${name} registry: packages, their versions and the downloads it knows`, async () => {
    assert.deepEqual(await registry.publishedBy("me"), [kit, other]);
    assert.deepEqual(await registry.versionsOf("kit"), versions);
    const figures = new Map([["kit", 7]]);
    assert.deepEqual(await registry.downloadsIn({ month, names: ["kit", "other"] }), figures);
    assert.deepEqual(await registry.downloadsIn({ month, names: ["kit"] }), figures);
    await assert.rejects(registry.versionsOf("missing"));
  });

const pull = { repo: "a/b", title: "fix: it", url: "https://github.com/a/b/pull/1", date: "2025" };
const review = { ...pull, url: "https://github.com/a/b/pull/2", date: "2026" };
const issue = { url: "https://github.com/a/b/issues/3", author: "me" };
const searched = (state: string) =>
  `https://api.github.com/search/issues?q=${encodeURIComponent(
    `author:me type:pr is:${state} is:public -user:mine`,
  )}&per_page=100`;
const itemOf = ({ title, url }: typeof pull) => ({
  repository_url: "https://api.github.com/repos/a/b",
  title,
  html_url: url,
});
const answers = memoryWeb({
  [searched("merged")]: { items: [{ ...itemOf(pull), created_at: "2024", closed_at: pull.date }] },
  [searched("open")]: { items: [{ ...itemOf(review), created_at: review.date, closed_at: null }] },
  "https://api.github.com/graphql": {
    data: {
      p0: { closingIssuesReferences: { nodes: [{ url: issue.url, author: { login: "me" } }] } },
      p1: { closingIssuesReferences: { nodes: [] } },
    },
  },
  "https://api.github.com/repos/a/b": { description: "B" },
  "https://api.github.com/repos/a/b/pulls/1": { additions: 3, deletions: 1 },
});
// GraphQL has one address: the calendar's query gets its own answer.
const calendar = {
  data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 42 } } } },
};
const github: typeof answers = {
  ...answers,
  json: (url, body) =>
    body?.query?.includes('user(login: "me")') && body.query.includes('from: "2025-01-01')
      ? Promise.resolve(calendar)
      : answers.json(url, body),
};
const hosts = {
  memory: memoryHost({
    pullRequests: [
      { ...pull, author: "me", lines: [3, 1] },
      { ...review, author: "me", lines: [1, 1], open: true, closes: [issue] },
      { ...pull, repo: "mine/c", author: "me", lines: [1, 1] },
    ],
    repositories: { "a/b": { description: "B" } },
    calendar: { 2025: 42 },
  }),
  github: githubHost(github),
};
for (const [name, host] of Object.entries(hosts))
  test(`${name} host: pull requests outside, the issues they close, their repository, lines and calendar`, async () => {
    const asked = { author: "me", outside: ["mine"] };
    assert.deepEqual(await host.mergedPullRequests(asked), [pull]);
    assert.deepEqual(await host.openPullRequests(asked), [review]);
    assert.deepEqual(await host.issuesClosedBy([review.url, pull.url]), {
      [review.url]: [issue],
      [pull.url]: [],
    });
    assert.deepEqual(await host.issuesClosedBy([]), {});
    assert.deepEqual(await host.repository("a/b"), { description: "B" });
    assert.deepEqual(await host.linesOf(pull.url), [3, 1]);
    assert.equal(await host.contributionsIn({ user: "me", year: 2025 }), 42);
    await assert.rejects(host.repository("a/missing"));
    await assert.rejects(host.linesOf("https://github.com/a/b/pull/404"));
  });

const url = "https://me.dev/feed";
const xml = `<item><title><![CDATA[Q &amp; A]]></title>
  <description>Why ?</description><link>https://me.dev/1</link>
  <pubDate>Wed, 05 Nov 2025 10:00:00 GMT</pubDate>
  <enclosure url="https://images.dev/a?w=2000" /></item>`;
const article = {
  title: "Q & A",
  subtitle: "Why",
  url: "https://me.dev/1",
  date: "2025-11-05",
  image: "https://images.dev/a?w=2000",
};
const substack = substackFeed({ web: memoryWeb({ [url]: xml }), url });
for (const [name, feed] of Object.entries({ memory: memoryFeed([article]), substack }))
  test(`${name} feed: articles, decoded`, async () => {
    assert.deepEqual(await feed.articles(), [article]);
  });
test("substack feed: a small cover", () => {
  assert.equal(substack.coverOf(article.image), "https://images.dev/a?w=720&h=480&fit=crop");
});

const README = "https://raw.githubusercontent.com/me/skills/HEAD/README.md";
const table =
  "| Do it | [`do-it`](./do) |\n| Go out | [`go`](https://go.dev) |\n| Explain | [`why`](./docs/why/README.md) |\n| Bare | [`bare`](./docs/bare/README.md) |\ntext";
const EXPLAINED = "https://raw.githubusercontent.com/me/skills/HEAD/docs/why/explanation.md";
const page =
  "# 💡 Explanation: why it works\n\n[📚 Docs](../README.md) › [why](README.md) · **💡\nExplanation**\n\n## A part\n\n```mermaid\nflowchart LR\n  A --> B\n```";
const skills = [
  { name: "do-it", use: "Do it", href: "https://github.com/me/skills/blob/HEAD/do" },
  { name: "go", use: "Go out", href: "https://go.dev" },
  {
    name: "why",
    use: "Explain",
    href: "https://github.com/me/skills/blob/HEAD/docs/why/README.md",
    explanation: {
      title: "Why it works",
      body: "## A part\n\n```mermaid\nflowchart LR\n  A --> B\n```",
    },
  },
  { name: "bare", use: "Bare", href: "https://github.com/me/skills/blob/HEAD/docs/bare/README.md" },
];
const lists = {
  memory: memorySkills(skills),
  readme: readmeSkills({
    web: memoryWeb({ [README]: table, [EXPLAINED]: page }),
    repo: "me/skills",
  }),
};
for (const [name, list] of Object.entries(lists))
  test(`${name} skills: each one, linked, with its explanation when it has one`, async () => {
    assert.deepEqual(await list.skills(), skills);
  });

test("npm registry: downloads that fail are asked once more", async () => {
  const web = memoryWeb(npmAnswers);
  let calls = 0;
  const flaky = {
    ...web,
    json: (asked: string) => {
      calls += 1;
      return calls === 1 ? Promise.reject(new Error("429")) : web.json(asked);
    },
  };
  const figures = await npmRegistry(flaky).downloadsIn({ month, names: ["kit"] });
  assert.deepEqual([figures.get("kit"), calls], [7, 2]);
});

test("an answer of the wrong shape is refused where it enters", async () => {
  const web = { text: () => Promise.resolve("oops"), json: () => Promise.resolve({ oops: 1 }) };
  await assert.rejects(npmRegistry(web).publishedBy("me"));
  await assert.rejects(npmRegistry(web).downloadsIn({ month, names: ["kit"] }));
  await assert.rejects(githubHost(web).mergedPullRequests({ author: "me", outside: [] }));
  await assert.rejects(githubHost(web).openPullRequests({ author: "me", outside: [] }));
  await assert.rejects(githubHost(web).issuesClosedBy([pull.url]));
  await assert.rejects(githubHost(web).repository("a/b"));
  await assert.rejects(githubHost(web).linesOf(pull.url));
  await assert.rejects(substackFeed({ web, url }).articles(), /no articles/);
  await assert.rejects(readmeSkills({ web, repo: "me/skills" }).skills(), /no skills table/);
});

// Stands in for gh: an executable that answers one address and refuses the rest.
const fakeGh = (t: TestContext) => {
  const dir = mkdtempSync(join(tmpdir(), "gh-"));
  t.after(() => rmSync(dir, { recursive: true }));
  const file = join(dir, "gh");
  writeFileSync(
    file,
    `#!/bin/sh
if [ "$1 $2" = "api https://api.github.com/ok" ] && [ -z "$3" ]; then echo '{"stars":9}'; exit 0; fi
if [ "$1 $2 $3 $4" = "api https://api.github.com/graphql -f query={ a }" ]; then echo '{"a":1}'; exit 0; fi
echo "gh: API rate limit exceeded (HTTP 403)" >&2
exit 1
`,
  );
  chmodSync(file, 0o755);
  return file;
};

test("gh web: what gh answers, as text and as JSON", async (t) => {
  const web = ghWeb(fakeGh(t));
  assert.deepEqual(await web.json("https://api.github.com/ok"), { stars: 9 });
  assert.equal(await web.text("https://api.github.com/ok"), '{"stars":9}\n');
});

test("gh web: a body is posted as gh's fields", async (t) => {
  const web = ghWeb(fakeGh(t));
  assert.deepEqual(await web.json("https://api.github.com/graphql", { query: "{ a }" }), { a: 1 });
});

test("gh web: a refusal gives gh's own reason", async (t) => {
  await assert.rejects(ghWeb(fakeGh(t)).json("https://api.github.com/no"), {
    message: "gh: API rate limit exceeded (HTTP 403): https://api.github.com/no",
  });
});

test("gh web: a missing gh says so", async () => {
  await assert.rejects(ghWeb("/missing/gh").json("https://api.github.com/ok"), {
    message: "gh is not installed: https://cli.github.com",
  });
});
